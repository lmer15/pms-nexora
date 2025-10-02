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
  LucideChevronDown,
  LucideUser,
  LucideFlag,
  LucideTag,
  LucideBuilding,
  LucideFilter,
  LucideX,
  LucideBookmark,
} from 'lucide-react';
import { Facility } from '../types';
import { facilityService, FacilityMember } from '../../../api/facilityService';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';
import ShareFacilityModal from './ShareFacilityModal';
import BreadcrumbDropdown from '../../../components/BreadcrumbDropdown';
import SavedFilterViews from '../../../components/SavedFilterViews';

interface SlimFacilityHeaderProps {
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
  onInviteMember?: () => void;
  // Additional filters
  assigneeFilter?: string;
  setAssigneeFilter?: (assignee: string) => void;
  tagFilter?: string;
  setTagFilter?: (tag: string) => void;
  priorityFilter?: string;
  setPriorityFilter?: (priority: string) => void;
  availableAssignees?: Array<{id: string, name: string, email?: string, profilePicture?: string}>;
  availableTags?: Array<{id: string, name: string, color: string}>;
  // Projects for breadcrumb
  projects?: Array<{id: string, title: string, taskCount?: number}>;
  selectedProjectId?: string | null;
  onProjectSelect?: (projectId: string) => void;
  // Saved filter views
  onApplyFilters?: (filters: {searchTerm: string, filter: string, assigneeFilter: string, tagFilter: string, priorityFilter: string}) => void;
}

