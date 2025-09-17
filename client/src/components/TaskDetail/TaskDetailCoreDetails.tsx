import React from 'react';
import { 
  LucideUser, 
  LucideCalendar, 
  LucideFlag, 
  LucideTrendingUp, 
  LucideClock, 
  LucideCheckCircle, 
  LucideTag,
  LucideEdit3,
  LucideAlertTriangle
} from 'lucide-react';
import { Task } from '../../api/taskService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface TaskDetailCoreDetailsProps {
  task: Task;
  isDarkMode: boolean;
  isEditing?: boolean;
  editedTask?: Partial<Task>;
  onFieldChange?: (field: keyof Task, value: any) => void;
  onSave?: () => void;
  onCancel?: () => void;
}

const TaskDetailCoreDetails: React.FC<TaskDetailCoreDetailsProps> = ({ task, isDarkMode, isEditing = false, editedTask = {}, onFieldChange, onSave, onCancel }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'urgent':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <LucideAlertTriangle className="w-3 h-3" />;
      default:
        return <LucideFlag className="w-3 h-3" />;
    }
  };

  const handleInputChange = (field: keyof Task, value: any) => {
    if (onFieldChange) {
      onFieldChange(field, value);
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString?: any, includeTime = false) => {
    if (!dateString) return '';
    let date: Date;
    if (dateString.toDate && typeof dateString.toDate === 'function') {
      // Handle Firestore Timestamp object
      date = dateString.toDate();
    } else if (typeof dateString === 'string' || dateString instanceof Date) {
      date = new Date(dateString);
    } else {
      return '';
    }
    if (isNaN(date.getTime())) return '';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.second = '2-digit';
    }
    return date.toLocaleDateString('en-US', options);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Description Card */}
      <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Description
          </h3>
          {isEditing ? (
            <></> // Could add save/cancel buttons here if needed
          ) : (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <LucideEdit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
        <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {task.description || 'No description provided.'}
        </p>
      </Card>

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Assignee */}
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <LucideUser className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Assignee
              </p>
              <div className="flex items-center gap-2 mt-1">
                {task.assignee ? (
                  <>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isDarkMode ? 'bg-brand text-white' : 'bg-brand text-white'
                    }`}>
                      {task.assignee.charAt(0).toUpperCase()}
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        className={`text-sm font-medium truncate ${isDarkMode ? 'text-white bg-gray-800' : 'text-gray-900 bg-white'} rounded px-2 py-1 border border-gray-300`}
                        value={editedTask.assignee ?? task.assignee}
                        onChange={(e) => handleInputChange('assignee', e.target.value)}
                      />
                    ) : (
                      <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {task.assignee}
                      </span>
                    )}
                  </>
                ) : (
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Due Date */}
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              task.dueDate && isOverdue(task.dueDate) 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <LucideCalendar className={`w-4 h-4 ${
                task.dueDate && isOverdue(task.dueDate)
                  ? 'text-red-600 dark:text-red-400'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Due Date
              </p>
              {isEditing ? (
                <input
                  type="date"
                  className={`text-sm font-medium mt-1 rounded px-2 py-1 border border-gray-300 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  value={editedTask.dueDate ? editedTask.dueDate.substring(0, 10) : (task.dueDate ? task.dueDate.substring(0, 10) : '')}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              ) : (
                <p className={`text-sm font-medium mt-1 ${
                  task.dueDate && isOverdue(task.dueDate)
                    ? 'text-red-600 dark:text-red-400'
                    : isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {task.dueDate ? (
                    <>
                      {formatDate(task.dueDate)}
                      {isOverdue(task.dueDate) && (
                        <span className="ml-1 text-xs">(Overdue)</span>
                      )}
                    </>
                  ) : (
                    'No due date'
                  )}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Priority */}
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {getPriorityIcon(task.priority)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Priority
              </p>
              <div className="mt-1">
                {isEditing ? (
                  <select
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(editedTask.priority || task.priority)}`}
                    value={editedTask.priority || task.priority || 'medium'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                    {getPriorityIcon(task.priority)}
                    {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Progress */}
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <LucideTrendingUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Progress
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(editedTask.progress ?? task.progress ?? 0)}`}
                    style={{ width: `${editedTask.progress ?? task.progress ?? 0}%` }}
                  />
                </div>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className={`w-16 text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded px-2 py-1 border border-gray-300`}
                    value={editedTask.progress ?? task.progress ?? 0}
                    onChange={(e) => {
                      let val = parseInt(e.target.value, 10);
                      if (isNaN(val)) val = 0;
                      if (val < 0) val = 0;
                      if (val > 100) val = 100;
                      handleInputChange('progress', val);
                    }}
                  />
                ) : (
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {task.progress || 0}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Created Date */}
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <LucideClock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Created
              </p>
                <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatDate(task.createdAt, true)}
                </p>
            </div>
          </div>
        </Card>

        {/* Last Updated */}
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <LucideCheckCircle className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Last Updated
              </p>
              <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatDate(task.updatedAt, true)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tags Section */}
      {task.tags && task.tags.length > 0 && (
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <LucideTag className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 border border-gray-600'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Actions */}
      {isEditing && (
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={onCancel}
            className={isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default TaskDetailCoreDetails;
