const UserSettings = require('../models/UserSettings');
const User = require('../models/User');
const { admin } = require('../config/firebase-admin');
const fileUploadService = require('../services/fileUploadService');
const path = require('path');
const cacheService = require('../services/cacheService');

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await UserSettings.getByUserId(userId);
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user settings'
    });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;

    // Validate settings data
    const validationErrors = UserSettings.validateSettings(settingsData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const updatedSettings = await UserSettings.upsertSettings(userId, settingsData);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings'
    });
  }
};

// Update specific settings section
exports.updateSection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { section } = req.params;
    const sectionData = req.body;

    // Validate section name
    const validSections = ['profile', 'notifications', 'security', 'appearance', 'system', 'privacy'];
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }

    // Validate section-specific data
    const validationErrors = UserSettings.validateSettings({ [section]: sectionData });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    const updatedSettings = await UserSettings.updateSection(userId, section, sectionData);
    
    res.json({
      success: true,
      message: `${section} settings updated successfully`,
      settings: updatedSettings
    });
  } catch (error) {
    console.error(`Error updating ${req.params.section} settings:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to update ${req.params.section} settings`
    });
  }
};

// Update user profile (special case that also updates User model)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, bio, profilePicture, phoneNumber } = req.body;

    // Validate profile data
    if (firstName && firstName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'First name must be less than 50 characters'
      });
    }
    if (lastName && lastName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be less than 50 characters'
      });
    }
    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio must be less than 500 characters'
      });
    }
    if (phoneNumber && phoneNumber.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be less than 20 characters'
      });
    }

    // Update User model for basic profile info
    const userUpdateData = {};
    if (firstName !== undefined) userUpdateData.firstName = firstName;
    if (lastName !== undefined) userUpdateData.lastName = lastName;
    if (profilePicture !== undefined) userUpdateData.profilePicture = profilePicture;
    if (phoneNumber !== undefined) userUpdateData.phoneNumber = phoneNumber;

    if (Object.keys(userUpdateData).length > 0) {
      console.log(`Updating User model for user ${userId} with data:`, userUpdateData);
      const updatedUser = await User.updateProfile(userId, userUpdateData);
      console.log(`User model updated successfully:`, updatedUser);

      try {
        const UserFacility = require('../models/UserFacility');
        const userFacilities = await UserFacility.findByUser(userId);
        
        for (const userFacility of userFacilities) {
          cacheService.invalidateFacilityMembers(userFacility.facilityId);
        }
        console.log(`Invalidated facility members cache for user ${userId} in ${userFacilities.length} facilities`);
      } catch (cacheError) {
        console.error('Error invalidating facility members cache:', cacheError);
        // Don't fail the request if cache invalidation fails
      }
    }

    // Update settings for bio and other profile preferences (exclude profilePicture - it's only in users collection)
    const profileSettings = { firstName, lastName, bio, phoneNumber };
    const updatedSettings = await UserSettings.updateSection(userId, 'profile', profileSettings);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile'
    });
  }
};

// Change password (Firebase operation)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const firebaseUid = req.user.firebaseUid;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Note: Firebase password change requires client-side implementation
    // This endpoint is for validation and logging purposes
    res.json({
      success: true,
      message: 'Password change request validated. Please use Firebase client SDK to complete the password change.'
    });
  } catch (error) {
    console.error('Error validating password change:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate password change request'
    });
  }
};

// Enable/disable two-factor authentication
exports.toggleTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Enabled status must be a boolean value'
      });
    }

    const updatedSettings = await UserSettings.updateSection(userId, 'security', {
      twoFactorEnabled: enabled
    });
    
    res.json({
      success: true,
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error toggling two-factor authentication:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update two-factor authentication settings'
    });
  }
};

// Reset settings to default
exports.resetSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const defaultSettings = UserSettings.getDefaultSettings(userId);
    
    const updatedSettings = await UserSettings.upsertSettings(userId, defaultSettings);
    
    res.json({
      success: true,
      message: 'Settings reset to default successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error resetting user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user settings'
    });
  }
};

// Export user data (GDPR compliance)
exports.exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile
    const userProfile = await User.getProfile(userId);
    
    // Get user settings
    const userSettings = await UserSettings.getByUserId(userId);
    
    // Get user's facilities (if needed)
    // This would require additional queries to get user's facility memberships
    
    const exportData = {
      profile: userProfile,
      settings: userSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data'
    });
  }
};

// Delete user account and all associated data
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const firebaseUid = req.user.firebaseUid;
    
    // Delete user settings
    await UserSettings.deleteByUserId(userId);
    
    // Delete user from Firestore
    await User.delete(userId);
    
    // Note: Firebase user deletion should be handled on the client side
    // This endpoint handles the database cleanup
    
    res.json({
      success: true,
      message: 'Account and associated data deleted successfully. Please delete your Firebase account separately.'
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user account'
    });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Use multer middleware to handle file upload
    fileUploadService.uploadFiles(req, res, async (err) => {
      if (err) {
        console.error('Profile image upload error:', err);
        return res.status(400).json({ 
          success: false,
          message: err.message || 'Profile image upload failed' 
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'No image file uploaded' 
        });
      }

      if (req.files.length > 1) {
        return res.status(400).json({ 
          success: false,
          message: 'Only one image file is allowed' 
        });
      }

      try {
        const file = req.files[0];
        
        // Validate it's an image
        if (!file.mimetype.startsWith('image/')) {
          return res.status(400).json({ 
            success: false,
            message: 'Only image files are allowed' 
          });
        }

        // Create the file URL - use full URL for consistency
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
        const fileUrl = `${baseUrl}/uploads/attachments/${file.filename}`;
        const relativeUrl = `/uploads/attachments/${file.filename}`;
        
        // Update user's profile picture in database with full URL
        await User.update(userId, { profilePicture: fileUrl });
        
        // Invalidate cache for all facilities this user is a member of
        try {
          const UserFacility = require('../models/UserFacility');
          const userFacilities = await UserFacility.findByUser(userId);
          for (const userFacility of userFacilities) {
            cacheService.invalidateFacilityMembers(userFacility.facilityId);
          }
          console.log(`Invalidated facility members cache for user ${userId} in ${userFacilities.length} facilities after image upload`);
        } catch (cacheError) {
          console.error('Error invalidating facility members cache after image upload:', cacheError);
          // Don't fail the request if cache invalidation fails
        }
        
        // Also update Firebase user's photoURL with full URL
        const user = await User.findById(userId);
        if (user && user.firebaseUid) {
          try {
            await admin.auth().updateUser(user.firebaseUid, {
              photoURL: fileUrl
            });
          } catch (firebaseError) {
            console.error('Error updating Firebase user photo:', firebaseError);
            // Don't fail the request if Firebase update fails
          }
        }

        res.json({
          success: true,
          message: 'Profile image uploaded successfully',
          imageUrl: fileUrl
        });
      } catch (dbError) {
        console.error('Database error after image upload:', dbError);
        
        // Clean up uploaded file if database operation failed
        try {
          await fileUploadService.deleteFile(file.filename);
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError);
        }
        
        res.status(500).json({
          success: false,
          message: 'Failed to save profile image'
        });
      }
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error uploading profile image'
    });
  }
};
