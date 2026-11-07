// Punto de entrada de impresión de tickets.
// Cada adaptador recibe el HTML/datos del ticket y lo manda a su impresora.

import { leerConfigImpresion } from './config';
import { imprimirConNavegador } from './navegador';
import { imprimirBluetooth } from './bluetooth';
import { ticketEscPos } from './escpos';
import { LOGO_PATH, ticketHtml } from './ticketHtml';

export { leerConfigImpresion, guardarConfigImpresion, DEFAULT_PRINT_CONFIG } from './config';
export {
  bluetoothDisponible,
  conectarBluetooth,
  estadoBluetooth,
  olvidarBluetooth,
  reconectarBluetooth,
  suscribirBluetooth
} from './bluetooth';

// ¿Se debe imprimir solo al terminar el cobro? Solo membresías y con el automático encendido.
export function debeImprimirAutomatico(ticket) {
  return Boolean(ticket?.membresia) && leerConfigImpresion().auto;
}

export async function imprimirTicket(ticket, { copia = false, config } = {}) {
  if (!ticket) throw new Error('No hay ticket para imprimir');
  const cfg = config || leerConfigImpresion();

  if (cfg.adaptador === 'bluetooth') {
    const bytes = await ticketEscPos(ticket, {
      copia,
      ancho: cfg.ancho,
      copias: copia ? 1 : cfg.copias,
      conLogo: cfg.logoBluetooth !== false
    });
    await imprimirBluetooth(bytes);
    return;
  }

  const html = ticketHtml(ticket, {
    copia,
    ancho: cfg.ancho,
    copias: copia ? 1 : cfg.copias,
    logoUrl: `${window.location.origin}${LOGO_PATH}`
  });
  await imprimirConNavegador(html);
}

// Ticket de ejemplo para el botón "Imprimir prueba" de la configuración.
export function ticketDePrueba() {
  const hoy = new Date();
  const ymd = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const fin = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    folio: 0,
    copia: false,
    dry_run: true,
    negocio: 'Pitbulls Gym',
    pie: 'Gracias por entrenar con nosotros',
    fecha: hoy.toISOString(),
    cajero: 'Recepción',
    cliente: { id: '', nombre: 'José Peña (prueba)' },
    items: [{ producto: 'MENSUALIDAD', cantidad: 1, precio_unitario: 350, subtotal: 350 }],
    membresia: { nombre: 'MENSUALIDAD', inicio: ymd(hoy), fin: ymd(fin) },
    total: 350,
    metodo: 'Efectivo'
  };
}
