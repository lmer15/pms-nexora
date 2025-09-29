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
} from 'lucide-react';
import { facilityService, Facility } from '../api/facilityService';
import CreateFacilityModal from './CreateFacilityModal';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, isDarkMode }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const data = await facilityService.getAll();
      setFacilities(data);
    } catch (error) {
      console.error('Error loading facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFacility = async (facilityData: { name: string }) => {
    try {
      const newFacility = await facilityService.create(facilityData);
      setFacilities(prev => [...prev, newFacility]);
    } catch (error) {
      console.error('Error creating facility:', error);
      throw error;
    }
  };

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
          <div className="mb-3">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-2 py-1">
                <NavLink
                  to="/Facilities"
                  className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-brand transition-colors cursor-pointer"
                >
                  Facilities
                </NavLink>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Add Facility"
                >
                  <LucidePlus className="w-4 h-4 text-brand" />
                </button>
              </div>
            )}

            {loading ? (
              !isCollapsed && (
                <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              )
            ) : isCollapsed ? (
              <NavLink
                to="/Facilities"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1 rounded-md transition-colors duration-200 justify-center ${
                    isActive
                      ? 'bg-brand text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
                  }`
                }
                title="Facilities"
              >
                <LucideBuilding className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
              </NavLink>
            ) : facilities.length === 0 ? (
              <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                No facilities yet
              </div>
            ) : (
              <div className="space-y-0.5">
                {facilities.map((facility) => (
                  <NavLink
                    key={facility.id}
                    to={`/facility/${facility.id}`}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1 rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-brand text-white'
                          : isDarkMode
                          ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
                      }`
                    }
                  >
                    <LucideBuilding className="w-4 h-4 flex-shrink-0" />
                    <span className="ml-2 text-xs truncate">{facility.name}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Resources Section */}
          {!isCollapsed && (
            <div className="mb-3">
              <h3 className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Resources
              </h3>
            </div>
          )}

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
        </nav>

        {/* Footer */}
        <div className={`px-4 py-3 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {!isCollapsed && (
            <button className={`flex items-center space-x-2 transition-colors text-sm ${
              isDarkMode
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-brand'
            }`}>
              <LucideHelpCircle className="w-4 h-4" />
              <span>Help</span>
            </button>
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

      <CreateFacilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateFacility}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default Sidebar;