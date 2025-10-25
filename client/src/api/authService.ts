import api from '../api/api';
import { storage } from '../utils/storage';
import { auth } from '../config/firebase';
import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get Firebase ID token
const getFirebaseIdToken = async (): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }
  return await auth.currentUser.getIdToken();
};

export const authService = {
  async login(email: string, password: string) {
    // Handled by Firebase in AuthContext
  },

  async register(email: string, password: string, firstName: string, lastName: string) {
    // Handled by Firebase in AuthContext
  },

  async registerUser(idToken: string, firstName: string, lastName: string) {
    const response = await api.post('/auth/register', {
      idToken,
      firstName,
      lastName
    });
    return response.data;
  },

  async googleAuth(idToken: string) {
    const response = await api.post('/auth/firebase/google-auth', { idToken });
    storage.setToken(response.data.token);
    return response.data;
  },

  async verifyToken(idToken: string) {
    const response = await api.post('/auth/verify', { idToken });
    storage.setToken(response.data.token);
    return response.data;
  },

  async syncUser(idToken: string) {
    try {
      const response = await api.post('/auth/firebase/sync', { idToken });
      storage.setToken(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  },

  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async setPasswordForGoogleUser(password: string) {
    const response = await api.post('/auth/set-password', { password });
    return response.data;
  }
};