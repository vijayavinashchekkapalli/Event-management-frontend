import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://event-management-frontend-og23.onrender.com').replace(/\/$/, '');

const bannerApi = axios.create({
  baseURL: API_BASE_URL
});

bannerApi.interceptors.request.use((config) => {
  console.log('[react/banner/bannerApi] request', `${config.baseURL || ''}${config.url || ''}`);
  return config;
});

export async function fetchActiveBanners() {
  const response = await bannerApi.get('/api/banner');
  return response.data?.banners || [];
}

export default bannerApi;
