import React, { useState, MouseEvent, KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LucideTrash2,
  LucideUser,
  LucideCalendar,
  LucideFlag,
  LucideCheckCircle,
  LucideClock,
  LucidePlayCircle,
  LucideAlertCircle,
  LucideMoreHorizontal,
  LucideEdit3,
  LucideEye,
  LucideArchive,
  LucideCopy,
} from 'lucide-react';
import { Card, Button } from '../../../components/ui';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  columnId: string;
  isDarkMode: boolean;
  handleDeleteTask: (taskId: string, taskTitle: string, columnId: string) => void;
  handleOpenTaskDetail: (taskId: string) => void;
  isDeleting?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  columnId,
  isDarkMode,
  handleDeleteTask,
  handleOpenTaskDetail,
  isDeleting = false,
}) => {
  const [dragStarted, setDragStarted] = useState(false);
  const [justDragged, setJustDragged] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const {
    attributes,
    listeners: defaultListeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const listeners = {
    ...defaultListeners,
    onPointerDown: (event: any) => {
      setDragStarted(true);
      setJustDragged(false);
      if (typeof (defaultListeners as any).onPointerDown === 'function') {
        (defaultListeners as any).onPointerDown(event);
      }
    },
    onPointerUp: (event: any) => {
      setDragStarted(false);
      setJustDragged(true);
      setTimeout(() => setJustDragged(false), 100);
      if (typeof (defaultListeners as any).onPointerUp === 'function') {
        (defaultListeners as any).onPointerUp(event);
      }
    },
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Event Handlers
  const handleTaskClick = (e: MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('input') ||
      (e.target as HTMLElement).closest('a') ||
      isDragging ||
      justDragged
    ) {
      return;
    }
    handleOpenTaskDetail(task.id);
  };

  const handleHeaderKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenTaskDetail(task.id);
    }
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    handleDeleteTask(task.id, task.title, columnId);
  };

  const openDetails = (e: MouseEvent) => {
    e.stopPropagation();
    handleOpenTaskDetail(task.id);
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <LucideClock className="w-3 h-3" />;
      case 'in-progress':
        return <LucidePlayCircle className="w-3 h-3" />;
      case 'review':
        return <LucideAlertCircle className="w-3 h-3" />;
      case 'done':
        return <LucideCheckCircle className="w-3 h-3" />;
      default:
        return <LucideClock className="w-3 h-3" />;
    }
  };

  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'review':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300 dark:border-l-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'todo':
        return 'To Do';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDueDate = (dueDate: string) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return 'Due today';
    return `${days}d due`;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="listitem"
      aria-label={`Task card: ${task.title}`}
      onClick={handleTaskClick}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
      className={`
        group cursor-pointer transition-all duration-300 ease-out
        border-l-4 ${getPriorityColor()}
        ${isDragging ? 'opacity-60 rotate-2 scale-105 shadow-2xl' : ''}
        ${isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:shadow-lg hover:shadow-gray-900/20' 
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-900/10'
        }
        hover:-translate-y-1
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        rounded-lg shadow-sm p-0 overflow-hidden
      `}
    >
      {/* Card Content */}
      <div className="p-3">
        {/* Header with Status and Quick Actions */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColorClasses(task.status)}`}
              aria-label={`Status: ${getStatusText(task.status)}`}
            >
              {getStatusIcon(task.status)}
              {getStatusText(task.status)}
            </span>

          </div>
          
          {/* Quick Actions - Show on hover */}
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${showQuickActions ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              onClick={openDetails}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="View details"
            >
              <LucideEye className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDeleteClick}
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600"
              aria-label="Delete task"
            >
              <LucideTrash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Task Title */}
        <h4
          className={`font-semibold text-sm leading-snug mb-1.5 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors truncate ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
          tabIndex={0}
          onKeyDown={handleHeaderKeyDown}
          aria-label={`Task title: ${task.title}`}
          role="heading"
          aria-level={4}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p 
            className={`text-xs mb-2 leading-snug line-clamp-2 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
            aria-label="Task description"
          >
            {task.description}
          </p>
        )}

        {/* Footer - Assignee and Task ID */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {task.assignee ? (
              <>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                  isDarkMode ? 'bg-brand text-white' : 'bg-brand text-white'
                }`}>
                  {task.assignee.charAt(0).toUpperCase()}
                </div>
                <span 
                  className={`text-xs font-medium truncate max-w-[80px] ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  aria-label={`Assignee: ${task.assignee}`}
                >
                  {task.assignee}
                </span>
              </>
            ) : (
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Unassigned
              </span>
            )}
          </div>

          {/* Due Date */}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded ${
                isOverdue(task.dueDate)
                  ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : getDaysUntilDue(task.dueDate) <= 3
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                  : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              aria-label={`Due date: ${formatDueDate(task.dueDate)}`}
            >
              <LucideCalendar className="w-3 h-3" />
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

    </Card>
  );
};

export default TaskCard;
