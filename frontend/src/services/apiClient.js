import axios from 'axios';
import { API_BASE_URL } from '../config/appConfig';
import { loadStoredAuth, clearStoredAuth } from '../utils/authStorage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const storedAuth = loadStoredAuth();

  if (storedAuth?.token) {
    config.headers.Authorization = `Bearer ${storedAuth.token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      const path = window.location.pathname ?? '';
      if (path !== '/login' && !path.startsWith('/login')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
