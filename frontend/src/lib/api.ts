import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';

console.log('API Base URL:', baseURL); // Debug log

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use((config) => {
  console.log('Making API request to:', (config.baseURL || '') + (config.url || '')); // Debug log
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Only add token for protected routes, not for public tracking routes
  if (token && !config.url?.includes('/track/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('API response:', response.status, response.data); // Debug log
    return response;
  },
  (error) => {
    console.error('API error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
