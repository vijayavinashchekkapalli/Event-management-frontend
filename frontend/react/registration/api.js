import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://event-management-frontend-og23.onrender.com').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  console.log('[react/registration/api] request', `${config.baseURL || ''}${config.url || ''}`);
  return config;
});

export default api;
