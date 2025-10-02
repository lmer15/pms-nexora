import React, { useState, useEffect } from 'react';
import {
  LucideUsers,
  LucideClipboardList,
  LucideSearch,
  LucideShare2,
  LucidePlus,
  LucideUserPlus,
  LucideCalendar,
  LucideClock,
  LucideCheckCircle,
  LucideAlertCircle,
  LucideGrid3X3,
  LucideList,
  LucideCalendar as CalendarIcon,
  LucideChevronDown,
} from 'lucide-react';
import { Facility } from '../types';
import { facilityService, FacilityMember } from '../../../api/facilityService';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';
import ShareFacilityModal from './ShareFacilityModal';

interface FacilityHeaderProps {
  facility: Facility;
  projectsCount: number;
  memberCount: number;
  filteredProjectsCount?: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: string;
  setFilter: (filter: string) => void;
  isDarkMode: boolean;
  // Enhanced stats
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
  currentView?: 'kanban' | 'list' | 'calendar' | 'timeline';
  onViewChange?: (view: 'kanban' | 'list' | 'calendar' | 'timeline') => void;
  onInviteMember?: () => void;
}

const FacilityHeader: React.FC<FacilityHeaderProps> = ({
  facility,
  projectsCount,
  memberCount,
  filteredProjectsCount,
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  isDarkMode,
  totalTasks = 0,
  completedTasks = 0,
  overdueTasks = 0,
  currentView = 'kanban',
  onViewChange,
  onInviteMember,
}) => {
  const { memberRefreshTriggers } = useFacilityRefresh();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [members, setMembers] = useState<FacilityMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [facilityStats, setFacilityStats] = useState({
    openTaskCount: 0,
    completionPercentage: 0,
    nearestDueDate: null as string | null
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Calculate completion percentage from passed props
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Fetch facility members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!facility?.id) return;
      
      setIsLoadingMembers(true);
      try {
        const membersData = await facilityService.getFacilityMembers(facility.id);
        setMembers(membersData);
      } catch (error) {
        console.error('Failed to fetch facility members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [facility?.id, memberRefreshTriggers[facility?.id || '']]);

  // Update facility stats when props change
  useEffect(() => {
    setFacilityStats({
      openTaskCount: totalTasks - completedTasks,
      completionPercentage: completionPercentage,
      nearestDueDate: null // We can add this later if needed
    });
  }, [totalTasks, completedTasks, completionPercentage]);


  return (
    <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} style={{ margin: 0, padding: 0, width: '100%' }}>
      {/* Row 1: Context + Key Metrics */}
      <div className="flex items-center justify-between mb-2 px-6 py-2">
        {/* Left Cluster: Context */}
        <div className="flex items-center space-x-4">
          {/* Project Status with Progress */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <LucideCheckCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  completionPercentage === 0 ? 'bg-gray-300' :
                  completionPercentage < 50 ? 'bg-red-500' :
                  completionPercentage < 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.max(completionPercentage, 2)}%` }}
                title={`${completionPercentage}% complete`}
              />
            </div>
          </div>

          {/* Due Date - More Prominent */}
          {facilityStats.nearestDueDate && (
            <div className="flex items-center space-x-2">
              <LucideCalendar className={`w-4 h-4 ${
                new Date(facilityStats.nearestDueDate) < new Date() ? 'text-red-500' :
                new Date(facilityStats.nearestDueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-yellow-500' : 'text-green-500'
              }`} />
              <span className={`text-sm font-semibold ${
                new Date(facilityStats.nearestDueDate) < new Date() ? 'text-red-600 dark:text-red-400' :
                new Date(facilityStats.nearestDueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                Due {new Date(facilityStats.nearestDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}

          {/* Open Tasks */}
            <div className="flex items-center space-x-2">
            <LucideClipboardList className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isLoadingStats ? '...' : `${facilityStats.openTaskCount} open`}
              </span>
            </div>
        </div>

        {/* Right Cluster: Team + Actions */}
        <div className="flex items-center space-x-3">
          {/* Members with Better Display */}
        <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isLoadingMembers ? (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
              ) : (
                <>
                  {members.slice(0, 4).map((member, index) => (
                    <div key={member.id} className="relative group">
                      {member.profilePicture ? (
                        <img
                          src={member.profilePicture}
                          alt={member.name}
                          className="w-6 h-6 rounded-full object-cover border border-white dark:border-gray-700 cursor-pointer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          title={member.name}
                        />
                      ) : null}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium border border-white dark:border-gray-700 cursor-pointer ${
                          member.profilePicture ? 'hidden' : ''
                        }`}
                        style={{ backgroundColor: '#6B7280' }}
                        title={member.name}
                      >
                        {member.name.charAt(0).toUpperCase()}{member.name.charAt(1)?.toUpperCase() || ''}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {member.name}
                      </div>
                    </div>
                  ))}
                  {members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium border border-white dark:border-gray-700 cursor-pointer group relative">
                      +{members.length - 4}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {members.length - 4} more members
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Share & Invite Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-medium"
          >
            <LucideShare2 className="w-4 h-4" />
            <span>Share & Invite</span>
          </button>
        </div>
      </div>

      {/* Row 2: Search, Filters, and View Controls */}
      <div className="flex items-center justify-between px-6 pb-2">
        {/* Left: Search and Quick Filters */}
        <div className="flex items-center space-x-2">
          {/* Search Bar */}
          <div className="relative">
            <LucideSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search tasks and projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border-0 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-56 shadow-sm hover:shadow-md focus:ring-2 focus:ring-brand focus:shadow-lg focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Quick Filter Chips with Better Active State */}
          <div className="flex items-center space-x-1">
            {['all', 'active', 'completed', 'with-tasks', 'empty'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  filter === filterOption
                    ? 'bg-brand text-white shadow-md font-semibold'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption === 'all' ? 'All' : 
                 filterOption === 'active' ? 'Active' :
                 filterOption === 'completed' ? 'Completed' :
                 filterOption === 'with-tasks' ? 'With tasks' : 'Empty'}
              </button>
            ))}
          </div>
            
        </div>

        {/* Right: View Controls */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => onViewChange?.('kanban')}
              className={`p-1.5 rounded transition-all duration-200 ${
                currentView === 'kanban'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            title="Grid View"
            >
              <LucideGrid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange?.('list')}
              className={`p-1.5 rounded transition-all duration-200 ${
                currentView === 'list'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="List View"
            >
              <LucideList className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange?.('calendar')}
              className={`p-1.5 rounded transition-all duration-200 ${
                currentView === 'calendar'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Calendar View"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          <button
            onClick={() => onViewChange?.('timeline')}
            className={`p-1.5 rounded transition-all duration-200 ${
              currentView === 'timeline'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Timeline View"
          >
            <LucideClock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share Modal */}
      <ShareFacilityModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        facilityId={facility.id}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default FacilityHeader;
