import React, { useState, MouseEvent, KeyboardEvent, useEffect, useRef } from 'react';
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
  LucidePin,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, Button } from '../../../components/ui';
import { Task } from '../types';
import { taskService } from '../../../api/taskService';
import { facilityService } from '../../../api/facilityService';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';
import { cacheService } from '../../../services/cacheService';
import { RoleGuard } from '../../../components/RoleGuard';

interface TaskCardProps {
  task: Task;
  columnId: string;
  isDarkMode: boolean;
  handleDeleteTask: (taskId: string, taskTitle: string, columnId: string) => void;
  handleOpenTaskDetail: (taskId: string) => void;
  isDeleting?: boolean;
  onTaskMove?: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  facilityId?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  columnId,
  isDarkMode,
  handleDeleteTask,
  handleOpenTaskDetail,
  isDeleting = false,
  onTaskMove,
  facilityId,
}) => {
  const { memberRefreshTriggers, userProfileRefreshTrigger } = useFacilityRefresh();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [facilityMembers, setFacilityMembers] = useState<Record<string, {name: string; profilePicture?: string}>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Drag and drop functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDndDragging,
  } = useDraggable({
    id: `task-${currentTask.id}`,
    data: {
      type: 'task',
      task: currentTask,
      columnId: columnId,
    },
  });

  // Create modified listeners that exclude button areas and prevent dragging pinned tasks
  const modifiedListeners = {
    ...listeners,
    onPointerDown: (e: any) => {
      // Don't start drag if clicking on buttons
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.tagName === 'BUTTON') {
        return;
      }
      // Don't start drag if task is pinned
      if ((currentTask as any).pinned) {
        return;
      }
      if (listeners?.onPointerDown) {
        listeners.onPointerDown(e);
      }
    },
  };

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  // Update current task when prop changes (real-time updates)
  useEffect(() => {
    // Only update currentTask if the task prop is actually different
    // This prevents the prop from overriding real-time updates
    setCurrentTask(prevTask => {
      // If the task IDs are different, always update
      if (prevTask.id !== task.id) {
        // console.log('TaskCard: Updating from prop - different task ID:', task.id, 'prev:', prevTask.id);
        return task;
      }
      
      if ((prevTask as any)._clientUpdatedAt) {
        const propUpdateTime = task.updatedAt ? new Date(task.updatedAt).getTime() : 0;
        const clientUpdateTime = (prevTask as any)._clientUpdatedAt;
        
        // Only update if the prop is significantly newer (more than 1 second difference)
        if (propUpdateTime > clientUpdateTime + 1000) {
          // console.log('TaskCard: Updating from prop - prop is significantly newer');
          return task;
        } else {
          // console.log('TaskCard: Keeping real-time update, prop not significantly newer');
          return prevTask;
        }
      }
      
      // If the task has been updated (newer updatedAt), update it
      if (task.updatedAt && prevTask.updatedAt && 
          new Date(task.updatedAt).getTime() > new Date(prevTask.updatedAt).getTime()) {
        // console.log('TaskCard: Updating from prop - newer updatedAt');
        return task;
      }
      
      return prevTask; // Keep the current task if it's newer or the same
    });
  }, [task]);

  // Listen for task updates from TaskDetailModal
  useEffect(() => {
    const handleTaskUpdated = (event: CustomEvent) => {
      const updatedTask = event.detail;
      // console.log('TaskCard: Received taskUpdated event for task:', updatedTask.id, 'current task:', task.id);
      // console.log('TaskCard: Updated task data:', updatedTask);
      
      // If this is the task we're displaying, update it immediately
      if (updatedTask.id === task.id) {
        // console.log('TaskCard: Updating task card for task:', task.id, 'with data:', updatedTask);
        // console.log('TaskCard: AssigneeIds in updated task:', updatedTask.assigneeIds);
        setIsUpdating(true);
        
        // Update the current task with the new data
        setCurrentTask(prevTask => {
          const newTask = {
            ...prevTask,
            ...updatedTask,
            _clientUpdatedAt: Date.now() // Add a client-side timestamp to mark this as a real-time update
          };
          // console.log('TaskCard: Setting new task data:', newTask);
          // console.log('TaskCard: New assigneeIds:', newTask.assigneeIds);
          // console.log('TaskCard: New assignees:', newTask.assignees);
          return newTask;
        });
        
        // Reset updating state after a short delay
        setTimeout(() => {
          setIsUpdating(false);
        }, 300);
      }
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      
      // If this task was deleted, we don't need to do anything here
      // The parent component will handle removing it from the UI
      if (taskId === task.id) {
        // Task will be removed by parent component
      }
    };

    window.addEventListener('taskUpdated', handleTaskUpdated as unknown as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeleted as unknown as EventListener);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated as unknown as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeleted as unknown as EventListener);
    };
  }, [task.id]); // Use task.id to avoid re-registering on every currentTask change

  // Fetch facility members when task changes or facility members are refreshed
  useEffect(() => {
    const fetchFacilityMembers = async () => {
      if (!facilityId) return;
      
      setLoadingProfiles(true);
      try {
        const members = await facilityService.getFacilityMembers(facilityId);
        
        // Convert members array to a lookup object
        const membersLookup: Record<string, {name: string; profilePicture?: string}> = {};
        members.forEach(member => {
          membersLookup[member.id] = {
            name: member.name,
            profilePicture: member.profilePicture
          };
        });
        
        setFacilityMembers(membersLookup);
      } catch (error) {
        console.error('Failed to fetch facility members:', error);
        setFacilityMembers({});
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchFacilityMembers();
  }, [facilityId, memberRefreshTriggers[facilityId || '']]);


  // Improved click handler with better event detection
  const handleTaskClick = (e: MouseEvent<HTMLDivElement>) => {
    // Check if click originated from interactive elements or buttons
    const target = e.target as HTMLElement;
    
    // Check if the click is on a button or within a button
    if (target.closest('button') || target.tagName === 'BUTTON') {
      return;
    }
    
    // Check if click originated from other interactive elements
    const interactiveElements = [
      'input', 'textarea', 'select', 'a', 
      '[role="button"]', '[contenteditable="true"]'
    ];
    
    const isInteractiveElement = interactiveElements.some(selector => 
      target.closest(selector)
    );

    if (isInteractiveElement) {
      return;
    }

    handleOpenTaskDetail(currentTask.id);
  };

  const handleHeaderKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleOpenTaskDetail(currentTask.id);
    }
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleDeleteTask(currentTask.id, currentTask.title, columnId);
  };

  const openDetails = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleOpenTaskDetail(currentTask.id);
  };

  const handleMouseEnter = () => {
    setShowQuickActions(true);
  };

  const handleMouseLeave = () => {
    setShowQuickActions(false);
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
    // Remove priority border colors
    return '';
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
      ref={(node) => {
        if (node) {
          (cardRef as any).current = node;
          setNodeRef(node);
        }
      }}
      aria-label={`Task: ${currentTask.title}. Status: ${getStatusText(currentTask.status)}. Click to view details.`}
      onClick={handleTaskClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenTaskDetail(currentTask.id);
        }
      }}
      style={style}
      {...attributes}
      {...modifiedListeners}
        className={`
          group task-card drag-transition
          ${(currentTask as any).pinned ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
          ${isUpdating ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
          ${isDndDragging ? 'task-card-dragging' : ''}
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700 hover:bg-gray-750 hover:shadow-lg' 
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-lg'
          }
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
          rounded-lg shadow-sm p-0 overflow-hidden
          mb-2
        `}
    >
      {/* Card Content */}
      <div className="p-3">
        {/* Header with Status and Quick Actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Pin indicator */}
            {(currentTask as any).pinned && (
              <div className="flex items-center">
                <LucidePin className="w-3 h-3 text-green-600 dark:text-green-400 fill-current" />
              </div>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColorClasses(currentTask.status)}`}
              aria-label={`Status: ${getStatusText(currentTask.status)}`}
            >
              {getStatusIcon(currentTask.status)}
              {getStatusText(currentTask.status)}
            </span>
          </div>
          
          {/* Quick Actions - Show on hover and when not dragging */}
          <div className={`flex items-center gap-1 transition-all duration-200 ${
            showQuickActions ? 'opacity-100' : 'opacity-0'
          }`}>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        openDetails(e);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400"
                      aria-label={`View details for task: ${currentTask.title}`}
                      draggable={false}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onDragStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrag={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDragEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <LucideEye className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </Button>
            <RoleGuard requiredPermission="tasks.delete" facilityId={facilityId}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDeleteClick(e);
                }}
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                aria-label={`Delete task: ${currentTask.title}`}
                draggable={false}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onDragStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrag={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <LucideTrash2 className="w-4 h-4" />
            </Button>
            </RoleGuard>
          </div>
        </div>

        {/* Task Title */}
        <h4
          className={`font-semibold text-sm leading-tight mb-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
          tabIndex={-1} // Remove from tab sequence since card is focusable
          onKeyDown={handleHeaderKeyDown}
          role="heading"
          aria-level={4}
        >
          {currentTask.title}
        </h4>

        {/* Footer: Assignee (Left) and Due Date (Right) */}
        <div className="flex items-center justify-between">
          {/* Assignee Profiles - Left Side (Overlapping) */}
          <div className="flex items-center">
            {(() => {
              const taskAny = currentTask as any;
              const assigneeIds = taskAny.assignees || taskAny.assigneeIds || [];
              const hasAssignees = assigneeIds.length > 0;
              
              if (!hasAssignees) {
                return (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isDarkMode 
                      ? 'text-gray-400 bg-gray-700/50' 
                      : 'text-gray-500 bg-gray-100'
                  }`}>
                    No assignee
                  </span>
                );
              }
              
              if (loadingProfiles) {
                return (
                  <div className="flex items-center">
                    {assigneeIds.slice(0, 5).map((_, index) => (
                      <div 
                        key={index} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center animate-pulse border-2 border-white dark:border-gray-800 ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                        }`}
                        style={{ 
                          marginLeft: index > 0 ? '-8px' : '0',
                          zIndex: 5 - index 
                        }}
                      >
                        <LucideUser className="w-3 h-3" />
                      </div>
                    ))}
                    {assigneeIds.length > 5 && (
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800 ${
                          isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600'
                        }`}
                        style={{ 
                          marginLeft: '-8px',
                          zIndex: 0 
                        }}
                      >
                        +{assigneeIds.length - 5}
                      </div>
                    )}
                  </div>
                );
              }
              
              // Display up to 5 assignees with overlapping
              const maxVisible = 5;
              const visibleAssignees = assigneeIds.slice(0, maxVisible);
              const remainingCount = assigneeIds.length - maxVisible;
              
              return (
                <div className="flex items-center">
                  {visibleAssignees.map((assigneeId, index) => {
                    // Handle both string IDs and object assignees
                    const id = typeof assigneeId === 'string' ? assigneeId : assigneeId.id;
                    const member = facilityMembers[id];
                    const fullName = member ? member.name : 'Unknown User';
                    const initials = member ? member.name.charAt(0).toUpperCase() : '?';
                    
                    return (
                      <div 
                        key={`${id}-${index}`}
                        className="w-6 h-6 rounded-full overflow-hidden bg-brand text-white flex items-center justify-center text-xs font-medium cursor-pointer border-2 border-white dark:border-gray-800"
                        title={fullName}
                        aria-label={`Assigned to: ${fullName}`}
                        style={{ 
                          marginLeft: index > 0 ? '-8px' : '0',
                          zIndex: maxVisible - index 
                        }}
                      >
                        {member?.profilePicture ? (
                          <img
                            src={member.profilePicture}
                            alt={fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                    );
                  })}
                  
                  {remainingCount > 0 && (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-500 text-white border-2 border-white dark:border-gray-800"
                      title={`${remainingCount} more assignees`}
                      aria-label={`${remainingCount} more assignees`}
                      style={{ 
                        marginLeft: '-8px',
                        zIndex: 0 
                      }}
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Due Date - Right Side */}
          <div className="flex items-center">
            {(currentTask as any).dueDate && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                  isOverdue((currentTask as any).dueDate)
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    : getDaysUntilDue((currentTask as any).dueDate) <= 3
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                    : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
                aria-label={`Due date: ${formatDueDate((currentTask as any).dueDate)}`}
              >
                <LucideCalendar className="w-3 h-3" />
                {formatDueDate((currentTask as any).dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;