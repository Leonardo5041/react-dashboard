import Swal from 'sweetalert2';
import { formatDateMX, formatTimeMX } from './date-mx';

export const getInitials = (name = '') => name
  .replace(/\s+/, ' ')
  .split(' ')
  .slice(0, 2)
  .map((v) => v && v[0].toUpperCase())
  .join('');

export const BACKEND_URL = 'https://1k0eontip5.execute-api.us-east-1.amazonaws.com/dev/api/v1/'
export const PRODUCTS_URL = 'https://1k0eontip5.execute-api.us-east-1.amazonaws.com/dev/api/v1/'
// export const PRODUCTS_URL = 'http://localhost:8080/api/v1/'
// export const BACKEND_URL = 'http://localhost:8080/api/v1/'

//export const BACKEND_URL = 'https://p70ny5tlre.execute-api.us-east-1.amazonaws.com/prod/'
// export const BACKEND_URL = 'http://localhost:2112/'

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

// Siempre en hora de México (ver src/utils/date-mx.js).
export const formatDateTime = (dateRequest) => formatDateMX(dateRequest);

export const formatTime = (dateRequest) => formatTimeMX(dateRequest);