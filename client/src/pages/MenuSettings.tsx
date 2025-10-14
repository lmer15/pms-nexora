import React, { useState, useEffect } from 'react';
import {
  LucideSettings,
  LucideUser,
  LucideBell,
  LucideShield,
  LucidePalette,
  LucideGlobe,
  LucideSave,
  LucideAlertCircle,
  LucideCheck,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationPreferences from '../components/NotificationPreferences';
import { updateProfile as updateFirebaseProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import { triggerAllUserProfilesRefresh } from '../utils/userProfileUtils';

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile Settings',
    icon: <LucideUser className="w-4 h-4" />,
    description: 'Manage your personal information and preferences',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: <LucideBell className="w-4 h-4" />,
    description: 'Configure notification preferences and alerts',
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: <LucideShield className="w-4 h-4" />,
    description: 'Manage security settings and privacy options',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: <LucidePalette className="w-4 h-4" />,
    description: 'Customize the look and feel of the application',
  },
  {
    id: 'system',
    title: 'System Settings',
    icon: <LucideSettings className="w-4 h-4" />,
    description: 'Configure system-wide settings and integrations',
  },
  {
    id: 'language',
    title: 'Language & Region',
    icon: <LucideGlobe className="w-4 h-4" />,
    description: 'Set language and regional preferences',
  },
  {
    id: 'privacy',
    title: 'Privacy',
    icon: <LucideShield className="w-4 h-4" />,
    description: 'Control your privacy and data sharing preferences',
  },
  {
    id: 'account',
    title: 'Account Management',
    icon: <LucideSettings className="w-4 h-4" />,
    description: 'Manage your account data and settings',
  },
];

