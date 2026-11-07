// Genera los bytes ESC/POS del ticket (para impresoras Bluetooth).
// Comandos y codificación CP850 basados en estacionamiento.ts, probados en Xprinter.

import { LOGO_PATH, dinero, fechaCorta, fechaHora } from './ticketHtml';

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: [ESC, 0x40],
  CODEPAGE_850: [ESC, 0x74, 0x02],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  SIZE_NORMAL: [GS, 0x21, 0x00],
  SIZE_2H: [GS, 0x21, 0x01], // doble alto (mantiene el ancho de línea)
  FEED: (n) => [ESC, 0x64, n],
  CUT_PARCIAL: [GS, 0x56, 0x42, 0x00]
};

// Caracteres en español → CP850. Lo que no esté aquí y no sea ASCII sale como "?".
const CP850 = {
  'á': 0xa0, 'é': 0x82, 'í': 0xa1, 'ó': 0xa2, 'ú': 0xa3,
  'Á': 0xb5, 'É': 0x90, 'Í': 0xd6, 'Ó': 0xe0, 'Ú': 0xe9,
  'ñ': 0xa4, 'Ñ': 0xa5, 'ü': 0x81, 'Ü': 0x9a,
  '¿': 0xa8, '¡': 0xad, '°': 0xf8, 'º': 0xa7, 'ª': 0xa6
};

function encode(texto) {
  const bytes = [];
  for (const ch of String(texto ?? '')) {
    const code = ch.codePointAt(0);
    if (code < 128) bytes.push(code);
    else if (CP850[ch] !== undefined) bytes.push(CP850[ch]);
    else bytes.push(0x3f);
  }
  return bytes;
}

// Parte un texto en líneas de `ancho` caracteres sin cortar palabras.
function ajustar(texto, ancho) {
  const lineas = [];
  let actual = '';
  for (const palabra of String(texto ?? '').split(/\s+/).filter(Boolean)) {
    if (palabra.length > ancho) {
      if (actual) lineas.push(actual);
      for (let i = 0; i < palabra.length; i += ancho) lineas.push(palabra.slice(i, i + ancho));
      actual = '';
    } else if (!actual) {
      actual = palabra;
    } else if (actual.length + 1 + palabra.length <= ancho) {
      actual += ` ${palabra}`;
    } else {
      lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

// ─── Logo como imagen raster (GS v 0) ───────────────────────────────────────

const LOGO_ANCHO_PX = 256; // más chico que en USB: por Bluetooth cada byte cuenta
const BANDA_FILAS = 48; // el raster se manda en bandas para no llenar el búfer de la impresora

let logoCache = null;

async function cargarLogoRaster() {
  if (logoCache) return logoCache;
  const img = new Image();
  img.src = LOGO_PATH;
  await img.decode();

  const ancho = LOGO_ANCHO_PX;
  const alto = Math.round((img.naturalHeight * ancho) / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(img, 0, 0, ancho, alto);
  const { data } = ctx.getImageData(0, 0, ancho, alto);

  const bytesPorFila = ancho / 8;
  const bits = new Uint8Array(bytesPorFila * alto);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const i = (y * ancho + x) * 4;
      const luz = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luz < 128) bits[y * bytesPorFila + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  logoCache = { bits, bytesPorFila, alto };
  return logoCache;
}

function rasterBytes({ bits, bytesPorFila, alto }) {
  const out = [];
  for (let y0 = 0; y0 < alto; y0 += BANDA_FILAS) {
    const filas = Math.min(BANDA_FILAS, alto - y0);
    out.push(GS, 0x76, 0x30, 0x00, bytesPorFila & 0xff, bytesPorFila >> 8, filas & 0xff, filas >> 8);
    const inicio = y0 * bytesPorFila;
    for (let i = inicio; i < inicio + filas * bytesPorFila; i++) out.push(bits[i]);
  }
  return out;
}

// ─── Ticket ────────────────────────────────────────────────────────────────

function cuerpo(ticket, { copia, ancho, logo }) {
  const b = [];
  const p = (bytes) => b.push(...bytes);
  const linea = (texto = '') => p([...encode(texto), LF]);
  const fila = (izq, der) => {
    const i = String(izq);
    const d = String(der);
    const espacios = Math.max(1, ancho - i.length - d.length);
    linea(i + ' '.repeat(espacios) + d);
  };
  const sep = () => linea('-'.repeat(ancho));

  p(CMD.INIT);
  p(CMD.CODEPAGE_850);
  p(CMD.ALIGN_CENTER);
  if (logo) {
    p(rasterBytes(logo));
  } else {
    p(CMD.SIZE_2H);
    p(CMD.BOLD_ON);
    linea(ticket.negocio || 'Pitbulls Gym');
    p(CMD.BOLD_OFF);
    p(CMD.SIZE_NORMAL);
  }
  p(CMD.BOLD_ON);
  if (ticket.dry_run) linea('*** PRUEBA - NO VALIDO ***');
  if (copia) linea('COPIA');
  p(CMD.BOLD_OFF);

  p(CMD.ALIGN_LEFT);
  sep();
  if (ticket.folio) fila('Folio:', ticket.folio);
  fila('Fecha:', fechaHora(ticket.fecha));
  if (ticket.cajero) ajustar(`Atendió: ${ticket.cajero}`, ancho).forEach((l) => linea(l));
  if (ticket.cliente?.nombre) ajustar(`Cliente: ${ticket.cliente.nombre}`, ancho).forEach((l) => linea(l));
  sep();

  for (const it of ticket.items || []) {
    const importe = dinero(it.subtotal);
    const desc = `${it.cantidad} x ${it.producto}`;
    const max = ancho - importe.length - 1;
    const partes = ajustar(desc, max);
    partes.slice(0, -1).forEach((l) => linea(l));
    fila(partes.at(-1) || '', importe);
  }
  sep();

  p(CMD.BOLD_ON);
  p(CMD.SIZE_2H);
  fila('TOTAL', dinero(ticket.total));
  p(CMD.SIZE_NORMAL);
  p(CMD.BOLD_OFF);
  fila('Pago:', ticket.metodo);

  if (ticket.membresia) {
    sep();
    p(CMD.BOLD_ON);
    linea('Vigencia');
    p(CMD.BOLD_OFF);
    fila('Del:', fechaCorta(ticket.membresia.inicio));
    fila('Al:', fechaCorta(ticket.membresia.fin));
  }
  sep();

  p(CMD.ALIGN_CENTER);
  ajustar(ticket.pie, ancho).forEach((l) => linea(l));
  p(CMD.FEED(3));
  p(CMD.CUT_PARCIAL);
  return b;
}

export async function ticketEscPos(ticket, { copia = false, ancho = 58, copias = 1, conLogo = true } = {}) {
  const caracteres = ancho === 80 ? 48 : 32;
  let logo = null;
  if (conLogo) {
    try {
      logo = await cargarLogoRaster();
    } catch (e) {
      logo = null; // si el logo no carga, se imprime el nombre en texto
    }
  }
  const total = Math.max(1, Math.min(3, Number(copias) || 1));
  const bytes = [];
  for (let i = 0; i < total; i++) bytes.push(...cuerpo(ticket, { copia, ancho: caracteres, logo }));
  return new Uint8Array(bytes);
}
