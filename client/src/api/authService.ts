import api from '../api/api';
import { storage } from '../utils/storage';

export const authService = {
  async login(email: string, password: string) {
    // Handled by Firebase in AuthContext
  },

  async register(email: string, password: string, firstName: string, lastName: string) {
    // Handled by Firebase in AuthContext
  },

  async registerUser(idToken: string, firstName: string, lastName: string) {
    const response = await api.post('/auth/firebase/register', {
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
    const response = await api.post('/auth/firebase/verify', { idToken });
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
  }
};