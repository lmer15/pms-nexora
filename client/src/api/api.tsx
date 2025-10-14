import axios from 'axios';
import { storage } from '../utils/storage';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if it's not a profile endpoint (which might fail during sync)
      if (!error.config?.url?.includes('/auth/profile') && 
          !error.config?.url?.includes('/auth/firebase/sync')) {
        storage.clearAuthData();
        // Use React Router navigation instead of window.location
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.response?.status === 403) {
      // If it's a facility access error, redirect to facilities page
      if (error.config?.url?.includes('/projects/facility/') || 
          error.config?.url?.includes('/facilities/')) {
        // Clear current facility from storage
        storage.removeFacility();
        if (window.location.pathname !== '/Facilities') {
          window.location.href = '/Facilities';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;