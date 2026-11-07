// Utilidades de fecha/hora: TODO el sistema se muestra y calcula en hora de México,
// sin importar la zona horaria configurada en la computadora del usuario.
//
// Conceptos:
// - "Instante": un Date / string ISO que representa un momento exacto (lo que
//   guarda y devuelve el backend, p. ej. "2026-11-01T07:15:41-06:00").
// - "Fecha de pared MX": un Date del navegador cuyos campos locales
//   (año, mes, día, hora...) son la hora que marca el reloj en México.
//   Es lo que se le pasa a los DatePicker (AdapterDateFns usa la hora local
//   del navegador), así el calendario siempre muestra el día de México.
//   Si el navegador ya está en hora de México, ambos son idénticos.
import moment from 'moment-timezone';
import 'moment/locale/es-mx';

export const MX_TZ = 'America/Mexico_City';

/** Hora actual en México (objeto moment). */
export const nowMX = () => moment.tz(MX_TZ);

/** Instante → "fecha de pared MX" (para DatePicker). null si no hay fecha válida. */
export const toMXWallDate = (instant) => {
  if (!instant) return null;
  const m = moment.tz(instant, MX_TZ);
  if (!m.isValid()) return null;
  return new Date(m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond());
};

/** "Fecha de pared MX" (de un DatePicker) → instante real en México. */
export const fromMXWallDate = (wallDate) => {
  if (!wallDate || Number.isNaN(new Date(wallDate).getTime())) return null;
  const d = new Date(wallDate);
  return moment.tz([
    d.getFullYear(), d.getMonth(), d.getDate(),
    d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()
  ], MX_TZ).toDate();
};

/** Objeto moment en México → "fecha de pared MX" a las 00:00 (día calendario). */
export const mxDayToWallDate = (m) => new Date(m.year(), m.month(), m.date());

/** Hoy (día calendario de México) como "fecha de pared MX" a las 00:00. */
export const todayMXWallDate = () => mxDayToWallDate(nowMX());

/** "Fecha de pared MX" → "YYYY-MM-DD" (para mandar al backend). */
export const wallDateToYMD = (wallDate) => moment(wallDate).format('YYYY-MM-DD');

/** Instante → fecha legible en México, p. ej. "31 DE OCTUBRE DE 2026". */
export const formatDateMX = (instant) => {
  if (!instant) return '';
  return moment.tz(instant, MX_TZ).locale('es-mx').format('LL').toUpperCase();
};

/** Instante → hora en México "HH:mm:ss". */
export const formatTimeMX = (instant) => {
  if (!instant) return '';
  return moment.tz(instant, MX_TZ).format('HH:mm:ss');
};
