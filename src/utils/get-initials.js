import Swal from 'sweetalert2';

export const getInitials = (name = '') => name
  .replace(/\s+/, ' ')
  .split(' ')
  .slice(0, 2)
  .map((v) => v && v[0].toUpperCase())
  .join('');


export const BACKEND_URL = 'https://gymapi-dfkn.onrender.com/'


export const confirmAlert = async (message) => {
  return await Swal.fire({
    title: message,
    text: "No podrás revertir esta acción",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
  });
}