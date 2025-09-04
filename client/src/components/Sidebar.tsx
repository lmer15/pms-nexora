import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LucideGrid,
  LucideClipboardList,
  LucideClock,
  LucideUsers,
  LucideSettings,
  LucideHelpCircle,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isDarkMode }) => {
  return (
    <div
      className={`h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isDarkMode 
          ? 'bg-neutral-dark text-white border-r border-gray-700' 
          : 'bg-white text-gray-900 border-r border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } flex items-center justify-start h-14`}>
        {isCollapsed ? (
          <img src="/images/nexora.png" alt="Nexora Logo" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="flex items-center space-x-2">
            <img src="/images/nexora.png" alt="PMSNexora Logo" className="w-8 h-8 rounded-full" />
            <h1 className="text-xl font-bold text-brand">Nexora</h1>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
            }`
          }
        >
          <LucideGrid className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Dashboard</span>}
        </NavLink>

        <NavLink
          to="/Facilities"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
            }`
          }
        >
          <LucideClipboardList className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Facilities</span>}
        </NavLink>

        <NavLink
          to="/time-log"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
            }`
          }
        >
          <LucideClock className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Time log</span>}
        </NavLink>

        <NavLink
          to="/resource-mgmt"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
            }`
          }
        >
          <LucideUsers className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Resource Mgnt.</span>}
        </NavLink>

        <NavLink
          to="/users"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
            }`
          }
        >
          <LucideUsers className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Users</span>}
        </NavLink>

        <NavLink
          to="/menu-settings"
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
              isCollapsed ? 'justify-center' : ''
            } ${
              isActive
                ? 'bg-brand text-white'
                : isDarkMode
                ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
            }`
          }
        >
          <LucideSettings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-3">Settings</span>}
        </NavLink>
      </nav>

      {/* Footer */}
      <div className={`px-4 py-3 border-t ${
        isDarkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {!isCollapsed && (
          <button className={`flex items-center space-x-2 transition-colors ${
            isDarkMode 
              ? 'text-gray-300 hover:text-white' 
              : 'text-gray-600 hover:text-brand'
          }`}>
            <LucideHelpCircle className="w-5 h-5" />
            <span>Help</span>
          </button>
        )}
      </div>
      
      <div className="px-4 py-3">
        {!isCollapsed && (
          <p className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            &copy; 2024 PMSNexora. All rights reserved.
          </p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;