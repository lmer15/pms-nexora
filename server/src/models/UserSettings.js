const FirestoreService = require('../services/firestoreService');
const admin = require('firebase-admin');

class UserSettings extends FirestoreService {
  constructor() {
    super('userSettings');
  }

  // Get user settings by user ID
  async getByUserId(userId) {
    try {
      const doc = await this.collection.where('userId', '==', userId).limit(1).get();
      
      if (doc.empty) {
        // Return default settings if none exist
        return this.getDefaultSettings(userId);
      }
      
      const settingsDoc = doc.docs[0];
      return {
        id: settingsDoc.id,
        ...settingsDoc.data()
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw error;
    }
  }

  // Create or update user settings
  async upsertSettings(userId, settingsData) {
    try {
      // Check if settings already exist
      const existingSettings = await this.getByUserId(userId);
      
      const settingsToSave = {
        userId,
        ...settingsData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (existingSettings.id) {
        // Update existing settings
        await this.collection.doc(existingSettings.id).update(settingsToSave);
        return { id: existingSettings.id, ...settingsToSave };
      } else {
        // Create new settings
        settingsToSave.createdAt = admin.firestore.FieldValue.serverTimestamp();
        const docRef = await this.collection.add(settingsToSave);
        return { id: docRef.id, ...settingsToSave };
      }
    } catch (error) {
      console.error('Error upserting user settings:', error);
      throw error;
    }
  }

  // Get default settings for a new user
  getDefaultSettings(userId) {
    return {
      userId,
      profile: {
        firstName: '',
        lastName: '',
        bio: '',
        profilePicture: null
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        projectUpdates: true,
        facilityInvites: true,
        weeklyDigest: false
      },
      security: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 30 // minutes
      },
      appearance: {
        theme: 'dark', // 'light', 'dark', 'auto'
        language: 'en-US',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h' // '12h' or '24h'
      },
      system: {
        autoSave: true,
        cacheEnabled: true,
        analyticsEnabled: true,
        crashReporting: true
      },
      privacy: {
        profileVisibility: 'private', // 'public', 'private', 'facility-only'
        showOnlineStatus: true,
        allowDirectMessages: true
      }
    };
  }

  // Update specific settings section
  async updateSection(userId, section, sectionData) {
    try {
      const currentSettings = await this.getByUserId(userId);
      
      const updatedSettings = {
        ...currentSettings,
        [section]: {
          ...currentSettings[section],
          ...sectionData
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      return await this.upsertSettings(userId, updatedSettings);
    } catch (error) {
      console.error(`Error updating ${section} settings:`, error);
      throw error;
    }
  }

  // Delete user settings (for account deletion)
  async deleteByUserId(userId) {
    try {
      const doc = await this.collection.where('userId', '==', userId).limit(1).get();
      
      if (!doc.empty) {
        await doc.docs[0].ref.delete();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting user settings:', error);
      throw error;
    }
  }

  // Validate settings data
  validateSettings(settingsData) {
    const errors = [];

    // Validate profile settings
    if (settingsData.profile) {
      if (settingsData.profile.firstName && settingsData.profile.firstName.length > 50) {
        errors.push('First name must be less than 50 characters');
      }
      if (settingsData.profile.lastName && settingsData.profile.lastName.length > 50) {
        errors.push('Last name must be less than 50 characters');
      }
      if (settingsData.profile.bio && settingsData.profile.bio.length > 500) {
        errors.push('Bio must be less than 500 characters');
      }
    }

    // Validate appearance settings
    if (settingsData.appearance) {
      const validThemes = ['light', 'dark', 'auto'];
      if (settingsData.appearance.theme && !validThemes.includes(settingsData.appearance.theme)) {
        errors.push('Invalid theme selection');
      }
      
      const validTimeFormats = ['12h', '24h'];
      if (settingsData.appearance.timeFormat && !validTimeFormats.includes(settingsData.appearance.timeFormat)) {
        errors.push('Invalid time format selection');
      }
    }

    // Validate security settings
    if (settingsData.security) {
      if (settingsData.security.sessionTimeout && (settingsData.security.sessionTimeout < 5 || settingsData.security.sessionTimeout > 480)) {
        errors.push('Session timeout must be between 5 and 480 minutes');
      }
    }

    return errors;
  }
}

module.exports = new UserSettings();
