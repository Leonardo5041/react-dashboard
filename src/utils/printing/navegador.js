// Adaptador "navegador": imprime el HTML del ticket con la impresión del sistema
// (impresora USB instalada en la PC). Con Chrome abierto con --kiosk-printing
// imprime directo en la impresora predeterminada, sin mostrar el diálogo.

const ESPERA_IMAGENES_MS = 3000;
const LIMPIEZA_MS = 60000;

function esperarImagenes(doc) {
  const pendientes = Array.from(doc.images || []).filter((img) => !img.complete);
  if (pendientes.length === 0) return Promise.resolve();
  const cargas = pendientes.map(
    (img) =>
      new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      })
  );
  const limite = new Promise((resolve) => setTimeout(resolve, ESPERA_IMAGENES_MS));
  return Promise.race([Promise.all(cargas), limite]);
}

// El largo del papel lo decide el driver de la impresora: no se fija con @page size,
// porque los drivers que no aceptan tamaños personalizados escalan la hoja.
export function imprimirConNavegador(html) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !document?.body) {
      reject(new Error('Impresión no disponible'));
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    let limpiado = false;
    const limpiar = () => {
      if (limpiado) return;
      limpiado = true;
      iframe.remove();
    };

    iframe.onload = async () => {
      try {
        const win = iframe.contentWindow;
        await esperarImagenes(win.document);
        win.addEventListener('afterprint', () => setTimeout(limpiar, 500), { once: true });
        win.focus();
        win.print();
        setTimeout(limpiar, LIMPIEZA_MS);
        resolve();
      } catch (e) {
        limpiar();
        reject(e);
      }
    };

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}
