import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api', // Default to localhost for dev
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include initData
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData;
    if (initData) {
      config.headers['x-telegram-init-data'] = initData;
    }
  }
  return config;
});

export default api;
