import api from './api';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profilePicture?: string;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  projectUpdates: boolean;
  weeklyReports: boolean;
  marketingEmails: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
}

export interface UserSettings {
  profile: UserProfile;
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: any;
  system: any;
  privacy: any;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export const profileSettingsService = {
  // Get user settings
  async getSettings(): Promise<UserSettings> {
    const response = await api.get('/settings');
    return response.data.settings;
  },

  // Update user profile
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserSettings> {
    const response = await api.put('/settings/profile', profileData);
    return response.data.settings;
  },

  // Update notification settings
  async updateNotifications(notificationData: Partial<NotificationSettings>): Promise<UserSettings> {
    const response = await api.put('/settings/section/notifications', notificationData);
    return response.data.settings;
  },

  // Update security settings
  async updateSecurity(securityData: Partial<SecuritySettings>): Promise<UserSettings> {
    const response = await api.put('/settings/section/security', securityData);
    return response.data.settings;
  },

  // Change password (Firebase operation)
  async changePassword(passwordData: PasswordChangeRequest): Promise<void> {
    await api.put('/settings/password', passwordData);
  },

  // Toggle two-factor authentication
  async toggleTwoFactor(enabled: boolean): Promise<UserSettings> {
    const response = await api.put('/settings/two-factor', { enabled });
    return response.data.settings;
  },

  // Reset settings to default
  async resetSettings(): Promise<UserSettings> {
    const response = await api.post('/settings/reset');
    return response.data.settings;
  },

  // Export user data
  async exportUserData(): Promise<any> {
    const response = await api.get('/settings/export');
    return response.data.data;
  },

  // Delete account
  async deleteAccount(): Promise<void> {
    await api.delete('/settings/account');
  }
};

export default profileSettingsService;
