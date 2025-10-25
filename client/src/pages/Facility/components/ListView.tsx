import React, { useState, useMemo, useEffect } from 'react'; // React hooks
import { Column, Task } from '../types';
import { LucideChevronDown, LucideChevronRight, LucidePlus, LucideMoreHorizontal, LucideClock, LucideList, LucideEdit3, LucideArchive, LucideTrash2 } from 'lucide-react';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';
import { useAuth } from '../../../context/AuthContext';
import { taskService } from '../../../api/taskService';
import { facilityService } from '../../../api/facilityService';
import cacheService from '../../../services/cacheService';
import Tooltip from '../../../components/ui/Tooltip';
import TaskCreationModal from '../../../components/TaskCreationModal';
import { RoleGuard, usePermissions } from '../../../components/RoleGuard';

interface ListViewProps {
  columns: Column[];
  isDarkMode: boolean;
  facilityId?: string;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string, taskTitle: string, columnId: string) => void;
  onTaskMove: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  availableAssignees?: Array<{id: string, name: string, email?: string, profilePicture?: string}>;
}

interface FlattenedTask extends Task {
  projectId: string;
  projectName: string;
  level: number; // 0 for main tasks, 1+ for subtasks
  parentId?: string;
}

const ListView: React.FC<ListViewProps> = ({
  columns,
  isDarkMode,
  facilityId,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onTaskMove,
  availableAssignees,
}) => {
  const { memberRefreshTriggers, userProfileRefreshTrigger } = useFacilityRefresh();
  const { user } = useAuth();
  const { hasPermission } = usePermissions(facilityId);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [sortBy, setSortBy] = useState<keyof FlattenedTask>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'project' | 'status' | 'assignee' | 'priority' | 'none'>('project');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);
  const [facilityMembers, setFacilityMembers] = useState<Record<string, {name: string; profilePicture?: string}>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showGroupActions, setShowGroupActions] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [taskSubtasks, setTaskSubtasks] = useState<Record<string, any[]>>({});
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [subtaskProgress, setSubtaskProgress] = useState({ loaded: 0, total: 0 });
  const [loadedSubtasks, setLoadedSubtasks] = useState<Set<string>>(new Set());
  const [creatingTask, setCreatingTask] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    type: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
    type: 'info'
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showGroupActions) {
        const target = event.target as Element;
        // Don't close if clicking inside the dropdown or the ellipsis button
        if (!target.closest('[data-dropdown]') && !target.closest('[data-ellipsis]')) {
          setShowGroupActions(null);
        }
      }
    };

    if (showGroupActions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGroupActions]);

  // Sync local columns with props
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Fetch facility members for all tasks
  // Convert availableAssignees prop to facilityMembers lookup
  useEffect(() => {
    if (availableAssignees && availableAssignees.length > 0) {
      const membersLookup: Record<string, {name: string; profilePicture?: string}> = {};
      availableAssignees.forEach(member => {
        membersLookup[member.id] = {
          name: member.name,
          profilePicture: member.profilePicture
        };
      });
      setFacilityMembers(membersLookup);
      setLoadingProfiles(false);
    }
  }, [availableAssignees]);

  // Optimized batch subtask loading with request deduplication
  useEffect(() => {
    const fetchSubtasksBatch = async () => {
      if (localColumns.length === 0) return;
      
      // Collect all unique task IDs that haven't been loaded yet
      const allTaskIds = new Set<string>();
      localColumns.forEach(column => {
        column.tasks.forEach(task => {
          if (!loadedSubtasks.has(task.id)) {
            allTaskIds.add(task.id);
          }
        });
      });
      
      const taskIds = Array.from(allTaskIds);
      if (taskIds.length === 0) return;
      
      setLoadingSubtasks(true);
      setSubtaskProgress({ loaded: 0, total: taskIds.length });
      
      
      try {
        // Use the new batch loading method
        const subtasksResults = await taskService.getSubtasksBatch(taskIds);
        
        // Update state with all results
        setTaskSubtasks(prev => ({
          ...prev,
          ...subtasksResults
        }));
        
        // Mark all tasks as loaded
        setLoadedSubtasks(prev => new Set([...prev, ...taskIds]));
        
        // Update progress
        setSubtaskProgress({ loaded: taskIds.length, total: taskIds.length });
        
        
      } catch (error) {
        console.error('💥 Critical error in batch subtask loading:', error);
        
        // Fallback: mark all tasks as loaded with empty subtasks to prevent infinite retries
        setTaskSubtasks(prev => {
          const fallbackResults: Record<string, any[]> = {};
          taskIds.forEach(taskId => {
            fallbackResults[taskId] = [];
          });
          return { ...prev, ...fallbackResults };
        });
        
        setLoadedSubtasks(prev => new Set([...prev, ...taskIds]));
        setSubtaskProgress({ loaded: taskIds.length, total: taskIds.length });
      } finally {
        setLoadingSubtasks(false);
      }
    };

    // Only fetch if we have new tasks to load
    const hasNewTasks = localColumns.some(column => 
      column.tasks.some(task => !loadedSubtasks.has(task.id))
    );
    
    if (hasNewTasks) {
      fetchSubtasksBatch();
    }
  }, [localColumns, loadedSubtasks]);

  // Listen for task updates to refresh assignee information
  useEffect(() => {
    const handleTaskUpdated = (event: CustomEvent) => {
      const updatedTask = event.detail;
      // console.log('ListView: Received taskUpdated event for task:', updatedTask.id, 'with assignees:', updatedTask.assignees, 'assigneeIds:', updatedTask.assigneeIds);
      
      setLocalColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.map(task => {
            if (task.id === updatedTask.id) {
              // Ensure we have the latest assignee data
              const mergedTask = {
                ...task,
                ...updatedTask,
                // Handle both assignees and assigneeIds fields
                assignees: updatedTask.assignees || updatedTask.assigneeIds || task.assignees,
                _clientUpdatedAt: Date.now() // Add client-side timestamp for React key
              };
              // console.log('ListView: Updating task with merged data:', mergedTask);
              return mergedTask;
            }
            return task;
          })
        }))
      );
    };

    window.addEventListener('taskUpdated', handleTaskUpdated as EventListener);
    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated as EventListener);
    };
  }, []);

  // Flatten all tasks with project information
  const flattenedTasks = useMemo(() => {
    const tasks: FlattenedTask[] = [];
    
    localColumns.forEach(column => {
      column.tasks.forEach(task => {
        tasks.push({
          ...task,
          projectId: column.id,
          projectName: column.title,
          level: 0,
        });
      });
    });
    
    return tasks;
  }, [localColumns]);

  // Group and sort tasks
  const processedTasks = useMemo(() => {
    // First filter by status if not 'all'
    let filtered = [...flattenedTasks];
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    let sorted = filtered.sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Always group by project, regardless of status filter
    const groups: { [key: string]: FlattenedTask[] } = {};
    
    sorted.forEach(task => {
      const groupKey = task.projectName;
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return {
      groups: Object.entries(groups).map(([name, tasks]) => ({ name, tasks }))
    };
  }, [flattenedTasks, sortBy, sortOrder, statusFilter]);


  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };


  const handleAddTask = (groupName: string, event: React.MouseEvent) => {
    // Find the project/column for this group
    const column = localColumns.find(col => col.title === groupName);
    if (!column) return;

    // Calculate modal position relative to the button
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left + window.scrollX
    });

    setShowAddTaskModal(groupName);
  };

  const handleCreateTaskFromModal = async (taskName: string) => {
    if (!showAddTaskModal) return;

    const column = localColumns.find(col => col.title === showAddTaskModal);
    if (!column) return;

    setCreatingTask(showAddTaskModal);
    try {
      // Create a new task with the provided name
      const newTaskData = {
        title: taskName,
        description: '',
        status: 'todo' as const,
        projectId: column.id,
        creatorId: user?.uid || '',
        assignees: [],
        priority: 'medium' as const,
        tags: []
      };

      const newTask = await taskService.create(newTaskData);
      
      // Update local state to show the new task immediately
      setLocalColumns(prevColumns =>
        prevColumns.map(col => {
          if (col.id === column.id) {
            return {
              ...col,
              tasks: [...col.tasks, newTask]
            };
          }
          return col;
        })
      );

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('taskCreated', { detail: newTask }));
      
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(`Failed to create task in ${showAddTaskModal}. Please try again.`);
    } finally {
      setCreatingTask(null);
      setShowAddTaskModal(null);
    }
  };

  const handleGroupActions = (groupName: string) => {
    console.log('handleGroupActions called:', groupName);
    setShowGroupActions(showGroupActions === groupName ? null : groupName);
  };

  const showConfirmDialog = (
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    onConfirm: () => void,
    type: 'warning' | 'danger' | 'info' = 'info'
  ) => {
    setShowConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      type
    });
  };


  const handleGroupAction = async (action: string, groupName: string) => {
    console.log('handleGroupAction called:', action, groupName);
    const column = localColumns.find(col => col.title === groupName);
    if (!column) {
      console.log('Column not found:', groupName);
      return;
    }

    const taskIds = column.tasks.map(task => task.id);
    console.log('Task IDs:', taskIds);
    if (taskIds.length === 0) {
      alert(`No tasks found in ${groupName}.`);
      setShowGroupActions(null);
      return;
    }

    setPerformingAction(`${action}-${groupName}`);
    try {
      switch (action) {
          
          
        case 'archive':
          showConfirmDialog(
            'Archive All Tasks',
            `Are you sure you want to archive all ${taskIds.length} tasks in ${groupName}?\n\nThis will mark all tasks as completed.`,
            'Archive All',
            'Cancel',
            async () => {
              // Since there's no bulk archive API, we'll update status to 'done' as a workaround
              await taskService.bulkUpdateStatus(taskIds, 'done');
              
              // Update local state
              setLocalColumns(prevColumns =>
                prevColumns.map(col => {
                  if (col.id === column.id) {
                    return {
                      ...col,
                      tasks: col.tasks.map(task => ({ ...task, status: 'done' as const }))
                    };
                  }
                  return col;
                })
              );
              
              showConfirmDialog(
                'Success',
                `Archived ${taskIds.length} tasks in ${groupName}.`,
                'OK',
                '',
                () => {},
                'info'
              );
            },
            'warning'
          );
          break;
          
        case 'delete-all':
          showConfirmDialog(
            'Delete All Tasks',
            `Are you sure you want to delete all ${taskIds.length} tasks in ${groupName}?\n\nThis action cannot be undone and will permanently remove all tasks.`,
            'Delete All',
            'Cancel',
            async () => {
              // Delete tasks one by one since there's no bulk delete API
              const deletePromises = taskIds.map(taskId => taskService.delete(taskId));
              await Promise.all(deletePromises);
              
              // Update local state
              setLocalColumns(prevColumns =>
                prevColumns.map(col => {
                  if (col.id === column.id) {
                    return {
                      ...col,
                      tasks: []
                    };
                  }
                  return col;
                })
              );
              
              showConfirmDialog(
                'Success',
                `Deleted ${taskIds.length} tasks from ${groupName}.`,
                'OK',
                '',
                () => {},
                'info'
              );
            },
            'danger'
          );
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to perform ${action} on tasks in ${groupName}:`, error);
      alert(`Failed to perform ${action} on tasks in ${groupName}. Please try again.`);
    } finally {
      setPerformingAction(null);
    }
    
    setShowGroupActions(null);
  };

  const startEditing = (taskId: string, field: string, currentValue: string) => {
    setEditingTaskId(taskId);
    setEditingField(field);
    setEditingValue(currentValue);
  };

  const saveEdit = () => {
    if (editingTaskId && editingField) {
      onTaskUpdate(editingTaskId, { [editingField]: editingValue });
    }
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Modern List Layout */}
      <div className="flex-1 overflow-auto">
        {/* Column Headers */}
        <div className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Subtask Loading Progress Indicator */}
          {loadingSubtasks && subtaskProgress.total > 0 && (
            <div className={`px-6 py-2 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-blue-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Loading subtasks...
                    </span>
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                    {subtaskProgress.loaded} of {subtaskProgress.total} tasks
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-32 h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${(subtaskProgress.loaded / subtaskProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
                    {Math.round((subtaskProgress.loaded / subtaskProgress.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center px-6 py-2">
            <div className="w-6 flex-shrink-0">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">#</span>
              </div>
            </div>
            <div className="flex-1 px-2">
              <div className="flex items-center">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Task:
                </span>
                <div className="relative ml-1">
                  <select 
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                    }}
                    className={`appearance-none px-2 py-1 pr-6 text-xs border-0 rounded-md focus:outline-none ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <option value="all">All</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-24 px-2">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Deadline
              </span>
            </div>
            <div className="w-32 px-2">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Member
              </span>
            </div>
            <div className="w-32 px-2">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Labels
              </span>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {processedTasks.groups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Section Header */}
              {groupBy !== 'none' && (
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'} border-b ${isDarkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                  <div className="flex items-center px-6 py-2">
                    <button
                      onClick={() => toggleSection(group.name)}
                      className="flex items-center space-x-2 flex-1"
                    >
                      {collapsedSections.has(group.name) ? (
                        <LucideChevronRight className="w-3 h-3 text-gray-500" />
                      ) : (
                        <LucideChevronDown className="w-3 h-3 text-gray-500" />
                      )}
                      <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isDarkMode 
                          ? 'bg-blue-900/30 text-blue-300' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {group.name} ({group.tasks.length})
                      </div>
                    </button>
                    <div className="flex items-center space-x-1 relative">
                      <RoleGuard requiredPermission="tasks.create" facilityId={facilityId} fallback={
                        <button 
                          disabled
                          className={`p-1.5 rounded-md transition-colors opacity-50 cursor-not-allowed ${
                            isDarkMode 
                              ? 'text-gray-600' 
                              : 'text-gray-400'
                          }`}
                          title="No permission to create tasks"
                        >
                          <LucidePlus className="w-3 h-3" />
                        </button>
                      }>
                        <button 
                          onClick={(e) => handleAddTask(group.name, e)}
                          disabled={creatingTask === group.name}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          } ${creatingTask === group.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={creatingTask === group.name ? "Creating task..." : "Add Task"}
                        >
                          <LucidePlus className="w-3 h-3" />
                        </button>
                      </RoleGuard>
                      <RoleGuard requiredPermission="tasks.delete" facilityId={facilityId} fallback={
                        <button 
                          disabled
                          className={`p-1.5 rounded-md transition-colors opacity-50 cursor-not-allowed ${
                            isDarkMode 
                              ? 'text-gray-600' 
                              : 'text-gray-400'
                          }`}
                          title="No permission for group actions"
                          data-ellipsis
                        >
                          <LucideMoreHorizontal className="w-3 h-3" />
                        </button>
                      }>
                        <button 
                          onClick={() => handleGroupActions(group.name)}
                          disabled={performingAction?.startsWith('archive') || performingAction?.startsWith('delete-all')}
                          className={`p-1.5 rounded-md transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                              : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                          } ${performingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={performingAction ? "Processing..." : "Group Actions"}
                          data-ellipsis
                        >
                          {performingAction ? (
                            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <LucideMoreHorizontal className="w-3 h-3" />
                          )}
                        </button>
                      </RoleGuard>
                      
                      {/* Group Actions Dropdown */}
                      {showGroupActions === group.name && (
                        <div 
                          className={`absolute right-0 top-8 z-50 w-48 rounded-md shadow-md border ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-700' 
                              : 'bg-white border-gray-200'
                          }`}
                          data-dropdown
                        >
                          {/* Header */}
                          <div className={`px-3 py-2 border-b ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className={`text-xs font-semibold ${
                                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                }`}>
                                  Group Actions
                                </h3>
                                <p className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {group.tasks.length} tasks
                                </p>
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'
                              }`}>
                                <LucideMoreHorizontal className="w-3 h-3 text-blue-500" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGroupAction('archive', group.name);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                isDarkMode 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <div className={`p-1 rounded ${
                                isDarkMode ? 'bg-amber-900/20' : 'bg-amber-100'
                              }`}>
                                <LucideArchive className="w-3 h-3 text-amber-500" />
                              </div>
                              <div className="flex flex-col items-start flex-1">
                                <span className="font-medium">Archive All Tasks</span>
                                <span className={`text-xs truncate ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Mark all completed
                                </span>
                              </div>
                            </button>
                            
                            {/* Divider */}
                            <div className={`mx-3 my-1 border-t-2 ${
                              isDarkMode ? 'border-gray-600' : 'border-gray-300'
                            }`} />
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGroupAction('delete-all', group.name);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                isDarkMode 
                                  ? 'text-red-400 hover:bg-gray-700' 
                                  : 'text-red-600 hover:bg-gray-100'
                              }`}
                            >
                              <div className={`p-1 rounded ${
                                isDarkMode ? 'bg-red-900/20' : 'bg-red-100'
                              }`}>
                                <LucideTrash2 className="w-3 h-3 text-red-500" />
                              </div>
                              <div className="flex flex-col items-start flex-1">
                                <span className="font-medium">Delete All Tasks</span>
                                <span className={`text-xs truncate ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  Remove all permanently
                                </span>
                              </div>
                            </button>
                          </div>
                          
                          {/* Footer */}
                          <div className={`px-3 py-2 border-t ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <p className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Affects {group.tasks.length} tasks
                              </p>
                              <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {group.tasks.length}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Task Items */}
              {!collapsedSections.has(group.name) && (
                <div>
                  {group.tasks.map((task) => (
                    <div
                      key={`${task.id}-${(task as any)._clientUpdatedAt || task.updatedAt || task.createdAt}`}
                      className={`flex items-center px-6 py-2 hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      {/* Task Number */}
                      <div className="w-6 flex-shrink-0">
                        <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                            {group.tasks.indexOf(task) + 1}
                          </span>
                        </div>
                      </div>

                      {/* Task Name & Details */}
                      <div className="flex-1 px-2">
                        <div className="flex items-center space-x-2">
                          {/* Priority Indicator */}
                          {task.priority && (
                            <Tooltip content={`Priority: ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`}>
                              <div className={`w-2 h-2 rounded-full cursor-help ${
                                task.priority === 'urgent' ? 'bg-red-500' :
                                task.priority === 'high' ? 'bg-orange-500' :
                                task.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`} />
                            </Tooltip>
                          )}
                          
                          {/* Task Title */}
                          <div className="flex-1">
                            {editingTaskId === task.id && editingField === 'title' ? (
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                className={`w-full px-2 py-1 rounded border text-sm ${
                                  isDarkMode 
                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                autoFocus
                              />
                            ) : (
                              <RoleGuard requiredPermission="tasks.view_all" facilityId={facilityId} fallback={
                                <Tooltip content="No permission to view task details">
                                  <span
                                    className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} opacity-75`}
                                  >
                                    {task.title}
                                  </span>
                                </Tooltip>
                              }>
                                <Tooltip content={`Click to open task details • Double-click to edit title`}>
                                  <span
                                    className={`text-xs cursor-pointer hover:text-brand transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}
                                    onDoubleClick={() => startEditing(task.id, 'title', task.title)}
                                    onClick={() => onTaskClick(task.id)}
                                  >
                                    {task.title}
                                  </span>
                                </Tooltip>
                              </RoleGuard>
                            )}
                          </div>

                          {/* Progress & Time Indicators */}
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <Tooltip content={(() => {
                          const subtasks = taskSubtasks[task.id] || [];
                          const completedSubtasks = subtasks.filter((sub: any) => sub.completed).length;
                          const totalSubtasks = subtasks.length;
                          
                          if (loadingSubtasks && !loadedSubtasks.has(task.id)) {
                            return 'Loading subtask progress...';
                          }
                          if (totalSubtasks === 0 && !loadedSubtasks.has(task.id)) {
                            return 'No subtasks found';
                          }
                          return `Task Progress: ${completedSubtasks} completed out of ${totalSubtasks} total subtasks`;
                        })()}>
                          <div className="flex items-center space-x-1 cursor-help hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <LucideList className={`w-3 h-3 ${loadingSubtasks && !loadedSubtasks.has(task.id) ? 'animate-pulse' : ''}`} />
                            <span>{(() => {
                              const subtasks = taskSubtasks[task.id] || [];
                              const completedSubtasks = subtasks.filter((sub: any) => sub.completed).length;
                              const totalSubtasks = subtasks.length;
                              
                              // Show loading indicator only if we're actively loading this specific task
                              if (loadingSubtasks && !loadedSubtasks.has(task.id)) {
                                return '...';
                              }
                              
                              // If we have subtask data, show it
                              if (totalSubtasks > 0) {
                                return `${completedSubtasks}/${totalSubtasks}`;
                              }
                              
                              // Fallback to task progress field if available
                              if (task.progress !== undefined) {
                                return `${Math.round(task.progress)}%`;
                              }
                              
                              // Default to 0/0 if no data
                              return '0/0';
                            })()}</span>
                          </div>
                        </Tooltip>
                            <Tooltip content={(() => {
                              const estimatedDuration = (task as any).estimatedDuration || 0;
                              const actualCompletionDate = (task as any).actualCompletionDate;
                              let tooltipText = `Estimated Time: ${estimatedDuration} hours`;
                              if (actualCompletionDate) {
                                const completionTime = Math.round((new Date(actualCompletionDate).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60));
                                tooltipText += ` • Completed in ${completionTime} hours`;
                              }
                              return tooltipText;
                            })()}>
                              <div className="flex items-center space-x-1 cursor-help hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                                <LucideClock className="w-3 h-3" />
                                <span>{(task as any).estimatedDuration || 0}h</span>
                              </div>
                            </Tooltip>
                          </div>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="w-24 px-2">
                        {editingTaskId === task.id && editingField === 'dueDate' ? (
                          <input
                            type="date"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={saveEdit}
                            className={`w-full px-2 py-1 rounded border text-xs ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            autoFocus
                          />
                        ) : (
                          <Tooltip content={task.dueDate ? 
                            `Due Date: ${new Date(task.dueDate).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}${isOverdue(task.dueDate) ? ' • OVERDUE' : isDueSoon(task.dueDate) ? ' • Due Soon' : ''}` : 
                            'No due date set • Double-click to add due date'
                          }>
                            <span
                              className={`text-xs cursor-pointer hover:text-brand transition-colors ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              } ${
                                isOverdue(task.dueDate) ? 'text-red-500 font-semibold' :
                                isDueSoon(task.dueDate) ? 'text-yellow-500 font-semibold' : ''
                              }`}
                              onDoubleClick={() => startEditing(task.id, 'dueDate', task.dueDate || '')}
                            >
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric' 
                              }) : 'No due date'}
                            </span>
                          </Tooltip>
                        )}
                      </div>

                      {/* Members/Assignees */}
                      <div className="w-32 px-2">
                        <Tooltip content={(() => {
                          const assignees = task.assignees || (task as any).assigneeIds || [];
                          if (assignees.length === 0) return 'No assignees • Click to assign team members';
                          const assigneeNames = assignees.map((assignee: any) => {
                            const id = typeof assignee === 'string' ? assignee : assignee.id;
                            const member = facilityMembers[id];
                            return member ? member.name : 'Unknown User';
                          });
                          return `Assigned to: ${assigneeNames.join(', ')}`;
                        })()}>
                          <div className="flex items-center space-x-1 cursor-help">
                          {(() => {
                            // Handle both assignees and assigneeIds formats
                            const assignees = task.assignees || (task as any).assigneeIds || [];
                            return assignees && assignees.length > 0;
                          })() ? (
                            <>
                              {(() => {
                                const assignees = task.assignees || (task as any).assigneeIds || [];
                                return assignees.slice(0, 3).map((assignee, index) => {
                                  // Handle both string IDs and object assignees
                                  const id = typeof assignee === 'string' ? assignee : assignee.id;
                                  const member = facilityMembers[id];
                                  const fullName = member ? member.name : 'Unknown User';
                                  const initials = member ? member.name.charAt(0).toUpperCase() : '?';
                                  
                                  return (
                                    <div key={`${id}-${index}`} className="relative">
                                      {member?.profilePicture ? (
                                        <img
                                          src={member.profilePicture}
                                          alt={fullName}
                                          className="w-5 h-5 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                          onError={(e) => {
                                            // Fallback to initials if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                          }}
                                          onLoad={(e) => {
                                            // Hide fallback when image loads successfully
                                            const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'none';
                                          }}
                                        />
                                      ) : null}
                                      {/* Fallback avatar with initials */}
                                      <div 
                                        className="w-5 h-5 rounded-full flex items-center justify-center border bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                                        style={{ display: (member?.profilePicture && member.profilePicture.trim() !== '') ? 'none' : 'flex' }}
                                      >
                                        <span className="text-xs font-medium">
                                          {initials}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                              {(() => {
                                const assignees = task.assignees || (task as any).assigneeIds || [];
                                return assignees.length > 3;
                              })() && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center border bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                                  <span className="text-xs font-medium">
                                    +{(() => {
                                      const assignees = task.assignees || (task as any).assigneeIds || [];
                                      return assignees.length - 3;
                                    })()}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center border bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                              <span className="text-xs">?</span>
                            </div>
                          )}
                          </div>
                        </Tooltip>
                      </div>

                      {/* Labels */}
                      <div className="w-32 px-2">
                        <Tooltip content={task.tags && task.tags.length > 0 ? 
                          `Tags: ${task.tags.join(', ')}${task.tags.length > 2 ? ` (+${task.tags.length - 2} more)` : ''}` : 
                          'No tags • Click to add tags'
                        }>
                          <div className="flex flex-nowrap items-center gap-1 overflow-hidden cursor-help">
                          {task.tags && task.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className={`px-1.5 py-0.5 text-xs rounded-full whitespace-nowrap flex-shrink-0 ${
                                tag === 'Work' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                tag === 'Design' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                                tag === 'Daily' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {task.tags && task.tags.length > 2 && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full dark:bg-gray-700 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                              +{task.tags.length - 2}
                            </span>
                          )}
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={showAddTaskModal !== null}
        onClose={() => setShowAddTaskModal(null)}
        onSubmit={handleCreateTaskFromModal}
        isDarkMode={isDarkMode}
        position={modalPosition}
        placeholder="Enter task name..."
      />

      {/* Confirmation Modal */}
      {showConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowConfirmModal(prev => ({ ...prev, isOpen: false }))}
          />
          
          {/* Modal */}
          <div className={`relative w-full max-w-sm rounded-lg shadow-lg border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  showConfirmModal.type === 'danger' ? 'bg-red-100 dark:bg-red-900/20' :
                  showConfirmModal.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20' :
                  'bg-blue-100 dark:bg-blue-900/20'
                }`}>
                  {showConfirmModal.type === 'danger' ? (
                    <LucideTrash2 className="w-3 h-3 text-red-500" />
                  ) : showConfirmModal.type === 'warning' ? (
                    <LucideArchive className="w-3 h-3 text-amber-500" />
                  ) : (
                    <LucideEdit3 className="w-3 h-3 text-blue-500" />
                  )}
                </div>
                <h3 className={`text-sm font-semibold ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {showConfirmModal.title}
                </h3>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-4 py-3">
              <p className={`text-xs leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {showConfirmModal.message}
              </p>
            </div>
            
            {/* Actions */}
            <div className={`px-4 py-3 border-t flex gap-2 justify-end ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {showConfirmModal.cancelText && (
                <button
                  onClick={() => setShowConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showConfirmModal.cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  showConfirmModal.onConfirm();
                  setShowConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  showConfirmModal.type === 'danger' 
                    ? 'bg-red-500 text-white hover:bg-red-600' :
                  showConfirmModal.type === 'warning'
                    ? 'bg-amber-500 text-white hover:bg-amber-600' :
                    'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {showConfirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListView;
