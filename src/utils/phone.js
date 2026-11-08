// Celular de México: mismas reglas que el backend (clients/phone.go).
// Acepta espacios, guiones, paréntesis y la lada de país (52, +52 o +521).

// Regresa los 10 dígitos, '' si viene vacío, o null si no es válido.
export const normalizarCelular = (valor) => {
  const texto = String(valor ?? '');
  let d = texto.replace(/\D/g, '');
  if (d === '') return texto.trim() === '' ? '' : null;
  if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
  else if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
  return d.length === 10 ? d : null;
};

export const celularValido = (valor) => {
  const n = normalizarCelular(valor);
  return n !== null && n !== '';
};

export const MENSAJE_CELULAR_INVALIDO = 'Captura el celular de 10 dígitos (ej. 55 1234 5678)';

// Mensaje de error del API (axios) para mostrar al usuario.
export const mensajeErrorApi = (err, porDefecto = 'No se pudo guardar') =>
  err?.response?.data?.error || porDefecto;
