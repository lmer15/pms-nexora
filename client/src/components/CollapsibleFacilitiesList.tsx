import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LucideBuilding, LucideChevronDown, LucideChevronRight, LucidePlus, LucideSearch, LucideClock, LucideCheckCircle, LucideAlertCircle, LucideX } from 'lucide-react';
import { facilityService, Facility } from '../api/facilityService';
import { useFacility } from '../context/FacilityContext';
import CreateFacilityModal from './CreateFacilityModal';
import Tooltip from './ui/Tooltip';

interface CollapsibleFacilitiesListProps {
  isCollapsed: boolean;
  isDarkMode: boolean;
}

const CollapsibleFacilitiesList: React.FC<CollapsibleFacilitiesListProps> = ({ 
  isCollapsed, 
  isDarkMode 
}) => {
  const { facilities, loading, refreshFacilities } = useFacility();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['facilities']));
  const [facilityStats, setFacilityStats] = useState<Record<string, { taskCount: number; overdueCount: number }>>({});

  // Get recent facilities (last 5 accessed)
  const recentFacilities = facilities.slice(0, 5);
  const hasFewFacilities = facilities.length <= 3;

  const handleCreateFacility = async (facilityData: { name: string }) => {
    try {
      await facilityService.create(facilityData);
      // Refresh the facilities list to show the new facility
      await refreshFacilities();
    } catch (error) {
      console.error('Error creating facility:', error);
      throw error;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const filteredFacilities = (facilitiesList: Facility[]) => {
    if (!searchTerm) return facilitiesList;
    return facilitiesList.filter(facility =>
      facility.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFacilityStatus = (facility: Facility) => {
    const stats = facilityStats[facility.id];
    if (!stats) return { status: 'active', badge: null };
    
    if (stats.overdueCount > 0) {
      return { status: 'overdue', badge: stats.overdueCount };
    } else if (stats.taskCount > 0) {
      return { status: 'active', badge: stats.taskCount };
    } else {
      return { status: 'empty', badge: null };
    }
  };

  const getStatusIcon = (status: string) => {
    const iconSize = isCollapsed ? 'w-5 h-5' : 'w-3 h-3';
    const buildingIconSize = isCollapsed ? 'w-5 h-5' : 'w-4 h-4';
    
    switch (status) {
      case 'overdue':
        return <LucideAlertCircle className={`${iconSize} text-red-500`} />;
      case 'active':
        return <LucideCheckCircle className={`${iconSize} text-green-500`} />;
      case 'empty':
        return <LucideClock className={`${iconSize} text-gray-400`} />;
      default:
        return <LucideBuilding className={`${buildingIconSize}`} />;
    }
  };

  const renderFacilityItem = (facility: Facility, isActive: boolean = false, showBadge: boolean = true) => {
    const { status, badge } = getFacilityStatus(facility);
    
    return (
      <NavLink
        key={facility.id}
        to={`/facility/${facility.id}`}
        className={({ isActive: navIsActive }) =>
          `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 group ${
            isCollapsed ? 'justify-center' : ''
          } ${
            navIsActive || isActive
              ? 'bg-brand text-white'
              : isDarkMode
              ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
          }`
        }
        title={isCollapsed ? facility.name : undefined}
      >
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            {getStatusIcon(status)}
          </div>
        ) : (
          <>
            <div className="flex items-center flex-1 min-w-0">
              {getStatusIcon(status)}
              <span className="ml-2 text-xs truncate font-medium">{facility.name}</span>
            </div>
            {showBadge && badge && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${
                status === 'overdue'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const renderFacilitiesSection = () => {
    const isExpanded = expandedSections.has('facilities');
    const filtered = filteredFacilities(facilities);
    const recentFiltered = filteredFacilities(recentFacilities);

    return (
      <div className="mb-2">
        {/* Section Header */}
        {!isCollapsed && (
          <button
            onClick={() => toggleSection('facilities')}
            className={`flex items-center justify-between w-full px-2 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
              isDarkMode ? 'text-gray-300 hover:text-gray-200' : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <span>Facilities</span>
            <div className="flex items-center space-x-1">
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
              }`}>
                {filtered.length}
              </span>
              {isExpanded ? (
                <LucideChevronDown className="w-3 h-3" />
              ) : (
                <LucideChevronRight className="w-3 h-3" />
              )}
            </div>
          </button>
        )}

        {/* Search Bar with Add Button */}
        {(!isCollapsed && isExpanded) && (
          <div className="px-2 mb-2">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <LucideSearch className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-7 pr-2 py-1.5 text-xs border-0 rounded-md ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-1 focus:ring-brand`}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <LucideX className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                title="Add Facility"
              >
                <LucidePlus className="w-4 h-4 text-brand" />
              </button>
            </div>
          </div>
        )}

        {/* Section Content */}
        {(!isCollapsed && isExpanded) && (
          <div className="space-y-1 ml-2">
            {filtered.length === 0 ? (
              <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No facilities found' : 'No facilities yet'}
              </div>
            ) : (
              <>
                {/* Recent Facilities (if not searching and there are recent ones) */}
                {!searchTerm && recentFiltered.length > 0 && recentFiltered.length < filtered.length && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recent
                    </div>
                    <div className="space-y-0.5 ml-2">
                      {recentFiltered.map(facility => renderFacilityItem(facility, false, true))}
                    </div>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      All Facilities
                    </div>
                    <div className="space-y-0.5 ml-2">
                      {filtered.filter(f => !recentFiltered.some(rf => rf.id === f.id)).map(facility => renderFacilityItem(facility, false, true))}
                    </div>
                  </>
                )}
                
                {/* All facilities (when searching or no recent distinction) */}
                {(!recentFiltered.length || recentFiltered.length === filtered.length || searchTerm) && (
                  <div className="space-y-0.5">
                    {filtered.map(facility => renderFacilityItem(facility, false, true))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    );
  };

  return (
    <>
      <div className="mb-3">


        {/* Collapsed Facilities Link */}
        {isCollapsed && (
          <NavLink
            to="/Facilities"
            className={({ isActive }) =>
              `flex items-center px-2 py-1.5 rounded-md transition-colors duration-200 justify-center ${
                isActive
                  ? 'bg-brand text-white'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-brand'
              }`
            }
            title="Facilities"
          >
            <LucideBuilding className="w-5 h-5 flex-shrink-0" />
            {facilities.length > 0 && (
              <span className="ml-1 text-xs font-medium">
                {facilities.length}
              </span>
            )}
          </NavLink>
        )}

        {/* Loading State */}
        {loading && !isCollapsed && (
          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        )}

        {/* Facilities Section */}
        {!loading && renderFacilitiesSection()}

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

export default CollapsibleFacilitiesList;
