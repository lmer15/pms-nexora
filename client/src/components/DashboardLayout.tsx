import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LucideBell, LucideUser, LucideSun, LucideMoon, LucideChevronRight, LucideBuilding } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrentFacility } from '../context/CurrentFacilityContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentFacilityName } = useCurrentFacility();
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
      '/dashboard': 'Dashboard',
      '/Facilities': 'Facilities Management',
      '/time-log': 'Time Log',
      '/resource-mgmt': 'Resource Management',
      '/users': 'Users Management',
      '/menu-settings': 'Settings',
      '/notes': 'Notes',
      '/meetings': 'Meetings'
    };
    
    // Handle dynamic facility route
    if (pathname.startsWith('/facility/')) {
      return 'Facility View';
    }
    
    return routeTitles[pathname] || 'Dashboard';
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
    <div className={`h-screen overflow-hidden ${isDarkMode ? 'bg-neutral-dark' : 'bg-neutral-light'}`}>
      {/* Header */}
      <header className={`fixed top-0 ${isSidebarCollapsed ? 'left-16' : 'left-64'} right-0 z-30 shadow-sm border-b h-14 flex items-center justify-between px-6 ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`} style={{ margin: 0 }}>

        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/Facilities')}
                className={`text-sm font-medium hover:underline transition-colors ml-3 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'
                }`}
              >
                {getPageTitle(location.pathname)}
              </button>
              {currentFacilityName && location.pathname.startsWith('/facility/') && (
                <LucideChevronRight className="w-4 h-4 text-green-500 ml-3" />
              )}
            </div>
            {currentFacilityName && location.pathname.startsWith('/facility/') && (
              <div className="flex items-center space-x-2">
                <LucideBuilding className="w-4 h-4 text-gray-500" />
                <span className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentFacilityName}
                </span>
              </div>
            )}
          </div>
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
      <main className={`${isSidebarCollapsed ? 'ml-16' : 'ml-64'} mt-14 h-[calc(100vh-3.5rem)] ${
        location.pathname.startsWith('/facility/') 
          ? 'overflow-hidden' 
          : 'overflow-y-auto p-4'
      }`}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;