import axios from 'axios';
import { PRODUCTS_URL } from './get-initials';

const api = axios.create({ baseURL: PRODUCTS_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
