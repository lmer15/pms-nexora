import React, { useState, useEffect } from 'react';
import { 
  LucideActivity, 
  LucideUser, 
  LucideEdit, 
  LucideCheckCircle, 
  LucideXCircle, 
  LucideMessageSquare, 
  LucidePaperclip, 
  LucideFilter, 
  LucideCalendar,
  LucideClock,
  LucideGitBranch,
  LucideCheckSquare,
  LucideUserPlus,
  LucideUserMinus,
  LucideSearch,
  LucideChevronDown,
  LucideChevronUp,
  LucideMoreHorizontal,
  LucideEye,
  LucideEyeOff
} from 'lucide-react';
import { TaskActivityLog, taskService } from '../../api/taskService';
import { Button } from '../ui/button';

interface TaskDetailActivityLogsProps {
  activityLogs: TaskActivityLog[];
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
}

const TaskDetailActivityLogs: React.FC<TaskDetailActivityLogsProps> = ({ 
  activityLogs, 
  isDarkMode, 
  onShowWarning 
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByDate, setGroupByDate] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Record<string, { firstName: string; lastName: string; profilePicture?: string }>>({});
  const [showMetadata, setShowMetadata] = useState<Set<string>>(new Set());

  // Fetch user profiles for activity log users
  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (activityLogs.length === 0) return;
      
      const userIds = [...new Set(activityLogs.map(log => log.userId))];
      try {
        const profiles = await taskService.fetchUserProfilesByIds(userIds);
        setUserProfiles(profiles);
      } catch (error) {
        console.error('Failed to fetch user profiles:', error);
      }
    };

    fetchUserProfiles();
  }, [activityLogs]);

  const getActivityIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    
    // Task activities
    if (actionLower.includes('task_created')) {
      return <LucideCheckCircle className="w-4 h-4 text-green-500" />;
    } else if (actionLower.includes('task_updated') || actionLower.includes('task_edited')) {
      return <LucideEdit className="w-4 h-4 text-blue-500" />;
    } else if (actionLower.includes('task_deleted')) {
      return <LucideXCircle className="w-4 h-4 text-red-500" />;
    } else if (actionLower.includes('status_changed')) {
      return <LucideCheckSquare className="w-4 h-4 text-indigo-500" />;
    }
    
    // Assignment activities
    else if (actionLower.includes('task_assigned') || actionLower.includes('assigned')) {
      return <LucideUserPlus className="w-4 h-4 text-green-500" />;
    } else if (actionLower.includes('task_unassigned') || actionLower.includes('unassigned')) {
      return <LucideUserMinus className="w-4 h-4 text-orange-500" />;
    }
    
    // Comment activities
    else if (actionLower.includes('comment_added') || actionLower.includes('comment_created')) {
      return <LucideMessageSquare className="w-4 h-4 text-purple-500" />;
    } else if (actionLower.includes('comment_updated') || actionLower.includes('comment_edited')) {
      return <LucideMessageSquare className="w-4 h-4 text-blue-500" />;
    } else if (actionLower.includes('comment_deleted')) {
      return <LucideMessageSquare className="w-4 h-4 text-red-500" />;
    }
    
    // Attachment activities
    else if (actionLower.includes('attachment_added') || actionLower.includes('attachment_uploaded')) {
      return <LucidePaperclip className="w-4 h-4 text-orange-500" />;
    } else if (actionLower.includes('attachment_deleted')) {
      return <LucidePaperclip className="w-4 h-4 text-red-500" />;
    }
    
    // Subtask activities
    else if (actionLower.includes('subtask_added') || actionLower.includes('subtask_created')) {
      return <LucideCheckSquare className="w-4 h-4 text-green-500" />;
    } else if (actionLower.includes('subtask_completed')) {
      return <LucideCheckCircle className="w-4 h-4 text-green-500" />;
    } else if (actionLower.includes('subtask_uncompleted')) {
      return <LucideCheckSquare className="w-4 h-4 text-yellow-500" />;
    } else if (actionLower.includes('subtask_deleted')) {
      return <LucideCheckSquare className="w-4 h-4 text-red-500" />;
    }
    
    // Dependency activities
    else if (actionLower.includes('dependency_added')) {
      return <LucideGitBranch className="w-4 h-4 text-blue-500" />;
    } else if (actionLower.includes('dependency_removed')) {
      return <LucideGitBranch className="w-4 h-4 text-red-500" />;
    }
    
    // Time tracking activities
    else if (actionLower.includes('time_tracking_started') || actionLower.includes('time_started')) {
      return <LucideClock className="w-4 h-4 text-green-500" />;
    } else if (actionLower.includes('time_tracking_stopped') || actionLower.includes('time_stopped')) {
      return <LucideClock className="w-4 h-4 text-orange-500" />;
    } else if (actionLower.includes('time_log_added') || actionLower.includes('time_logged')) {
      return <LucideClock className="w-4 h-4 text-blue-500" />;
    }
    
    // Generic fallbacks
    else if (actionLower.includes('create') || actionLower.includes('add')) {
      return <LucideCheckCircle className="w-4 h-4 text-green-500" />;
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <LucideEdit className="w-4 h-4 text-blue-500" />;
    } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return <LucideXCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <LucideActivity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    const actionLower = action.toLowerCase();
    
    // Task activities
    if (actionLower.includes('task_created')) {
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
    } else if (actionLower.includes('task_updated') || actionLower.includes('task_edited')) {
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    } else if (actionLower.includes('task_deleted')) {
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
    } else if (actionLower.includes('status_changed')) {
      return 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/10';
    }
    
    // Assignment activities
    else if (actionLower.includes('task_assigned') || actionLower.includes('assigned')) {
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
    } else if (actionLower.includes('task_unassigned') || actionLower.includes('unassigned')) {
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
    }
    
    // Comment activities
    else if (actionLower.includes('comment')) {
      return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
    }
    
    // Attachment activities
    else if (actionLower.includes('attachment')) {
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
    }
    
    // Subtask activities
    else if (actionLower.includes('subtask')) {
      return 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/10';
    }
    
    // Dependency activities
    else if (actionLower.includes('dependency')) {
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
    
    // Time tracking activities
    else if (actionLower.includes('time_tracking') || actionLower.includes('time_log')) {
      return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
    }
    
    // Generic fallbacks
    else if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
    } else {
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActionText = (action: string) => {
    // Convert action to human-readable text
    const actionLower = action.toLowerCase();
    
    if (actionLower.includes('task_created')) return 'Created task';
    else if (actionLower.includes('task_updated')) return 'Updated task';
    else if (actionLower.includes('task_deleted')) return 'Deleted task';
    else if (actionLower.includes('status_changed')) return 'Changed status';
    else if (actionLower.includes('task_assigned')) return 'Assigned task';
    else if (actionLower.includes('task_unassigned')) return 'Unassigned task';
    else if (actionLower.includes('comment_added')) return 'Added comment';
    else if (actionLower.includes('comment_updated')) return 'Updated comment';
    else if (actionLower.includes('comment_deleted')) return 'Deleted comment';
    else if (actionLower.includes('attachment_added')) return 'Added attachment';
    else if (actionLower.includes('attachment_deleted')) return 'Deleted attachment';
    else if (actionLower.includes('subtask_added')) return 'Added subtask';
    else if (actionLower.includes('subtask_completed')) return 'Completed subtask';
    else if (actionLower.includes('subtask_uncompleted')) return 'Uncompleted subtask';
    else if (actionLower.includes('subtask_deleted')) return 'Deleted subtask';
    else if (actionLower.includes('dependency_added')) return 'Added dependency';
    else if (actionLower.includes('dependency_removed')) return 'Removed dependency';
    else if (actionLower.includes('time_tracking_started')) return 'Started time tracking';
    else if (actionLower.includes('time_tracking_stopped')) return 'Stopped time tracking';
    else if (actionLower.includes('time_log_added')) return 'Added time log';
    else {
      return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase().replace(/_/g, ' ');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const groupActivitiesByDate = (activities: TaskActivityLog[]) => {
    const groups: Record<string, TaskActivityLog[]> = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    // Sort activities within each group by timestamp (newest first)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    
    return groups;
  };

  const toggleGroupExpansion = (date: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleMetadata = (activityId: string) => {
    const newShowMetadata = new Set(showMetadata);
    if (newShowMetadata.has(activityId)) {
      newShowMetadata.delete(activityId);
    } else {
      newShowMetadata.add(activityId);
    }
    setShowMetadata(newShowMetadata);
  };

  const filteredLogs = activityLogs.filter(log => {
    // Apply filter
    let matchesFilter = true;
    if (filter !== 'all') {
      matchesFilter = log.action.toLowerCase().includes(filter);
    }
    
    // Apply search query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      matchesSearch = 
        log.action.toLowerCase().includes(query) ||
        (log.details ? log.details.toLowerCase().includes(query) : false) ||
        (log.userId ? log.userId.toLowerCase().includes(query) : false);
    }
    
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: 'All Activity', count: activityLogs.length },
    { value: 'task', label: 'Task', count: activityLogs.filter(log => log.action.toLowerCase().includes('task')).length },
    { value: 'comment', label: 'Comments', count: activityLogs.filter(log => log.action.toLowerCase().includes('comment')).length },
    { value: 'attachment', label: 'Attachments', count: activityLogs.filter(log => log.action.toLowerCase().includes('attachment')).length },
    { value: 'subtask', label: 'Subtasks', count: activityLogs.filter(log => log.action.toLowerCase().includes('subtask')).length },
    { value: 'dependency', label: 'Dependencies', count: activityLogs.filter(log => log.action.toLowerCase().includes('dependency')).length },
    { value: 'time', label: 'Time Tracking', count: activityLogs.filter(log => log.action.toLowerCase().includes('time')).length },
    { value: 'assign', label: 'Assignments', count: activityLogs.filter(log => log.action.toLowerCase().includes('assign')).length },
  ];

  const groupedLogs = groupByDate ? groupActivitiesByDate(filteredLogs) : { 'all': filteredLogs };
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => {
    if (a === 'all') return 1;
    if (b === 'all') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucideActivity className="w-4 h-4" />
          <span>Activity</span>
          {activityLogs.length > 0 && (
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {filteredLogs.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {activityLogs.length > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setGroupByDate(!groupByDate)}
                className="flex items-center gap-2"
              >
                <LucideCalendar className="w-3 h-3" />
                {groupByDate ? 'Ungroup' : 'Group by Date'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <LucideFilter className="w-3 h-3" />
                Filter
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && activityLogs.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <LucideSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          
          {/* Filter Options */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  filter === option.value
                    ? 'bg-brand text-white'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {option.label}
                {option.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    filter === option.value
                      ? 'bg-white/20 text-white'
                      : isDarkMode
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideActivity className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {filter === 'all' && !searchQuery ? 'No activity recorded yet.' : 'No activities found matching your criteria.'}
            </p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date} className="space-y-3">
              {/* Date Header (only show when grouping by date) */}
              {groupByDate && date !== 'all' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleGroupExpansion(date)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    {expandedGroups.has(date) ? (
                      <LucideChevronDown className="w-4 h-4" />
                    ) : (
                      <LucideChevronUp className="w-4 h-4" />
                    )}
                    <span>{formatDate(date)}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {groupedLogs[date].length}
                    </span>
                  </button>
                </div>
              )}
              
              {/* Activities for this date */}
              {(groupByDate ? expandedGroups.has(date) : true) && (
                <div className="space-y-3">
                  {groupedLogs[date].map((activityLog, index) => (
                    <div
                      key={activityLog.id}
                      className={`relative border-l-4 p-4 rounded-lg transition-all hover:shadow-sm ${
                        getActivityColor(activityLog.action)
                      } ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activityLog.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {userProfiles[activityLog.userId] ? (
                                <span>
                                  {userProfiles[activityLog.userId].firstName[0]}{userProfiles[activityLog.userId].lastName[0]}
                                </span>
                              ) : (
                                <LucideUser className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {userProfiles[activityLog.userId] 
                                    ? `${userProfiles[activityLog.userId].firstName} ${userProfiles[activityLog.userId].lastName}`
                                    : activityLog.userId
                                  }
                                </span>
                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {getActionText(activityLog.action)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMetadata(activityLog.id)}
                                className="p-1 h-6 w-6"
                              >
                                {showMetadata.has(activityLog.id) ? (
                                  <LucideEyeOff className="w-3 h-3" />
                                ) : (
                                  <LucideEye className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {activityLog.details && (
                            <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {activityLog.details}
                            </p>
                          )}
                          
                          {/* Metadata */}
                          {showMetadata.has(activityLog.id) && activityLog.metadata && (
                            <div className={`mb-2 p-2 rounded text-xs ${
                              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(activityLog.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs">
                            <LucideCalendar className={`w-3 h-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {formatTimeAgo(activityLog.timestamp)}
                            </span>
                            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {new Date(activityLog.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Timeline connector */}
                      {index < groupedLogs[date].length - 1 && (
                        <div className={`absolute left-6 top-16 w-px h-8 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskDetailActivityLogs;
