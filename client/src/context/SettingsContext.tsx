import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsService, UserSettings } from '../api/settingsService';
import { authService } from '../api/authService';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

interface SettingsContextType {
  settings: UserSettings | null;
  userProfile: any | null;
  loading: boolean;
  error: string | null;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateSection: (section: string, sectionData: any) => Promise<void>;
  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    profilePicture?: string | null;
  }) => Promise<void>;
  toggleTwoFactor: (enabled: boolean) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportUserData: () => Promise<any>;
  deleteAccount: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings when user is authenticated
  useEffect(() => {
    if (user) {
      loadSettings();
      loadUserProfile();
    } else {
      setSettings(null);
      setUserProfile(null);
    }
  }, [user]);

  // Listen for profile updates to refresh user profile data
  useEffect(() => {
    const handleUserProfileUpdate = (event: any) => {
      const { userId } = event.detail;
      if (userId === user?.uid) {
        // Refresh user profile data when profile is updated
        loadUserProfile();
      }
    };

    window.addEventListener('userProfileUpdated', handleUserProfileUpdate);

    return () => {
      window.removeEventListener('userProfileUpdated', handleUserProfileUpdate);
    };
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.getSettings();
      if (response.success && response.settings) {
        setSettings(response.settings);
        // Sync theme from settings
        if (response.settings.appearance?.theme) {
          setTheme(response.settings.appearance.theme);
        }
      } else {
        throw new Error(response.message || 'Failed to load settings');
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await authService.getProfile();
      setUserProfile(profile);
    } catch (err: any) {
      console.error('Error loading user profile:', err);
      // Fallback to Firebase user data if backend profile fails
      setUserProfile({
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        profilePicture: user.photoURL || null
      });
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.updateSettings(newSettings);
      if (response.success && response.settings) {
        setSettings(response.settings);
      } else {
        throw new Error(response.message || 'Failed to update settings');
      }
    } catch (err: any) {
      console.error('Error updating settings:', err);
      setError(err.message || 'Failed to update settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSection = async (section: string, sectionData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.updateSection(section, sectionData);
      if (response.success && response.settings) {
        setSettings(response.settings);
      } else {
        throw new Error(response.message || `Failed to update ${section} settings`);
      }
    } catch (err: any) {
      console.error(`Error updating ${section} settings:`, err);
      setError(err.message || `Failed to update ${section} settings`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    profilePicture?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.updateProfile(profileData);
      if (response.success && response.settings) {
        setSettings(response.settings);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  const toggleTwoFactor = async (enabled: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.toggleTwoFactor(enabled);
      if (response.success && response.settings) {
        setSettings(response.settings);
      } else {
        throw new Error(response.message || 'Failed to update two-factor authentication');
      }
    } catch (err: any) {
      console.error('Error toggling two-factor authentication:', err);
      setError(err.message || 'Failed to update two-factor authentication');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.resetSettings();
      if (response.success && response.settings) {
        setSettings(response.settings);
      } else {
        throw new Error(response.message || 'Failed to reset settings');
      }
    } catch (err: any) {
      console.error('Error resetting settings:', err);
      setError(err.message || 'Failed to reset settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.exportUserData();
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to export user data');
      }
    } catch (err: any) {
      console.error('Error exporting user data:', err);
      setError(err.message || 'Failed to export user data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await settingsService.deleteAccount();
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete account');
      }
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  const value: SettingsContextType = {
    settings,
    userProfile,
    loading,
    error,
    updateSettings,
    updateSection,
    updateProfile,
    toggleTwoFactor,
    resetSettings,
    exportUserData,
    deleteAccount,
    refreshSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
