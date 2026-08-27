import axios from 'axios';

const getApiBaseUrl = () => {
  let raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  raw = raw.trim().replace(/\/+$/, '');
  if (!raw.endsWith('/api')) {
    raw += '/api';
  }
  return raw;
};

if (typeof window !== 'undefined') {
  console.log('🌐 [CampusMind] Active Backend API:', getApiBaseUrl());
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('campusmind_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear token if expired or invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('campusmind_token');
        localStorage.removeItem('campusmind_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
