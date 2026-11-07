// Arma el HTML del ticket térmico (58 u 80 mm) a partir del objeto `ticket` del API.

export const LOGO_PATH = '/assets/ticket/logo_ticket_58mm.png';

const TZ = 'America/Mexico_City';

const escapar = (texto) =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const dinero = (n) => `$${Number(n || 0).toFixed(2)}`;

export const fechaHora = (iso) => {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
      .format(new Date(iso))
      .replace(',', '');
  } catch (e) {
    return '';
  }
};

// "2026-11-07" -> "07/11/2026" (sin pasar por Date, para no cambiar de día por zona horaria)
export const fechaCorta = (ymd) => {
  const [y, m, d] = String(ymd || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};

const fila = (izq, der, clase = '') =>
  `<div class="fila ${clase}"><span>${izq}</span><span>${der}</span></div>`;

function cuerpoTicket(ticket, { copia, logoUrl }) {
  const items = (ticket.items || [])
    .map((it) => fila(`${it.cantidad} x ${escapar(it.producto)}`, dinero(it.subtotal)))
    .join('');

  const avisos = [
    ticket.dry_run ? '<div class="aviso">*** PRUEBA - NO VALIDO ***</div>' : '',
    copia ? '<div class="aviso">COPIA</div>' : ''
  ].join('');

  const membresia = ticket.membresia
    ? `<div class="sep"></div>
       <div class="bold">Vigencia</div>
       ${fila('Del:', fechaCorta(ticket.membresia.inicio))}
       ${fila('Al:', fechaCorta(ticket.membresia.fin))}`
    : '';

  return `
    <section class="ticket">
      <img class="logo" src="${logoUrl}" alt="${escapar(ticket.negocio)}" />
      ${avisos}
      <div class="sep"></div>
      ${ticket.folio ? fila('Folio:', ticket.folio) : ''}
      ${fila('Fecha:', fechaHora(ticket.fecha))}
      ${ticket.cajero ? fila('Atendió:', escapar(ticket.cajero)) : ''}
      ${ticket.cliente?.nombre ? `<div>Cliente: ${escapar(ticket.cliente.nombre)}</div>` : ''}
      <div class="sep"></div>
      ${items}
      <div class="sep"></div>
      ${fila('TOTAL', dinero(ticket.total), 'bold grande')}
      ${fila('Pago:', escapar(ticket.metodo))}
      ${membresia}
      <div class="sep"></div>
      <div class="pie">${escapar(ticket.pie)}</div>
    </section>`;
}

export function ticketHtml(ticket, { copia = false, ancho = 58, copias = 1, logoUrl } = {}) {
  const anchoPapel = ancho === 80 ? 80 : 58;
  const anchoImpreso = anchoPapel === 80 ? 72 : 48; // área imprimible típica
  const total = Math.max(1, Math.min(3, Number(copias) || 1));
  const cuerpos = Array.from({ length: total }, () => cuerpoTicket(ticket, { copia, logoUrl })).join(
    '<div class="corte"></div>'
  );

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Ticket ${escapar(ticket.folio || '')}</title>
<style>
  /* El largo lo decide el papel configurado en el driver de la impresora (rollo de ${anchoPapel} mm). */
  @page { margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  /* Letra gruesa y negro puro: en térmica (203 dpi) los trazos finos salen tenues */
  body { width: ${anchoImpreso}mm; margin: 0 auto; padding: 2mm 0 1mm;
         font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700;
         line-height: 1.35; -webkit-font-smoothing: none; }
  .logo { display: block; width: 100%; height: auto; margin: 0 auto 1mm; image-rendering: pixelated; }
  .aviso { text-align: center; font-weight: 900; margin: 1mm 0; }
  .sep { border-top: 2px dashed #000; margin: 1.5mm 0; }
  .fila { display: flex; justify-content: space-between; gap: 2mm; }
  .fila span:first-child { overflow-wrap: anywhere; }
  .fila span:last-child { white-space: nowrap; }
  .bold { font-weight: 900; }
  .grande { font-size: 15px; }
  .pie { text-align: center; margin-top: 1mm; }
  .corte { page-break-after: always; break-after: page; height: 6mm; }
</style>
</head>
<body>${cuerpos}</body>
</html>`;
}
