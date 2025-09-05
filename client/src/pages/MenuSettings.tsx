import React, { useState, useEffect } from 'react';
import {
  LucideSettings,
  LucideUser,
  LucideBell,
  LucideShield,
  LucidePalette,
  LucideGlobe,
} from 'lucide-react';

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
];

const MenuSettings: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-4 bg-neutral-light dark:bg-gray-900 min-h-full">
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
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
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div className="pt-2">
                  <button className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Notification Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white">Email Notifications</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white">Push Notifications</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 dark:text-white">Task Reminders</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Get reminded about upcoming tasks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand"></div>
                  </label>
                </div>
              </div>
            </div>
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
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button className="bg-red-600 text-white px-3 py-2 text-xs rounded-md hover:bg-red-700 transition-colors">
                    Enable Two-Factor Authentication
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
                    <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:border-brand transition-colors">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-white border border-gray-300 rounded mx-auto mb-2"></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">Light</span>
                      </div>
                    </button>
                    <button className="p-3 border-2 border-brand rounded-md">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gray-900 rounded mx-auto mb-2"></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">Dark</span>
                      </div>
                    </button>
                    <button className="p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:border-brand transition-colors">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-900 rounded mx-auto mb-2"></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">Auto</span>
                      </div>
                    </button>
                  </div>
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
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button className="bg-red-600 text-white px-3 py-2 text-xs rounded-md hover:bg-red-700 transition-colors">
                    Clear Cache
                  </button>
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
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>English (US)</option>
                    <option>English (UK)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Time Zone
                  </label>
                  <select className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>UTC-8 (Pacific)</option>
                    <option>UTC-5 (Eastern)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (CET)</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button className="bg-brand text-white px-3 py-2 text-xs rounded-md hover:bg-brand-dark transition-colors">
                    Save Preferences
                  </button>
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