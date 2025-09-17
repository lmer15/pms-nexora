import React, { useState } from 'react';
import { LucideActivity, LucideUser, LucideEdit, LucideCheckCircle, LucideXCircle, LucideMessageSquare, LucidePaperclip, LucideFilter, LucideCalendar } from 'lucide-react';
import { TaskActivityLog } from '../../api/taskService';
import { Button } from '../ui/button';

interface TaskDetailActivityLogsProps {
  activityLogs: TaskActivityLog[];
  isDarkMode: boolean;
}

const TaskDetailActivityLogs: React.FC<TaskDetailActivityLogsProps> = ({ activityLogs, isDarkMode }) => {
  const [filter, setFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getActivityIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return <LucideCheckCircle className="w-4 h-4 text-green-500" />;
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
      return <LucideEdit className="w-4 h-4 text-blue-500" />;
    } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return <LucideXCircle className="w-4 h-4 text-red-500" />;
    } else if (actionLower.includes('comment')) {
      return <LucideMessageSquare className="w-4 h-4 text-purple-500" />;
    } else if (actionLower.includes('attach')) {
      return <LucidePaperclip className="w-4 h-4 text-orange-500" />;
    } else {
      return <LucideActivity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
    } else if (actionLower.includes('comment')) {
      return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
    } else if (actionLower.includes('attach')) {
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
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
    return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
  };

  const filteredLogs = activityLogs.filter(log => {
    if (filter === 'all') return true;
    return log.action.toLowerCase().includes(filter);
  });

  const filterOptions = [
    { value: 'all', label: 'All Activity', count: activityLogs.length },
    { value: 'create', label: 'Created', count: activityLogs.filter(log => log.action.toLowerCase().includes('create')).length },
    { value: 'update', label: 'Updated', count: activityLogs.filter(log => log.action.toLowerCase().includes('update')).length },
    { value: 'comment', label: 'Comments', count: activityLogs.filter(log => log.action.toLowerCase().includes('comment')).length },
    { value: 'attach', label: 'Attachments', count: activityLogs.filter(log => log.action.toLowerCase().includes('attach')).length },
  ];

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
        {activityLogs.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <LucideFilter className="w-3 h-3" />
            Filter
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && activityLogs.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
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
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideActivity className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {filter === 'all' ? 'No activity recorded yet.' : `No ${filter} activity found.`}
            </p>
          </div>
        ) : (
          filteredLogs.map((activityLog, index) => (
            <div
              key={activityLog.id}
              className={`relative border-l-4 p-3 rounded-lg transition-all hover:shadow-sm ${
                getActivityColor(activityLog.action)
              } ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activityLog.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      <LucideUser className="w-3 h-3" />
                    </div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {activityLog.userId}
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {getActionText(activityLog.action)}
                    </span>
                  </div>
                  {activityLog.details && (
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {activityLog.details}
                    </p>
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
              {index < filteredLogs.length - 1 && (
                <div className={`absolute left-6 top-12 w-px h-6 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskDetailActivityLogs;