const SlimFacilityHeader: React.FC<SlimFacilityHeaderProps> = ({
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
  onInviteMember,
  assigneeFilter = 'all',
  setAssigneeFilter,
  tagFilter = 'all',
  setTagFilter,
  priorityFilter = 'all',
  setPriorityFilter,
  availableAssignees = [],
  availableTags = [],
  projects = [],
  selectedProjectId,
  onProjectSelect,
  onApplyFilters,
}) => {
  const { memberRefreshTriggers } = useFacilityRefresh();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [members, setMembers] = useState<FacilityMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [facilityTags, setFacilityTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [facilityStats, setFacilityStats] = useState({
    openTaskCount: 0,
    completionPercentage: 0,
    nearestDueDate: null as string | null
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);

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

  // Fetch facility tags
  useEffect(() => {
    const fetchFacilityTags = async () => {
      if (!facility?.id) return;
      setIsLoadingTags(true);
      try {
        const tagsData = await facilityService.getFacilityTags(facility.id);
        setFacilityTags(tagsData);
      } catch (error) {
        console.error('Failed to fetch facility tags:', error);
        setFacilityTags([]);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchFacilityTags();
  }, [facility?.id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown')) {
        setIsAssigneeDropdownOpen(false);
        setIsPriorityDropdownOpen(false);
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = filter !== 'all' || assigneeFilter !== 'all' || tagFilter !== 'all' || priorityFilter !== 'all';

  return (
    <>
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`} style={{ margin: 0, padding: 0, width: '100%' }}>
        {/* Main Header Row */}
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Project Name + Quick Stats */}
          <div className="flex items-center space-x-4">
            <BreadcrumbDropdown
              currentProject={selectedProjectId ? 
                projects.find(project => project.id === selectedProjectId)?.title || facility.name 
                : facility.name
              }
              projects={projects}
              onProjectSelect={onProjectSelect || (() => {})}
              isDarkMode={isDarkMode}
            />
            
            {/* Compact Progress Pill */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {completionPercentage}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {facilityStats.openTaskCount} open
                </span>
              </div>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <LucideSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search tasks and projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border-0 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:shadow-md focus:ring-2 focus:ring-brand focus:shadow-lg focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">

            {/* Saved Views Button */}
            <button
              onClick={() => setIsSavedViewsOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <LucideBookmark className="w-3 h-3" />
              <span>Views</span>
            </button>

            {/* Filters Toggle */}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                hasActiveFilters
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <LucideFilter className="w-3 h-3" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 text-xs px-1.5 py-0.5 bg-white/20 rounded-full">
                  {[filter, assigneeFilter, tagFilter, priorityFilter].filter(f => f !== 'all').length}
                </span>
              )}
            </button>


            {/* Share Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm font-medium"
            >
              <LucideShare2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filters Row */}
        {isFiltersOpen && (
          <div className={`px-6 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center space-x-4">
              {/* Quick Filter Chips */}
              <div className="flex items-center space-x-1">
                {['all', 'active', 'completed', 'with-tasks', 'empty'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      filter === filterOption
                        ? 'bg-brand text-white shadow-md font-semibold'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filterOption === 'all' ? 'All' : 
                     filterOption === 'active' ? 'Active' :
                     filterOption === 'completed' ? 'Completed' :
                     filterOption === 'with-tasks' ? 'With tasks' : 'Empty'}
                  </button>
                ))}
              </div>
              
              {/* Basic Filter Dropdowns */}
              <div className="flex items-center space-x-1">
                {/* Assignee Filter */}
                <div className="relative filter-dropdown">
                  <button
                    onClick={() => {
                      setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                      setIsPriorityDropdownOpen(false);
                      setIsTagDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      assigneeFilter !== 'all'
                        ? 'bg-brand text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {assigneeFilter !== 'all' ? (
                      (() => {
                        const selectedAssignee = availableAssignees.find(a => a.name === assigneeFilter);
                        return selectedAssignee?.profilePicture ? (
                          <img
                            src={selectedAssignee.profilePicture}
                            alt={selectedAssignee.name}
                            className="w-3 h-3 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-3 h-3 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ backgroundColor: '#6B7280' }}
                          >
                            {selectedAssignee?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        );
                      })()
                    ) : (
                      <LucideUser className="w-3 h-3" />
                    )}
                    <span>{assigneeFilter !== 'all' ? assigneeFilter : 'Assignee'}</span>
                    <LucideChevronDown className="w-3 h-3" />
                  </button>
                  {isAssigneeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setAssigneeFilter?.('all');
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            assigneeFilter === 'all' ? 'bg-brand text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          All Assignees
                        </button>
                        {availableAssignees.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            No facility members found
                          </div>
                        ) : (
                          availableAssignees.map((assignee) => (
                          <button
                            key={assignee.id}
                            onClick={() => {
                              setAssigneeFilter?.(assignee.name);
                              setIsAssigneeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              assigneeFilter === assignee.name ? 'bg-brand text-white' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {assignee.profilePicture ? (
                                <img
                                  src={assignee.profilePicture}
                                  alt={assignee.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                  style={{ backgroundColor: '#6B7280' }}
                                >
                                  {assignee.name?.charAt?.(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                              <span>{assignee.name}</span>
                            </div>
                          </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Priority Filter */}
                <div className="relative filter-dropdown">
                  <button
                    onClick={() => {
                      setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
                      setIsAssigneeDropdownOpen(false);
                      setIsTagDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      priorityFilter !== 'all'
                        ? 'bg-brand text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <LucideFlag className="w-3 h-3" />
                    <span>Priority</span>
                    <LucideChevronDown className="w-3 h-3" />
                  </button>
                  {isPriorityDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        {['all', 'high', 'medium', 'low'].map((priority) => (
                          <button
                            key={priority}
                            onClick={() => {
                              setPriorityFilter?.(priority);
                              setIsPriorityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              priorityFilter === priority ? 'bg-brand text-white' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tag Filter */}
                <div className="relative filter-dropdown">
                  <button
                    onClick={() => {
                      setIsTagDropdownOpen(!isTagDropdownOpen);
                      setIsAssigneeDropdownOpen(false);
                      setIsPriorityDropdownOpen(false);
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      tagFilter !== 'all'
                        ? 'bg-brand text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <LucideTag className="w-3 h-3" />
                    <span>Tags</span>
                    <LucideChevronDown className="w-3 h-3" />
                  </button>
                  {isTagDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setTagFilter?.('all');
                            setIsTagDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            tagFilter === 'all' ? 'bg-brand text-white' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          All Tags
                        </button>
                        {isLoadingTags ? (
                          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                            Loading tags...
                          </div>
                        ) : (
                          facilityTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setTagFilter?.(tag);
                                setIsTagDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                tagFilter === tag ? 'bg-brand text-white' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-brand"></div>
                                <span>{tag}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilter('all');
                    setAssigneeFilter?.('all');
                    setTagFilter?.('all');
                    setPriorityFilter?.('all');
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <LucideX className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareFacilityModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        facilityId={facility.id}
        isDarkMode={isDarkMode}
      />

      {/* Saved Filter Views Modal */}
      <SavedFilterViews
        isOpen={isSavedViewsOpen}
        onClose={() => setIsSavedViewsOpen(false)}
        isDarkMode={isDarkMode}
        currentFilters={{
          searchTerm,
          filter,
          assigneeFilter,
          tagFilter,
          priorityFilter,
        }}
        onApplyFilters={onApplyFilters || (() => {})}
        onSaveCurrentFilters={(name) => {
          // This would be handled by the parent component
          console.log('Save current filters as:', name);
        }}
      />

    </>
  );
};

export default SlimFacilityHeader;
