import React, { useState } from 'react';
import {
  LucideX,
  LucideCheckCircle,
  LucideClock,
  LucideAlertCircle,
  LucidePlayCircle,
  LucideEdit3,
  LucideShare2,
  LucidePin,
  LucideMoreHorizontal,
  LucideCheck,
  LucideX as LucideCancel,
  LucideChevronDown,
  LucideCopy,
  LucideTrash2,
  LucideArchive,
  LucideMove,
  LucideGitMerge
} from 'lucide-react';
import { Task } from '../../api/taskService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface TaskDetailHeaderProps {
  task: Task;
  onClose: () => void;
  isDarkMode: boolean;
  editedTask?: Partial<Task>;
  onFieldChange?: (field: keyof Task, value: any) => void;
  onSaveTitle?: (title: string) => void;
  onStatusChange?: (status: Task['status']) => void;
}

const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({ task, onClose, isDarkMode, editedTask = {}, onFieldChange, onSaveTitle, onStatusChange }) => {
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  const handleTitleClick = () => {
    setIsTitleEditing(true);
    setTempTitle(editedTask.title ?? task.title);
  };

  const handleTitleSave = () => {
    if (tempTitle.trim() === '') {
      alert('Task title cannot be empty');
      return;
    }
    if (onSaveTitle) {
      onSaveTitle(tempTitle);
    } else if (onFieldChange) {
      onFieldChange('title', tempTitle);
    }
    setIsTitleEditing(false);
  };

  const handleTitleCancel = () => {
    setTempTitle('');
    setIsTitleEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <LucideClock className="w-4 h-4" />;
      case 'in-progress':
        return <LucidePlayCircle className="w-4 h-4" />;
      case 'review':
        return <LucideAlertCircle className="w-4 h-4" />;
      case 'done':
        return <LucideCheckCircle className="w-4 h-4" />;
      default:
        return <LucideClock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'review':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      case 'done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const formatStatusText = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'todo':
        return 'To Do';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const handleStatusClick = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
  };

  const handleStatusSelect = (status: string) => {
    if (onStatusChange) {
      onStatusChange(status as Task['status']);
    }
    setIsStatusDropdownOpen(false);
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div className={`sticky top-0 z-40 px-6 py-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900/95 backdrop-blur' : 'border-gray-200 bg-white/95 backdrop-blur'}`}>
      {/* Top Row - Status, Title, and Close */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative">
            <button
              onClick={handleStatusClick}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border hover:opacity-80 transition-opacity ${getStatusColor(task.status)}`}
            >
              {getStatusIcon(task.status)}
              <span>{formatStatusText(task.status)}</span>
              <LucideChevronDown className="w-3 h-3" />
            </button>
            {isStatusDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 w-44 rounded-md shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                      task.status === option.value ? 'bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                  >
                    {getStatusIcon(option.value)}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {isTitleEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`text-xl font-bold ${isDarkMode ? 'bg-gray-800 text-white border-transparent' : 'bg-white text-gray-900 border-transparent'} flex-1 overflow-x-auto max-w-full`}
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleSave}
                className="h-8 w-8 p-0"
              >
                <LucideCheck className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleCancel}
                className="h-8 w-8 p-0"
              >
                <LucideCancel className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <h1
              className={`text-xl md:text-2xl font-bold truncate max-w-[calc(100%-8rem)] ${isDarkMode ? 'text-white' : 'text-gray-900'} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded`}
              onClick={handleTitleClick}
            >
              {editedTask.title ?? task.title}
            </h1>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              // Pin functionality
              alert('Pin feature coming soon!');
            }}
            aria-label="Pin task"
            title="Pin task"
          >
            <LucidePin className="w-4 h-4" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
              aria-label="More options"
              title="More options"
            >
              <LucideMoreHorizontal className="w-4 h-4" />
            </Button>
            {isMoreDropdownOpen && (
              <div className={`absolute top-full right-0 mt-1 w-48 rounded-md shadow-lg border z-50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => {
                    // Share functionality
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => {
                      alert('Task link copied to clipboard!');
                    });
                    setIsMoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}
                >
                  <LucideShare2 className="w-4 h-4" />
                  Share task
                </button>
                <button
                  onClick={() => {
                    // Duplicate functionality
                    alert('Duplicate feature coming soon!');
                    setIsMoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}
                >
                  <LucideCopy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    // Move functionality
                    alert('Move feature coming soon!');
                    setIsMoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}
                >
                  <LucideMove className="w-4 h-4" />
                  Move to project
                </button>
                <button
                  onClick={() => {
                    // Convert to subtask functionality
                    alert('Convert to subtask feature coming soon!');
                    setIsMoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}
                >
                  <LucideGitMerge className="w-4 h-4" />
                  Convert to subtask
                </button>
                <div className={`border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`} />
                <button
                  onClick={() => {
                    // Archive/Delete functionality
                    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                      alert('Delete feature would be implemented here!');
                    }
                    setIsMoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2`}
                >
                  <LucideTrash2 className="w-4 h-4" />
                  Delete task
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <LucideX className="w-4 h-4" />
          </Button>
        </div>
      </div>


    </div>
  );
};

export default TaskDetailHeader;
