import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LucideGrid,
  LucideClipboardList,
  LucideClock,
  LucideUsers,
  LucideSettings,
  LucideHelpCircle,
  LucidePlus,
  LucideBuilding,
  LucideFileText,
  LucideMessageSquare,
  LucideUser,
  LucideLogOut,
  LucideChevronDown,
} from 'lucide-react';
import { facilityService, Facility } from '../api/facilityService';
import { useFacility } from '../context/FacilityContext';
import { useAuth } from '../context/AuthContext';
import CreateFacilityModal from './CreateFacilityModal';
import CollapsibleFacilitiesList from './CollapsibleFacilitiesList';
import Tooltip from './ui/Tooltip';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isDarkMode }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed left-0 top-0 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } h-screen ${
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
              <h1 className="text-lg font-semibold text-brand">Nexora</h1>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {/* Facilities Section */}
          {!isCollapsed && (
            <div className="px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Facilities
              </h3>
            </div>
          )}
          <CollapsibleFacilitiesList 
            isCollapsed={isCollapsed} 
            isDarkMode={isDarkMode} 
          />

          {/* Resources Section */}
          <div className="mt-4">
            {!isCollapsed && (
              <div className="px-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resources
                </h3>
              </div>
            )}
            
            <div className="space-y-1">
              <Tooltip content="Dashboard" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
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
                  <LucideGrid className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && <span className="ml-2 text-xs">Dashboard</span>}
                </NavLink>
              </Tooltip>

              <Tooltip content="Resource Management" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/resource-mgmt"
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
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
                  <LucideClipboardList className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && <span className="ml-2 text-xs">Resource Mgmt</span>}
                </NavLink>
              </Tooltip>

              <Tooltip content="Time Log" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/time-log"
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
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
                  <LucideClock className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && <span className="ml-2 text-xs">Time log</span>}
                </NavLink>
              </Tooltip>

              <Tooltip content="Notes" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/notes"
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
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
                  <LucideFileText className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && <span className="ml-2 text-xs">Notes</span>}
                </NavLink>
              </Tooltip>

              <Tooltip content="Meetings" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/meetings"
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
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
                  <LucideMessageSquare className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && <span className="ml-2 text-xs">Meetings</span>}
                </NavLink>
              </Tooltip>

              <Tooltip content="Users" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
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
                  <LucideUsers className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && <span className="ml-2 text-xs">Users</span>}
                </NavLink>
              </Tooltip>

              <Tooltip content="Settings" position="right" disabled={!isCollapsed}>
                <NavLink
                  to="/menu-settings"
                  className={({ isActive }) =>
                    `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 ${
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
                  <LucideSettings className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!isCollapsed && <span className="ml-2 text-xs">Settings</span>}
                </NavLink>
              </Tooltip>
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={`px-4 py-3 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {!isCollapsed ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                {user && user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
                    <LucideUser className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user && user.displayName ? user.displayName : 'User'}
                  </p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {user && user.email ? user.email : 'user@example.com'}
                  </p>
                </div>
                <LucideChevronDown className={`w-4 h-4 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className={`absolute bottom-full left-4 right-4 mb-2 rounded-lg shadow-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="py-1">
                    <button className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <LucideUser className="w-4 h-4 inline mr-2" />
                      Profile Settings
                    </button>
                    <button className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <LucideHelpCircle className="w-4 h-4 inline mr-2" />
                      Help & Support
                    </button>
                    <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                    <button
                      onClick={logout}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400`}
                    >
                      <LucideLogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {user && user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
                  <LucideUser className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-2">
          {!isCollapsed && (
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              &copy; 2024 PMSNexora. All rights reserved.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;