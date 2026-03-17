import axios from 'axios';
import { API_BASE_URL } from '../config/appConfig';
import { loadStoredAuth } from '../utils/authStorage';

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

export default apiClient;
