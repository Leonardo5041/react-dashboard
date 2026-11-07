// Configuración de impresión por estación (se guarda en el navegador de esta PC).

const STORAGE_KEY = 'pos-impresora';

export const DEFAULT_PRINT_CONFIG = {
  adaptador: 'navegador', // 'navegador' (USB vía impresión del navegador) o 'bluetooth' (ESC/POS por BLE)
  auto: true, // imprimir solo al cobrar una membresía
  ancho: 58, // ancho de papel en mm: 58 u 80
  copias: 1,
  logoBluetooth: true // en Bluetooth el logo tarda ~1-2 s más; se puede apagar
};

export function leerConfigImpresion() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PRINT_CONFIG };
    return { ...DEFAULT_PRINT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_PRINT_CONFIG };
  }
}

export function guardarConfigImpresion(config) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    // Sin almacenamiento disponible: se usa la configuración por defecto.
  }
}
