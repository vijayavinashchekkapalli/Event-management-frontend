import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

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
