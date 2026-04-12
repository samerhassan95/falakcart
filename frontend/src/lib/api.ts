import axios from 'axios';

// Use environment variable or fallback to production URL
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://togaar.com/api';

console.log('API Base URL:', baseURL); // Debug log

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 second timeout for production
  withCredentials: false, // Disable credentials for CORS
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
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        
        // Only redirect if not already on login/register pages
        if (!window.location.pathname.match(/\/(login|register|refer|welcome)/)) {
          window.location.href = '/login';
        }
      }
    }
    
    // Handle 500 errors more gracefully
    if (error.response?.status === 500) {
      console.error('Server error - check backend logs');
    }
    
    return Promise.reject(error);
  }
);

export default api;