const MenuSettings: React.FC = () => {
  const { user } = useAuth();
  const { 
    settings, 
    userProfile,
    loading, 
    error, 
    updateProfile, 
    updateSection, 
    toggleTwoFactor,
    resetSettings,
    exportUserData,
    deleteAccount
  } = useSettings();
  const { theme, isDarkMode, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    profile: {
      firstName: '',
      lastName: '',
      bio: '',
      profilePicture: null as string | null
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
      sessionTimeout: 30
    },
    appearance: {
      theme: 'dark' as 'light' | 'dark' | 'auto',
      language: 'en-US',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h' as '12h' | '24h'
    },
    system: {
      autoSave: true,
      cacheEnabled: true,
      analyticsEnabled: true,
      crashReporting: true
    },
    privacy: {
      profileVisibility: 'private' as 'public' | 'private' | 'facility-only',
      showOnlineStatus: true,
      allowDirectMessages: true
    }
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'success' | 'error' }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        profile: {
          ...settings.profile,
          // Override with current user data if available
          firstName: settings.profile.firstName || userProfile?.firstName || user?.displayName?.split(' ')[0] || '',
          lastName: settings.profile.lastName || userProfile?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
          profilePicture: settings.profile.profilePicture || userProfile?.profilePicture || user?.photoURL || null
        },
        notifications: settings.notifications,
        security: settings.security,
        appearance: settings.appearance,
        system: settings.system,
        privacy: settings.privacy
      });
    } else if (userProfile || user) {
      // If no settings yet, initialize with user data
      setFormData(prev => ({
        ...prev,
        profile: {
          firstName: userProfile?.firstName || user?.displayName?.split(' ')[0] || '',
          lastName: userProfile?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
          bio: '',
          profilePicture: userProfile?.profilePicture || user?.photoURL || null
        }
      }));
    }
  }, [settings, userProfile, user]);


  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async (section: string, data: any) => {
    setSaveStatus(prev => ({ ...prev, [section]: 'saving' }));
    
    try {
      if (section === 'profile') {
        await updateProfile(data);
        
        // Update Firebase user's displayName if firstName or lastName changed
        if (data.firstName || data.lastName) {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const newDisplayName = `${data.firstName || formData.profile.firstName} ${data.lastName || formData.profile.lastName}`.trim();
            await updateFirebaseProfile(currentUser, {
              displayName: newDisplayName
            });
            
            // Trigger a custom event to notify other components
            const userProfileUpdatedEvent = new CustomEvent('userProfileUpdated', {
              detail: { 
                userId: currentUser.uid, 
                user: {
                  ...currentUser,
                  displayName: newDisplayName
                }
              }
            });
            window.dispatchEvent(userProfileUpdatedEvent);
            
            // Trigger refresh of all user profiles across the system
            triggerAllUserProfilesRefresh();
          }
        }
      } else {
        await updateSection(section, data);
      }
      setSaveStatus(prev => ({ ...prev, [section]: 'success' }));
      showMessage('success', `${section} settings saved successfully`);
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      }, 2000);
    } catch (err: any) {
      setSaveStatus(prev => ({ ...prev, [section]: 'error' }));
      showMessage('error', err.message || `Failed to save ${section} settings`);
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [section]: 'idle' }));
      }, 3000);
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      showMessage('error', 'Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      showMessage('error', 'New password is required');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showMessage('error', 'New password must be different from current password');
      return;
    }

    setSaveStatus(prev => ({ ...prev, password: 'saving' }));
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(currentUser.email, passwordData.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordData.newPassword);

      // Clear form
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setSaveStatus(prev => ({ ...prev, password: 'success' }));
      showMessage('success', 'Password changed successfully');
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, password: 'idle' }));
      }, 2000);
    } catch (err: any) {
      setSaveStatus(prev => ({ ...prev, password: 'error' }));
      
      // Handle specific Firebase errors
      let errorMessage = 'Failed to change password';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'The current password you entered is incorrect. Please check and try again.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'The new password is too weak. Please choose a stronger password with at least 6 characters.';
      } else if (err.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log out and log back in before changing your password.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please wait a few minutes before trying again.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'User account not found. Please try logging in again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Password change is not allowed for this account type.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showMessage('error', errorMessage);
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, password: 'idle' }));
      }, 3000);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    try {
      // Update theme in context (this will update the DOM and all components)
      setTheme(newTheme);
      
      // Update settings in backend
      await updateSection('appearance', { ...formData.appearance, theme: newTheme });
      setFormData(prev => ({
        ...prev,
        appearance: { ...prev.appearance, theme: newTheme }
      }));
      showMessage('success', 'Theme updated successfully');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to update theme');
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      try {
        await resetSettings();
        showMessage('success', 'Settings reset to default successfully');
      } catch (err: any) {
        showMessage('error', err.message || 'Failed to reset settings');
      }
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('success', 'User data exported successfully');
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to export user data');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE';
    const userInput = window.prompt(
      `This action is irreversible. All your data will be permanently deleted.\n\nType "${confirmText}" to confirm:`
    );
    
    if (userInput === confirmText) {
      try {
        await deleteAccount();
        showMessage('success', 'Account deleted successfully. You will be redirected to login.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } catch (err: any) {
        showMessage('error', err.message || 'Failed to delete account');
      }
    }
  };

  if (loading && !settings) {
    return (
      <div className="p-4 bg-neutral-light dark:bg-gray-900 min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg border flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {message.type === 'success' ? (
              <LucideCheck className="w-5 h-5" />
            ) : (
              <LucideAlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {message.type === 'success' ? 'Success!' : 'Error'}
            </p>
            <p className="text-sm mt-1">{message.text}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center space-x-2">
          <LucideAlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Settings Menu */}
        <div className={`lg:col-span-1 p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Settings Menu</h3>
          <nav className="space-y-1">
            {settingsSections.map(({ id, title, icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-md text-left transition-colors text-xs ${
                  activeSection === id
                    ? 'bg-brand text-white'
                    : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {icon}
                <span>{title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className={`lg:col-span-3 p-4 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {activeSection === 'profile' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Profile Settings</h3>
              
              {/* Current User Info */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  {(() => {
                    // Priority: userProfile.profilePicture -> user.photoURL -> default avatar
                    const profilePicture = userProfile?.profilePicture || user?.photoURL;
                    
                    if (profilePicture) {
                      return (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      );
                    } else {
                      return (
                        <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center">
                          <LucideUser className="w-5 h-5 text-white" />
                        </div>
                      );
                    }
                  })()}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {(() => {
                        if (userProfile?.firstName && userProfile?.lastName) {
                          return `${userProfile.firstName} ${userProfile.lastName}`;
                        }
                        if (user?.displayName) {
                          return user.displayName;
                        }
                        return 'Current User';
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || 'No email available'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.profile.firstName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, firstName: e.target.value }
                      }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.profile.lastName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, lastName: e.target.value }
                      }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    placeholder="Email address"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    value={formData.profile.bio}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, bio: e.target.value }
                    }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div className="pt-2 flex items-center space-x-2">
                  <button 
                    onClick={() => handleSave('profile', formData.profile)}
                    disabled={saveStatus.profile === 'saving'}
                    className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    {saveStatus.profile === 'saving' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : saveStatus.profile === 'success' ? (
                      <>
                        <LucideCheck className="w-3 h-3" />
                        <span>Saved!</span>
                      </>
                    ) : saveStatus.profile === 'error' ? (
                      <>
                        <LucideAlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </>
                    ) : (
                      <>
                        <LucideSave className="w-3 h-3" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <NotificationPreferences userId={user?.uid || ''} />
          )}

          {activeSection === 'security' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Security & Privacy</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Change Password</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                          // Clear error state when user starts typing
                          if (saveStatus.password === 'error') {
                            setSaveStatus(prev => ({ ...prev, password: 'idle' }));
                          }
                        }}
                        className={`w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          saveStatus.password === 'error' 
                            ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600 focus:ring-brand focus:border-brand'
                        }`}
                        placeholder="Enter current password"
                      />
                      {saveStatus.password === 'error' && (
                        <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                          💡 Make sure you're entering the correct current password
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter new password (min. 6 characters)"
                      />
                      {passwordData.newPassword && (
                        <div className="mt-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Password strength: {
                              passwordData.newPassword.length < 6 ? 'Too short' :
                              passwordData.newPassword.length < 8 ? 'Weak' :
                              passwordData.newPassword.length < 12 ? 'Medium' : 'Strong'
                            }
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-1">
                            <div 
                              className={`h-1 rounded-full transition-all ${
                                passwordData.newPassword.length < 6 ? 'w-1/4 bg-red-500' :
                                passwordData.newPassword.length < 8 ? 'w-2/4 bg-yellow-500' :
                                passwordData.newPassword.length < 12 ? 'w-3/4 bg-blue-500' : 'w-full bg-green-500'
                              }`}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                            ? 'border-red-500 dark:border-red-500'
                            : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword
                            ? 'border-green-500 dark:border-green-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Confirm new password"
                      />
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <div className="mt-1 text-xs text-red-500">
                          Passwords do not match
                    </div>
                      )}
                      {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && passwordData.newPassword && (
                        <div className="mt-1 text-xs text-green-500">
                          Passwords match
                        </div>
                      )}
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={handlePasswordChange}
                        disabled={
                          saveStatus.password === 'saving' || 
                          !passwordData.currentPassword || 
                          !passwordData.newPassword || 
                          !passwordData.confirmPassword ||
                          passwordData.newPassword !== passwordData.confirmPassword ||
                          passwordData.newPassword.length < 6 ||
                          passwordData.currentPassword === passwordData.newPassword
                        }
                        className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {saveStatus.password === 'saving' ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                            <span>Changing...</span>
                          </>
                        ) : saveStatus.password === 'success' ? (
                          <>
                            <LucideCheck className="w-3 h-3" />
                            <span>Changed!</span>
                          </>
                        ) : saveStatus.password === 'error' ? (
                          <>
                            <LucideAlertCircle className="w-3 h-3" />
                            <span>Error</span>
                          </>
                        ) : (
                          <>
                            <LucideSave className="w-3 h-3" />
                            <span>Change Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.security.twoFactorEnabled}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            security: { ...prev.security, twoFactorEnabled: e.target.checked }
                          }));
                          handleSave('security', { ...formData.security, twoFactorEnabled: e.target.checked });
                        }}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                    </label>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white">Login Notifications</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get notified when someone logs into your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.security.loginNotifications}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          security: { ...prev.security, loginNotifications: e.target.checked }
                        }))}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                    </label>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => handleSave('security', formData.security)}
                    disabled={saveStatus.security === 'saving'}
                    className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    {saveStatus.security === 'saving' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : saveStatus.security === 'success' ? (
                      <>
                        <LucideCheck className="w-3 h-3" />
                        <span>Saved!</span>
                      </>
                    ) : saveStatus.security === 'error' ? (
                      <>
                        <LucideAlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </>
                    ) : (
                      <>
                        <LucideSave className="w-3 h-3" />
                        <span>Save Security Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Appearance Settings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Theme</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => handleThemeChange('light')}
                      className={`p-3 border rounded-md transition-colors ${
                        theme === 'light' 
                          ? 'border-2 border-brand' 
                          : 'border border-gray-300 dark:border-gray-600 hover:border-brand'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 bg-white border border-gray-300 rounded mx-auto mb-2"></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">Light</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleThemeChange('dark')}
                      className={`p-3 border rounded-md transition-colors ${
                        theme === 'dark' 
                          ? 'border-2 border-brand' 
                          : 'border border-gray-300 dark:border-gray-600 hover:border-brand'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-900 rounded mx-auto mb-2"></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">Dark</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => handleThemeChange('auto')}
                      className={`p-3 border rounded-md transition-colors ${
                        theme === 'auto' 
                          ? 'border-2 border-brand' 
                          : 'border border-gray-300 dark:border-gray-600 hover:border-brand'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-900 rounded mx-auto mb-2"></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">Auto</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Language</h4>
                  <select 
                    value={formData.appearance.language}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, language: e.target.value }
                    }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                  </select>
              </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Time Zone</h4>
                  <select 
                    value={formData.appearance.timezone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, timezone: e.target.value }
                    }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="UTC-8">UTC-8 (Pacific)</option>
                    <option value="UTC-5">UTC-5 (Eastern)</option>
                    <option value="UTC+0">UTC+0 (GMT)</option>
                    <option value="UTC+1">UTC+1 (CET)</option>
                  </select>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Time Format</h4>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="12h"
                        checked={formData.appearance.timeFormat === '12h'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, timeFormat: e.target.value as '12h' | '24h' }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">12-hour (AM/PM)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="timeFormat"
                        value="24h"
                        checked={formData.appearance.timeFormat === '24h'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          appearance: { ...prev.appearance, timeFormat: e.target.value as '12h' | '24h' }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">24-hour</span>
                    </label>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => handleSave('appearance', formData.appearance)}
                    disabled={saveStatus.appearance === 'saving'}
                    className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    {saveStatus.appearance === 'saving' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : saveStatus.appearance === 'success' ? (
                      <>
                        <LucideCheck className="w-3 h-3" />
                        <span>Saved!</span>
                      </>
                    ) : saveStatus.appearance === 'error' ? (
                      <>
                        <LucideAlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </>
                    ) : (
                      <>
                        <LucideSave className="w-3 h-3" />
                        <span>Save Appearance Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">System Settings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Data & Storage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Storage Used</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">2.4 GB / 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-brand h-1.5 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">System Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 dark:text-white">Auto Save</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Automatically save changes</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.system.autoSave}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            system: { ...prev.system, autoSave: e.target.checked }
                          }))}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 dark:text-white">Cache Enabled</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Enable local caching for better performance</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.system.cacheEnabled}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            system: { ...prev.system, cacheEnabled: e.target.checked }
                          }))}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 dark:text-white">Analytics</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Help improve the app with usage analytics</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.system.analyticsEnabled}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            system: { ...prev.system, analyticsEnabled: e.target.checked }
                          }))}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 dark:text-white">Crash Reporting</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Send crash reports to help fix bugs</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.system.crashReporting}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            system: { ...prev.system, crashReporting: e.target.checked }
                          }))}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleSave('system', formData.system)}
                      disabled={saveStatus.system === 'saving'}
                      className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {saveStatus.system === 'saving' ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : saveStatus.system === 'success' ? (
                        <>
                          <LucideCheck className="w-3 h-3" />
                          <span>Saved!</span>
                        </>
                      ) : saveStatus.system === 'error' ? (
                        <>
                          <LucideAlertCircle className="w-3 h-3" />
                          <span>Error</span>
                        </>
                      ) : (
                        <>
                          <LucideSave className="w-3 h-3" />
                          <span>Save Settings</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear the cache? This will remove all cached data.')) {
                          localStorage.clear();
                          sessionStorage.clear();
                          showMessage('success', 'Cache cleared successfully');
                        }
                      }}
                      className="bg-red-600 text-white px-3 py-2 text-xs rounded-md hover:bg-red-700 transition-colors"
                    >
                    Clear Cache
                  </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Language & Region</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Language
                  </label>
                  <select 
                    value={formData.appearance.language}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, language: e.target.value }
                    }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Time Zone
                  </label>
                  <select 
                    value={formData.appearance.timezone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, timezone: e.target.value }
                    }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="UTC-8">UTC-8 (Pacific)</option>
                    <option value="UTC-5">UTC-5 (Eastern)</option>
                    <option value="UTC+0">UTC+0 (GMT)</option>
                    <option value="UTC+1">UTC+1 (CET)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Date Format
                  </label>
                  <select 
                    value={formData.appearance.dateFormat}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      appearance: { ...prev.appearance, dateFormat: e.target.value }
                    }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={() => handleSave('appearance', formData.appearance)}
                    disabled={saveStatus.appearance === 'saving'}
                    className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    {saveStatus.appearance === 'saving' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : saveStatus.appearance === 'success' ? (
                      <>
                        <LucideCheck className="w-3 h-3" />
                        <span>Saved!</span>
                      </>
                    ) : saveStatus.appearance === 'error' ? (
                      <>
                        <LucideAlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </>
                    ) : (
                      <>
                        <LucideSave className="w-3 h-3" />
                        <span>Save Preferences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Additional sections for privacy and account management */}
          {activeSection === 'privacy' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Profile Visibility</h4>
                  <select 
                    value={formData.privacy.profileVisibility}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, profileVisibility: e.target.value as 'public' | 'private' | 'facility-only' }
                    }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="private">Private</option>
                    <option value="facility-only">Facility Members Only</option>
                    <option value="public">Public</option>
                  </select>
        </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white">Show Online Status</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Let others see when you're online</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.privacy.showOnlineStatus}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showOnlineStatus: e.target.checked }
                      }))}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white">Allow Direct Messages</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Let other users send you direct messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={formData.privacy.allowDirectMessages}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, allowDirectMessages: e.target.checked }
                      }))}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => handleSave('privacy', formData.privacy)}
                    disabled={saveStatus.privacy === 'saving'}
                    className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    {saveStatus.privacy === 'saving' ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : saveStatus.privacy === 'success' ? (
                      <>
                        <LucideCheck className="w-3 h-3" />
                        <span>Saved!</span>
                      </>
                    ) : saveStatus.privacy === 'error' ? (
                      <>
                        <LucideAlertCircle className="w-3 h-3" />
                        <span>Error</span>
                      </>
                    ) : (
                      <>
                        <LucideSave className="w-3 h-3" />
                        <span>Save Privacy Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Management Section */}
          {activeSection === 'account' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Account Management</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3">Data Management</h4>
                  <div className="space-y-3">
                    <button 
                      onClick={handleExportData}
                      className="w-full bg-blue-600 text-white px-3 py-2 text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <LucideSave className="w-3 h-3" />
                      <span>Export User Data</span>
                    </button>
                    <button 
                      onClick={handleResetSettings}
                      className="w-full bg-yellow-600 text-white px-3 py-2 text-xs rounded-md hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-1"
                    >
                      <LucideSettings className="w-3 h-3" />
                      <span>Reset Settings to Default</span>
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3 text-red-600 dark:text-red-400">Danger Zone</h4>
                  <button 
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-600 text-white px-3 py-2 text-xs rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <LucideAlertCircle className="w-3 h-3" />
                    <span>Delete Account</span>
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This action is irreversible. All your data will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuSettings;