import React, { useState, useEffect } from 'react';
import { 
  LucideBell, 
  LucideMail, 
  LucideSmartphone, 
  LucideCheckCircle, 
  LucideXCircle,
  LucideSave,
  LucideRefreshCw
} from 'lucide-react';
import settingsService, { UserSettings } from '../api/settingsService';

interface NotificationPreferencesProps {
  userId: string;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ userId }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      setSettings(response.data || null);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setMessage({ type: 'error', text: 'Failed to load notification settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await settingsService.updateSettings(settings);
      setMessage({ type: 'success', text: 'Notification preferences saved successfully' });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage({ type: 'error', text: 'Failed to save notification preferences' });
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    });
  };

  const resetToDefaults = () => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        projectUpdates: true,
        facilityInvites: true,
        weeklyDigest: false
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LucideRefreshCw className="w-6 h-6 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading notification preferences...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center">
        <LucideXCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load notification settings</p>
        <button
          onClick={loadSettings}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage how and when you receive notifications
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetToDefaults}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <LucideRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LucideSave className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        }`}>
          {message.type === 'success' ? (
            <LucideCheckCircle className="w-5 h-5" />
          ) : (
            <LucideXCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Notification Channels */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Notification Channels</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LucideMail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => updateNotificationSetting('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LucideSmartphone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive push notifications in your browser
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.pushNotifications}
                onChange={(e) => updateNotificationSetting('pushNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Notification Types</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LucideBell className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Task Reminders</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about task assignments, updates, and due dates
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.taskReminders}
                onChange={(e) => updateNotificationSetting('taskReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LucideBell className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Project Updates</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about project status changes and updates
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.projectUpdates}
                onChange={(e) => updateNotificationSetting('projectUpdates', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LucideBell className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Facility Invites</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when you're invited to join a facility
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.facilityInvites}
                onChange={(e) => updateNotificationSetting('facilityInvites', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LucideBell className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Weekly Digest</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive a weekly summary of your activities and updates
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.weeklyDigest}
                onChange={(e) => updateNotificationSetting('weeklyDigest', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Security Notifications</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <LucideBell className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Login Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when someone logs into your account
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.security.loginNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    loginNotifications: e.target.checked
                  }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
