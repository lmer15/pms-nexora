import api from './api';

export interface AccountInfo {
  exists: boolean;
  authMethods: string[];
  canLink: boolean;
  message?: string;
}

export const accountLinkingService = {
  /**
   * Check what authentication methods are available for an email
   * This is a SAFE read-only operation that doesn't modify any data
   */
  async checkAccountType(email: string): Promise<AccountInfo> {
    try {
      // This will be a new endpoint that only READS data, doesn't modify
      const response = await api.post('/auth/check-account-type', { email });
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist yet, return safe default
      return {
        exists: false,
        authMethods: [],
        canLink: false,
        message: 'Account type checking not available'
      };
    }
  },

  /**
   * Link email/password to existing Google account
   */
  async linkEmailPassword(idToken: string, password: string): Promise<any> {
    try {
      // Create a new axios instance to avoid token conflicts with the interceptor
      const axios = (await import('axios')).default;
      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const response = await axios.post(`${API_BASE_URL}/auth/link-email-password`, {
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Account linking failed:', error);
      throw error;
    }
  },

  /**
   * Link Google account to existing email/password account
   */
  async linkGoogleAccount(idToken: string, googleIdToken: string): Promise<any> {
    try {
      // Create a new axios instance to avoid token conflicts with the interceptor
      const axios = (await import('axios')).default;
      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      const response = await axios.post(`${API_BASE_URL}/auth/link-google-account`, {
        googleIdToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Google account linking failed:', error);
      throw error;
    }
  }
};
