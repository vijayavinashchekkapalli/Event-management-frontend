import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

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
