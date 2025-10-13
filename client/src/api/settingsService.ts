import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface UserSettings {
  id?: string;
  userId: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
    profilePicture: string | null;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskReminders: boolean;
    projectUpdates: boolean;
    facilityInvites: boolean;
    weeklyDigest: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginNotifications: boolean;
    sessionTimeout: number;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  system: {
    autoSave: boolean;
    cacheEnabled: boolean;
    analyticsEnabled: boolean;
    crashReporting: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'facility-only';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  settings?: T;
  errors?: string[];
}

// Helper function to get Firebase ID token
const getFirebaseIdToken = async (): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }
  return await auth.currentUser.getIdToken();
};

export const settingsService = {
  // Get user settings
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.get(`${API_BASE_URL}/settings`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch settings');
    }
  },

  // Update all user settings
  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.put(`${API_BASE_URL}/settings`, settings, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to update settings');
    }
  },

  // Update specific settings section
  async updateSection(section: string, sectionData: any): Promise<ApiResponse<UserSettings>> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.put(`${API_BASE_URL}/settings/section/${section}`, sectionData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating ${section} settings:`, error);
      throw new Error(error.response?.data?.message || `Failed to update ${section} settings`);
    }
  },

  // Update user profile
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    profilePicture?: string | null;
  }): Promise<ApiResponse<UserSettings>> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.put(`${API_BASE_URL}/settings/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },


  // Toggle two-factor authentication
  async toggleTwoFactor(enabled: boolean): Promise<ApiResponse<UserSettings>> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.put(`${API_BASE_URL}/settings/two-factor`, { enabled }, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error toggling two-factor authentication:', error);
      throw new Error(error.response?.data?.message || 'Failed to update two-factor authentication');
    }
  },

  // Reset settings to default
  async resetSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.post(`${API_BASE_URL}/settings/reset`, {}, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset settings');
    }
  },

  // Export user data
  async exportUserData(): Promise<ApiResponse> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.get(`${API_BASE_URL}/settings/export`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error exporting user data:', error);
      throw new Error(error.response?.data?.message || 'Failed to export user data');
    }
  },

  // Delete user account
  async deleteAccount(): Promise<ApiResponse> {
    try {
      const idToken = await getFirebaseIdToken();
      const response = await axios.delete(`${API_BASE_URL}/settings/account`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete account');
    }
  }
};

export default settingsService;
