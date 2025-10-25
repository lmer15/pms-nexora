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
  async (error) => {
    if (error.response?.status === 401) {
      // For settings endpoints, try to refresh the token once
      if (error.config?.url?.includes('/settings') && !error.config._retry) {
        try {
          // Import auth and authService dynamically to avoid circular imports
          const { auth } = await import('../config/firebase');
          const { authService } = await import('./authService');
          
          const currentUser = auth.currentUser;
          if (currentUser) {
            const idToken = await currentUser.getIdToken(true); // Force refresh
            
            // Verify token structure
            const tokenParts = idToken.split('.');
            if (tokenParts.length !== 3) {
              throw new Error('Invalid token format');
            }
            
            const header = JSON.parse(atob(tokenParts[0]));
            if (!header.kid) {
              throw new Error('Token missing kid claim');
            }
            
            const response = await authService.verifyToken(idToken);
            storage.setToken(response.token);
            
            // Retry the original request with new token
            error.config._retry = true;
            error.config.headers.Authorization = `Bearer ${response.token}`;
            return api.request(error.config);
          } else {
            // Don't clear auth data immediately, just redirect
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        } catch (refreshError) {
          // Only clear auth data if it's a serious error
          if (refreshError.message?.includes('Invalid token') || refreshError.message?.includes('kid claim')) {
            storage.clearAuthData();
            const { auth } = await import('../config/firebase');
            await auth.signOut();
          }
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
      
      // Only redirect to login if it's not a profile or settings endpoint (which might fail during sync)
      if (!error.config?.url?.includes('/auth/profile') && 
          !error.config?.url?.includes('/auth/firebase/sync') &&
          !error.config?.url?.includes('/settings')) {
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