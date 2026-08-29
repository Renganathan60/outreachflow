import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('outreachflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data payload and handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('outreachflow_token');
        localStorage.removeItem('outreachflow_user');
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK' || !error.response
        ? 'Cannot connect to backend server. Please verify the backend is running at http://localhost:5000.'
        : error.message || 'An unexpected error occurred');

    return Promise.reject({
      message,
      status: error.response?.status,
      errors: error.response?.data?.errors,
    });
  }
);

export default api;
