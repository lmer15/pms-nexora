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
  LucideX,
  LucideBarChart3,
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
        className={`sidebar-container fixed left-0 top-0 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } h-screen rounded-r-lg ${
          isDarkMode
            ? 'bg-gray-900 text-white border-r border-gray-700'
            : 'bg-white text-gray-900 border-r border-gray-200'
        } z-40`}
      >
        {/* Brand Header */}
        <div className={`px-4 py-3 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        } flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-14`}>
          {isCollapsed ? (
            <button
              onClick={onToggle}
              className="flex items-center justify-center p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Expand sidebar"
            >
              <img 
                src="/images/nexora.png" 
                alt="Nexora Logo" 
                className="w-6 h-6 rounded-full object-cover flex-shrink-0" 
              />
            </button>
          ) : (
            <>
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <img 
                  src="/images/nexora.png" 
                  alt="PMSNexora Logo" 
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0" 
                />
                <h1 className="text-lg font-semibold text-brand truncate">Nexora</h1>
              </div>
              
              {/* Collapse Button */}
              <button
                onClick={onToggle}
                className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
                title="Collapse sidebar"
              >
                <LucideX className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col overflow-y-auto overflow-x-visible">
          {/* Main Navigation - Top Priority Resources */}
          <div className="px-3 py-2 overflow-visible">
            <div className="flex flex-col space-y-1 overflow-visible">
            <Tooltip content="Resource Analytics" position="right" disabled={!isCollapsed}>
              <NavLink
                to="/resources/analytics/global"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1.5 rounded-md transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  }`
                }
              >
                <LucideBarChart3 className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                {!isCollapsed && <span className="ml-2 text-sm leading-none">Dashboard Analytics</span>}
              </NavLink>
            </Tooltip>

            <Tooltip content="Time Log" position="right" disabled={!isCollapsed}>
              <NavLink
                to="/time-log"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1.5 rounded-md transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  }`
                }
              >
                <LucideClock className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                {!isCollapsed && <span className="ml-2 text-sm leading-none">Time Log</span>}
              </NavLink>
            </Tooltip>

            <Tooltip content="Notes" position="right" disabled={!isCollapsed}>
              <NavLink
                to="/notes"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1.5 rounded-md transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  }`
                }
              >
                <LucideFileText className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                {!isCollapsed && <span className="ml-2 text-sm leading-none">Notes</span>}
              </NavLink>
            </Tooltip>

            <Tooltip content="Meetings" position="right" disabled={!isCollapsed}>
              <NavLink
                to="/meetings"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1.5 rounded-md transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  }`
                }
              >
                <LucideMessageSquare className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                {!isCollapsed && <span className="ml-2 text-sm leading-none">Meetings</span>}
              </NavLink>
            </Tooltip>

            <Tooltip content="Users" position="right" disabled={!isCollapsed}>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1.5 rounded-md transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  }`
                }
              >
                <LucideUsers className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                {!isCollapsed && <span className="ml-2 text-sm leading-none">Users</span>}
              </NavLink>
            </Tooltip>

            <Tooltip content="Settings" position="right" disabled={!isCollapsed}>
              <NavLink
                to="/menu-settings"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1.5 rounded-md transition-all duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-brand'
                  }`
                }
              >
                <LucideSettings className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                {!isCollapsed && <span className="ml-2 text-sm leading-none">Settings</span>}
              </NavLink>
            </Tooltip>
            </div>
          </div>

          {/* Section Separator */}
          <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Facilities Section */}
          <div className="px-3 py-2 overflow-visible">
            <CollapsibleFacilitiesList 
              isCollapsed={isCollapsed} 
              isDarkMode={isDarkMode} 
            />
          </div>
        </nav>

        {/* User Profile Section */}
        <div className={`px-4 py-3 border-t ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          {!isCollapsed ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-full flex items-center space-x-3 p-2 rounded-md transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                {user && user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center">
                    <LucideUser className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {user && user.displayName ? user.displayName : 'User'}
                  </p>
                  <p className={`text-xs truncate ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {user && user.email ? user.email : 'user@example.com'}
                  </p>
                </div>
                <LucideChevronDown className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${
                  isProfileOpen ? 'rotate-180' : ''
                } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className={`absolute bottom-full left-3 right-3 mb-2 rounded-md shadow-lg border ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="py-1">
                    <button className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <LucideUser className="w-3.5 h-3.5 inline mr-2" />
                      Profile Settings
                    </button>
                    <button className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <LucideHelpCircle className="w-3.5 h-3.5 inline mr-2" />
                      Help & Support
                    </button>
                    <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                    <button
                      onClick={logout}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400`}
                    >
                      <LucideLogOut className="w-3.5 h-3.5 inline mr-2" />
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
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center">
                  <LucideUser className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-2">
          {!isCollapsed && (
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
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