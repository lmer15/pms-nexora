import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LucideBell, LucideUser, LucideSun, LucideMoon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Map routes to display names
  const getPageTitle = (pathname: string) => {
    const routeTitles: Record<string, string> = {
      '/dashboard': 'Facility Dashboard',
      '/Facilities': 'Facilities Management',
      '/time-log': 'Time Log',
      '/resource-mgmt': 'Resource Management',
      '/users': 'Users Management',
      '/menu-settings': 'Settings',
      '/notes': 'Notes',
      '/meetings': 'Meetings'
    };
    return routeTitles[pathname] || 'Facility Dashboard';
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    // Sync state with actual class on mount
    const html = document.documentElement;
    setIsDarkMode(html.classList.contains('dark'));
  }, []);

  return (
    <div className={`h-screen ${isDarkMode ? 'bg-neutral-dark' : 'bg-neutral-light'}`}>
      {/* Header */}
      <header className={`fixed top-0 ${isSidebarCollapsed ? 'left-16' : 'left-64'} right-0 z-30 shadow-sm border-b px-6 py-3 flex items-center justify-between h-14 ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Collapse Arrow */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className={`absolute top-3 left-0 z-40 p-1 rounded-r-md transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-brand-light border border-gray-700'
              : 'bg-white hover:bg-gray-50 text-brand border border-gray-200'
          } flex items-center justify-center shadow-sm`}
          style={{ width: '32px', height: '32px' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={isSidebarCollapsed ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
          </svg>
        </button>

        <div className="flex items-center space-x-4 pl-10">
          <h1 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {getPageTitle(location.pathname)}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            aria-label="Notifications"
            className={`p-1.5 rounded-lg transition-colors relative ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <LucideBell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <button
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {isDarkMode ? <LucideSun className="w-4 h-4" /> : <LucideMoon className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2">
            {user && user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-brand' : 'bg-brand'
              }`}>
                <LucideUser className="w-4 h-4 text-white" />
              </div>
            )}
            <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
              {user && user.displayName ? user.displayName : 'User'}
            </span>
          </div>
        </div>
      </header>

      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} isDarkMode={isDarkMode} />

      {/* Main Content */}
      <main className={`p-4 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'} mt-14 h-[calc(100vh-3.5rem)]`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;