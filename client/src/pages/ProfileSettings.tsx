import React, { useState, useEffect } from 'react';
import { 
  LucideUser, 
  LucideMail, 
  LucideLock, 
  LucideBell, 
  LucideShield, 
  LucideCamera,
  LucideSave,
  LucideEye,
  LucideEyeOff,
  LucideCheck,
  LucideX,
  LucideUpload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';

const ProfileSettings: React.FC = () => {
  const { user, token, databaseUser, refreshUserProfile } = useAuth();
  const { isDarkMode } = useTheme();
  const { settings, loading, error, updateSection, updateProfile } = useSettings();

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    profilePicture: user?.photoURL || databaseUser?.profilePicture || '',
    phoneNumber: '',
    bio: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    projectUpdates: true,
    weeklyReports: false,
    marketingEmails: false,
    facilityInvites: true,
    deadlineAlerts: true,
    commentNotifications: true,
    systemUpdates: true,
    securityAlerts: true,
    weeklyDigest: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Reusable success notification function
  const showSuccessMessage = (title: string, message: string) => {
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 shadow-lg z-50 transition-all duration-300 ease-in-out';
    successMessage.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-green-800 dark:text-green-200">${title}</h3>
          <div class="mt-1 text-sm text-green-700 dark:text-green-300">${message}</div>
        </div>
      </div>
    `;
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
      if (successMessage.parentNode) {
        successMessage.style.opacity = '0';
        successMessage.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.parentNode.removeChild(successMessage);
          }
        }, 300);
      }
    }, 4000);
  };

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      if (settings.profile) {
        setProfile(prev => ({ 
          ...prev, 
          displayName: settings.profile.firstName && settings.profile.lastName 
            ? `${settings.profile.firstName} ${settings.profile.lastName}` 
            : prev.displayName,
          bio: settings.profile.bio || '',
          phoneNumber: settings.profile.phoneNumber || '',
          // Don't load profilePicture from settings - use only from users collection
        }));
      }
      if (settings.notifications) {
        setNotificationSettings(prev => ({ ...prev, ...settings.notifications }));
      }
      if (settings.security) {
        setSecuritySettings(prev => ({ ...prev, ...settings.security }));
      }
    }
  }, [settings]);

  // Update profile when databaseUser becomes available
  useEffect(() => {
    if (databaseUser) {
      setProfile(prev => ({
        ...prev,
        displayName: databaseUser.firstName && databaseUser.lastName 
          ? `${databaseUser.firstName} ${databaseUser.lastName}` 
          : prev.displayName,
        // Use profilePicture from users collection, fallback to Firebase photoURL
        profilePicture: databaseUser.profilePicture || user?.photoURL || ''
      }));
    }
  }, [databaseUser]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        firstName: profile.displayName.split(' ')[0] || '',
        lastName: profile.displayName.split(' ').slice(1).join(' ') || '',
        bio: profile.bio,
        phoneNumber: profile.phoneNumber || null
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await refreshUserProfile();
      
      setErrors({});
      showSuccessMessage('Profile Updated Successfully!', 'Your profile information has been saved and updated across the app.');
    } catch (error: any) {
      setErrors({ profile: error.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await updateSection('notifications', notificationSettings);
      setErrors({});
      showSuccessMessage('Notification Settings Updated!', 'Your notification preferences have been saved successfully.');
    } catch (error: any) {
      setErrors({ notifications: error.message || 'Failed to update notification settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecurity = async () => {
    setIsLoading(true);
    try {
      await updateSection('security', securitySettings);
      setErrors({});
      showSuccessMessage('Security Settings Updated!', 'Your security preferences have been saved successfully.');
    } catch (error: any) {
      setErrors({ security: error.message || 'Failed to update security settings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors({ password: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found');
      }

      const credential = EmailAuthProvider.credential(currentUser.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwordForm.newPassword);

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setErrors({});
      showSuccessMessage('Password Changed Successfully!', 'Your password has been updated securely.');
    } catch (error: any) {
      let errorMessage = 'Failed to change password';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'The current password you entered is incorrect. Please check and try again.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The new password is too weak. Please choose a stronger password with at least 6 characters.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log out and log back in before changing your password.';
      }
      setErrors({ password: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, profilePicture: previewUrl }));
      setSelectedImageFile(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile) return;
    
    setIsLoading(true);
    try {
      const { auth } = await import('../config/firebase');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }
      const idToken = await currentUser.getIdToken();

      const formData = new FormData();
      formData.append('files', selectedImageFile);

      const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/settings/profile/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      setSelectedImageFile(null);
      
      // Refresh user profile to update Firebase and database user
      await refreshUserProfile();
      
      // Update the local profile state with the new image URL
      setProfile(prev => ({ ...prev, profilePicture: result.imageUrl }));
      
      showSuccessMessage('Profile Image Updated!', 'Your profile picture has been updated and will appear across the app.');
    } catch (error: any) {
      setErrors({ 
        profile: `Image Upload Failed: ${error.message || 'Unknown error. Please try again.'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading && !settings) {
  return (
      <div className="p-6 bg-neutral-light dark:bg-gray-900 min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

                return (
    <div className="p-6 bg-neutral-light dark:bg-gray-900 min-h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Profile Settings</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'profile'
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <LucideUser className="mr-2" size={20} />
            Profile
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'notifications'
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <LucideBell className="mr-2" size={20} />
            Notifications
          </button>
                  <button
            className={`flex items-center px-4 py-2 rounded-md ${
              activeTab === 'security'
                ? 'bg-brand text-white'
                        : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-200'
                    }`}
            onClick={() => setActiveTab('security')}
                  >
            <LucideShield className="mr-2" size={20} />
            Security
                  </button>
        </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
              <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h3>
              
                {/* Profile Picture */}
              <div className="flex items-center space-x-6 mb-6">
                <div className="relative">
                  {profile.profilePicture ? (
                  <div className="relative">
                      <img
                        src={profile.profilePicture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to default avatar if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      {isLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                      {/* Fallback avatar */}
                      <div 
                        className="w-20 h-20 bg-brand rounded-full flex items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <LucideUser className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center">
                        <LucideUser className="w-8 h-8 text-white" />
                      </div>
                    )}
                  <label className="absolute bottom-0 right-0 bg-brand text-white rounded-full p-2 cursor-pointer hover:bg-brand-dark">
                      <LucideCamera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                      onChange={handleImageSelection}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {profile.displayName || 'Your Name'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
                </div>
                  </div>

              {/* Upload Button - Show when image is selected */}
              {selectedImageFile && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleImageUpload}
                    disabled={isLoading}
                    className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <LucideUpload className="w-4 h-4" />
                        <span>Upload Image</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedImageFile(null);
                      setProfile(prev => ({ 
                        ...prev, 
                        profilePicture: prev.profilePicture
                      }));
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <LucideX className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}

              {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                    </label>
                    <input
                      type="text"
                      value={profile.displayName}
                    onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phoneNumber}
                    onChange={(e) => setProfile(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>

              {errors.profile && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400">{errors.profile}</div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <LucideSave className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
              
              <div className="space-y-6">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive browser push notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                  </div>

                {/* Task Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Task Reminders</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded about upcoming tasks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.taskReminders}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, taskReminders: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                    </label>
                </div>

                {/* Project Updates */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Project Updates</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates about project changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.projectUpdates}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, projectUpdates: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>

                {/* Facility Invites */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Facility Invites</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when invited to facilities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.facilityInvites}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, facilityInvites: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                  </div>

                {/* Deadline Alerts */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Deadline Alerts</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get alerts for approaching deadlines</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.deadlineAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, deadlineAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                    </label>
                </div>

                {/* Comment Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Comment Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about new comments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.commentNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, commentNotifications: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>

                {/* System Updates */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">System Updates</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about system maintenance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemUpdates}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemUpdates: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                  </div>

                {/* Security Alerts */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Security Alerts</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about security events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.securityAlerts}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, securityAlerts: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                    </label>
                </div>

                {/* Weekly Reports */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Weekly Reports</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive weekly progress reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReports}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>

                {/* Weekly Digest */}
                <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Weekly Digest</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly summary of activities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyDigest}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyDigest: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between">
                    <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Marketing Emails</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive promotional content and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketingEmails}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>
                    </div>

              {errors.notifications && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400">{errors.notifications}</div>
              )}

              <div className="mt-6 flex justify-end">
                    <button
                  onClick={handleSaveNotifications}
                  disabled={isLoading}
                  className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <LucideSave className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                    </button>
                  </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h3>
              
              {/* Password Change */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Change Password</h4>
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors"
                  >
                    Change Password
                  </button>
                ) : (
                    <div className="space-y-4">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showCurrentPassword ? <LucideEyeOff className="w-4 h-4" /> : <LucideEye className="w-4 h-4" />}
                          </button>
                      </div>
                    </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? <LucideEyeOff className="w-4 h-4" /> : <LucideEye className="w-4 h-4" />}
                          </button>
                      </div>
                    </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? <LucideEyeOff className="w-4 h-4" /> : <LucideEye className="w-4 h-4" />}
                        </button>
                      </div>
                </div>

                    {errors.password && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <LucideX className="h-5 w-5 text-red-400" />
                </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                              Password Change Failed
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                              {errors.password}
              </div>
            </div>
              </div>
            </div>
          )}

                    <div className="flex space-x-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Changing...</span>
                          </>
                        ) : (
                          <>
                            <LucideCheck className="w-4 h-4" />
                            <span>Change Password</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setErrors({});
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors flex items-center space-x-2"
                      >
                        <LucideX className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
                </div>

              {errors.security && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400">{errors.security}</div>
              )}

              <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSaveSecurity}
                    disabled={isLoading}
                  className="bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                    <LucideSave className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                  </button>
              </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ProfileSettings;
