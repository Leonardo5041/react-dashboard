// Adaptador "bluetooth": manda bytes ESC/POS a una impresora BLE con Web Bluetooth.
// Basado en pos-tienditas/frontend/src/hooks/useBLEPrinter.ts.
// Requiere Chrome o Edge (PC o Android) y HTTPS o localhost. No funciona en iPhone ni Firefox.

// Pares servicio/característica de escritura que usan las impresoras BLE más comunes.
const KNOWN_PAIRS = [
  { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
  { service: '0000ff00-0000-1000-8000-00805f9b34fb', char: '0000ff02-0000-1000-8000-00805f9b34fb' },
  { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
  { service: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', char: 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f' }
];

const DEVICE_KEY = 'ble_printer_device_id';
const SERVICE_KEY = 'ble_printer_service';
const NAME_KEY = 'ble_printer_name';

// Bloques chicos con pausa: muchas impresoras baratas pierden datos con bloques grandes.
const CHUNK = 100;
const PAUSA_MS = 15;
const CHUNK_SEGURO = 20; // si la impresora rechaza bloques de 100, se reintenta con 20

// Conexión única en memoria (se conserva al navegar, se pierde al recargar).
let device = null;
let characteristic = null;
const listeners = new Set();

const leer = (k) => {
  try {
    return window.localStorage.getItem(k);
  } catch (e) {
    return null;
  }
};
const escribir = (k, v) => {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, v);
  } catch (e) {
    // sin almacenamiento: se emparejará de nuevo la próxima vez
  }
};

export function bluetoothDisponible() {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function estadoBluetooth() {
  return {
    disponible: bluetoothDisponible(),
    conectada: Boolean(characteristic && device?.gatt?.connected),
    emparejada: Boolean(leer(DEVICE_KEY)),
    nombre: device?.name || leer(NAME_KEY) || ''
  };
}

export function suscribirBluetooth(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const avisar = () => listeners.forEach((fn) => fn(estadoBluetooth()));

async function buscarCaracteristica(server) {
  const guardado = leer(SERVICE_KEY);
  const pares = guardado
    ? [...KNOWN_PAIRS.filter((p) => p.service === guardado), ...KNOWN_PAIRS.filter((p) => p.service !== guardado)]
    : KNOWN_PAIRS;
  for (const par of pares) {
    try {
      const svc = await server.getPrimaryService(par.service);
      const ch = await svc.getCharacteristic(par.char);
      escribir(SERVICE_KEY, par.service);
      return ch;
    } catch (e) {
      // se prueba el siguiente par
    }
  }
  throw new Error('Impresora Bluetooth no reconocida');
}

function alDesconectar() {
  characteristic = null;
  avisar();
}

async function enlazar(dev) {
  const server = await dev.gatt.connect();
  characteristic = await buscarCaracteristica(server);
  if (device !== dev) {
    device?.removeEventListener?.('gattserverdisconnected', alDesconectar);
    dev.addEventListener('gattserverdisconnected', alDesconectar);
  }
  device = dev;
  escribir(DEVICE_KEY, dev.id);
  escribir(NAME_KEY, dev.name || '');
  avisar();
}

// Emparejar: abre el selector de Chrome. Debe llamarse desde un clic del usuario.
export async function conectarBluetooth() {
  if (!bluetoothDisponible()) throw new Error('Este navegador no soporta Bluetooth (usa Chrome o Edge)');
  const dev = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: KNOWN_PAIRS.map((p) => p.service)
  });
  await enlazar(dev);
}

// Reconectar sin selector a la impresora ya emparejada (si el navegador lo permite).
export async function reconectarBluetooth() {
  if (characteristic && device?.gatt?.connected) return true;
  if (device) {
    await enlazar(device);
    return true;
  }
  const id = leer(DEVICE_KEY);
  if (!id || !bluetoothDisponible() || typeof navigator.bluetooth.getDevices !== 'function') return false;
  const dispositivos = await navigator.bluetooth.getDevices();
  const guardado = dispositivos.find((d) => d.id === id);
  if (!guardado) return false;
  await enlazar(guardado);
  return true;
}

export function olvidarBluetooth() {
  try {
    device?.gatt?.disconnect();
  } catch (e) {
    // ya estaba desconectada
  }
  device = null;
  characteristic = null;
  escribir(DEVICE_KEY, null);
  escribir(SERVICE_KEY, null);
  escribir(NAME_KEY, null);
  avisar();
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function escribirBloques(ch, data, tam) {
  for (let i = 0; i < data.length; i += tam) {
    const bloque = data.slice(i, i + tam);
    try {
      if (ch.writeValueWithoutResponse) await ch.writeValueWithoutResponse(bloque);
      else await ch.writeValue(bloque);
    } catch (e) {
      e.enviados = i; // bytes que sí llegaron antes del error
      throw e;
    }
    await esperar(PAUSA_MS);
  }
}

export async function imprimirBluetooth(data) {
  const ok = await reconectarBluetooth().catch(() => false);
  if (!ok || !characteristic) {
    throw new Error('Impresora Bluetooth no conectada. Conéctala desde el engrane de Punto de Venta.');
  }
  try {
    await escribirBloques(characteristic, data, CHUNK);
  } catch (e) {
    // Si falló el primer bloque, la impresora no acepta 100 bytes: se reintenta con 20
    // (MTU mínimo de BLE). Si ya se había mandado algo, no se repite para no duplicar.
    if (e.enviados !== 0) throw new Error('Se perdió la conexión con la impresora a mitad del ticket');
    await escribirBloques(characteristic, data, CHUNK_SEGURO);
  }
}
