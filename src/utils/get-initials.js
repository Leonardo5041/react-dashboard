import Swal from 'sweetalert2';
import moment from 'moment';
import 'moment/locale/es-mx';

export const getInitials = (name = '') => name
  .replace(/\s+/, ' ')
  .split(' ')
  .slice(0, 2)
  .map((v) => v && v[0].toUpperCase())
  .join('');

export const BACKEND_URL = 'https://hq86a5j0lj.execute-api.us-east-1.amazonaws.com/dev/'
//export const BACKEND_URL = 'https://p70ny5tlre.execute-api.us-east-1.amazonaws.com/prod/'
//export const BACKEND_URL = 'http://192.168.100.7:2112/'

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

export const formatDateTime = (dateRequest) => {
  if (!dateRequest) return '';
  return moment(dateRequest).utc(true).format('LL').toUpperCase();
}