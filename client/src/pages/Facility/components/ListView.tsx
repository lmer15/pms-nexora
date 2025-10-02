import React, { useState, useMemo, useEffect } from 'react'; // React hooks
import { Column, Task } from '../types';
import { LucideChevronDown, LucideChevronRight, LucidePlus, LucideMoreHorizontal, LucideClock, LucideList } from 'lucide-react';
import { useFacilityRefresh } from '../../../context/FacilityRefreshContext';
import { useAuth } from '../../../context/AuthContext';
import { taskService } from '../../../api/taskService';
import cacheService from '../../../services/cacheService';
import Tooltip from '../../../components/ui/Tooltip';

interface ListViewProps {
  columns: Column[];
  isDarkMode: boolean;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string, taskTitle: string, columnId: string) => void;
  onTaskMove: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
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
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onTaskMove,
}) => {
  const { userProfileRefreshTrigger } = useFacilityRefresh();
  const { user } = useAuth();
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [sortBy, setSortBy] = useState<keyof FlattenedTask>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'project' | 'status' | 'assignee' | 'priority' | 'none'>('project');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);
  const [assigneeProfiles, setAssigneeProfiles] = useState<Record<string, {firstName: string; lastName: string; profilePicture?: string}>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showGroupActions, setShowGroupActions] = useState<string | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState<string | null>(null);
  const [taskSubtasks, setTaskSubtasks] = useState<Record<string, any[]>>({});
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [loadedSubtasks, setLoadedSubtasks] = useState<Set<string>>(new Set());
  const [creatingTask, setCreatingTask] = useState<string | null>(null);
  const [performingAction, setPerformingAction] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showGroupActions) {
        setShowGroupActions(null);
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

  // Fetch assignee profiles for all tasks
  useEffect(() => {
    const fetchAllAssigneeProfiles = async () => {
      if (localColumns.length === 0) return;
      
      setLoadingProfiles(true);
      try {
        // Collect all unique assignee IDs from all tasks
        const allAssigneeIds = new Set<string>();
        localColumns.forEach(column => {
          column.tasks.forEach(task => {
            // Handle both assignees and assigneeIds fields
            const assignees = task.assignees || (task as any).assigneeIds || [];
            assignees.forEach((assignee: any) => {
              const id = typeof assignee === 'string' ? assignee : assignee.id;
              if (id) allAssigneeIds.add(id);
            });
          });
        });
        
        const assigneeIds = Array.from(allAssigneeIds);
        
        if (assigneeIds.length > 0) {
          // Invalidate cache if user profile refresh was triggered
          if (userProfileRefreshTrigger > 0) {
            cacheService.invalidateUserProfiles(assigneeIds);
          }
          
          const profiles = await taskService.fetchUserProfilesByIds(assigneeIds);
          setAssigneeProfiles(profiles || {});
        } else {
          setAssigneeProfiles({});
        }
      } catch (error) {
        console.error('Failed to fetch assignee profiles:', error);
        setAssigneeProfiles({});
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchAllAssigneeProfiles();
  }, [localColumns, userProfileRefreshTrigger]);

  // Fetch subtasks for all tasks with smart throttling
  useEffect(() => {
    const fetchAllSubtasks = async () => {
      if (localColumns.length === 0) return;
      
      setLoadingSubtasks(true);
      try {
        // Collect all unique task IDs
        const allTaskIds = new Set<string>();
        localColumns.forEach(column => {
          column.tasks.forEach(task => {
            allTaskIds.add(task.id);
          });
        });
        
        const taskIds = Array.from(allTaskIds);
        const subtasksData: Record<string, any[]> = {};
        
        // Process tasks in smaller batches with longer delays to avoid rate limiting
        const batchSize = 3; // Reduced batch size
        const delay = 500; // Increased delay between batches
        
        for (let i = 0; i < taskIds.length; i += batchSize) {
          const batch = taskIds.slice(i, i + batchSize);
          
          // Process batch with retry logic
          const batchPromises = batch.map(async (taskId) => {
            let retries = 2; // Reduced retries
            while (retries > 0) {
              try {
                const subtasks = await taskService.getSubtasks(taskId);
                return { taskId, subtasks: subtasks || [] };
              } catch (error) {
                retries--;
                if (retries === 0) {
                  console.error(`Failed to fetch subtasks for task ${taskId} after 2 retries:`, error);
                  return { taskId, subtasks: [] };
                }
                // Shorter backoff: wait 1s, 2s
                await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
              }
            }
            return { taskId, subtasks: [] };
          });
          
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(({ taskId, subtasks }) => {
            subtasksData[taskId] = subtasks;
            setLoadedSubtasks(prev => new Set([...prev, taskId]));
          });
          
          // Add delay between batches to prevent rate limiting
          if (i + batchSize < taskIds.length) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        setTaskSubtasks(subtasksData);
      } catch (error) {
        console.error('Failed to fetch subtasks:', error);
        setTaskSubtasks({});
      } finally {
        setLoadingSubtasks(false);
      }
    };

    fetchAllSubtasks();
  }, [localColumns]);

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
    let sorted = [...flattenedTasks].sort((a, b) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    if (groupBy === 'none') {
      return { groups: [{ name: 'All Tasks', tasks: sorted }] };
    }

    const groups: { [key: string]: FlattenedTask[] } = {};
    
    sorted.forEach(task => {
      let groupKey = '';
      switch (groupBy) {
        case 'project':
          groupKey = task.projectName;
          break;
        case 'status':
          groupKey = task.status;
          break;
        case 'assignee':
          groupKey = task.assigneeName || 'Unassigned';
          break;
        case 'priority':
          groupKey = task.priority || 'No Priority';
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return {
      groups: Object.entries(groups).map(([name, tasks]) => ({ name, tasks }))
    };
  }, [flattenedTasks, sortBy, sortOrder, groupBy]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === flattenedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(flattenedTasks.map(t => t.id)));
    }
  };

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

  const handleBulkAction = (action: 'delete' | 'move' | 'update-status') => {
    if (selectedTasks.size === 0) return;
    
    // Implement bulk actions
    console.log(`Bulk ${action} for tasks:`, Array.from(selectedTasks));
  };

  const handleAddTask = async (groupName: string) => {
    // Find the project/column for this group
    const column = localColumns.find(col => col.title === groupName);
    if (!column) return;

    setCreatingTask(groupName);
    try {
      // Create a new task with default values
      const newTaskData = {
        title: 'New Task',
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
      
      // Show success message
      alert(`New task created successfully in ${groupName}!`);
      
    } catch (error) {
      console.error('Failed to create task:', error);
      alert(`Failed to create task in ${groupName}. Please try again.`);
    } finally {
      setCreatingTask(null);
    }
  };

  const handleGroupActions = (groupName: string) => {
    setShowGroupActions(showGroupActions === groupName ? null : groupName);
  };


  const handleGroupAction = async (action: string, groupName: string) => {
    const column = localColumns.find(col => col.title === groupName);
    if (!column) return;

    const taskIds = column.tasks.map(task => task.id);
    if (taskIds.length === 0) {
      alert(`No tasks found in ${groupName}.`);
      setShowGroupActions(null);
      return;
    }

    setPerformingAction(`${action}-${groupName}`);
    try {
      switch (action) {
        case 'bulk-edit':
          // For now, just show a message - in a full implementation, this would open a bulk edit modal
          alert(`Bulk edit ${taskIds.length} tasks in ${groupName}\n\nThis would open a bulk edit interface in a full implementation.`);
          break;
          
        case 'export':
          // Export tasks to CSV format
          const csvData = column.tasks.map(task => ({
            Title: task.title,
            Status: task.status,
            Priority: task.priority || 'None',
            'Due Date': task.dueDate || 'None',
            'Created At': new Date(task.createdAt).toLocaleDateString(),
            'Updated At': new Date(task.updatedAt).toLocaleDateString()
          }));
          
          const csvContent = [
            Object.keys(csvData[0]).join(','),
            ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${groupName}_tasks_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          alert(`Exported ${taskIds.length} tasks from ${groupName} to CSV.`);
          break;
          
        case 'archive':
          if (confirm(`Are you sure you want to archive all ${taskIds.length} tasks in ${groupName}?`)) {
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
            
            alert(`Archived ${taskIds.length} tasks in ${groupName}.`);
          }
          break;
          
        case 'delete-all':
          if (confirm(`Are you sure you want to delete all ${taskIds.length} tasks in ${groupName}? This action cannot be undone.`)) {
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
            
            alert(`Deleted ${taskIds.length} tasks from ${groupName}.`);
          }
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
          <div className="flex items-center px-6 py-2">
            <div className="w-6 flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedTasks.size === flattenedTasks.length && flattenedTasks.length > 0}
                onChange={handleSelectAll}
                className="rounded-full w-4 h-4"
              />
            </div>
            <div className="flex-1 px-2">
              <div className="flex items-center">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Task
                </span>
                <select className="ml-1 px-2 py-1 text-xs text-green-800 border-0 rounded-md focus:outline-none">
                  <option value="all">All</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
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
                      <button 
                        onClick={() => handleAddTask(group.name)}
                        disabled={creatingTask === group.name}
                        className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'} ${creatingTask === group.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={creatingTask === group.name ? "Creating task..." : "Add Task"}
                      >
                        <LucidePlus className={`w-3 h-3 ${creatingTask === group.name ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>
                      <button 
                        onClick={() => handleGroupActions(group.name)}
                        disabled={performingAction?.startsWith('bulk-edit') || performingAction?.startsWith('export') || performingAction?.startsWith('archive') || performingAction?.startsWith('delete-all')}
                        className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'} ${performingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={performingAction ? "Processing..." : "Group Actions"}
                      >
                        <LucideMoreHorizontal className={`w-3 h-3 ${performingAction ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>
                      
                      {/* Group Actions Dropdown */}
                      {showGroupActions === group.name && (
                        <div className={`absolute right-0 top-8 z-50 w-48 rounded-md shadow-lg border ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                        }`}>
                          <div className="py-1">
                            <button
                              onClick={() => handleGroupAction('bulk-edit', group.name)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                isDarkMode 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Bulk Edit Tasks
                            </button>
                            <button
                              onClick={() => handleGroupAction('export', group.name)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                isDarkMode 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Export Tasks
                            </button>
                            <button
                              onClick={() => handleGroupAction('archive', group.name)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                isDarkMode 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              Archive All Tasks
                            </button>
                            <button
                              onClick={() => handleGroupAction('delete-all', group.name)}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                isDarkMode 
                                  ? 'text-red-400 hover:bg-gray-700' 
                                  : 'text-red-600 hover:bg-gray-100'
                              }`}
                            >
                              Delete All Tasks
                            </button>
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
                      {/* Checkbox */}
                      <div className="w-6 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                          className="rounded-full w-4 h-4"
                        />
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
                              <Tooltip content={`Click to open task details • Double-click to edit title`}>
                                <span
                                  className={`text-xs cursor-pointer hover:text-brand transition-colors ${isDarkMode ? 'text-gray-900' : 'text-gray-700'}`}
                                  onDoubleClick={() => startEditing(task.id, 'title', task.title)}
                                  onClick={() => onTaskClick(task.id)}
                                >
                                  {task.title}
                                </span>
                              </Tooltip>
                            )}
                          </div>

                          {/* Progress & Time Indicators */}
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <Tooltip content={(() => {
                          const subtasks = taskSubtasks[task.id] || [];
                          const completedSubtasks = subtasks.filter((sub: any) => sub.completed).length;
                          const totalSubtasks = subtasks.length;
                          
                          if (loadingSubtasks) {
                            return 'Loading subtask progress...';
                          }
                          if (totalSubtasks === 0 && !loadedSubtasks.has(task.id)) {
                            return 'Loading subtask progress...';
                          }
                          return `Task Progress: ${completedSubtasks} completed out of ${totalSubtasks} total subtasks`;
                        })()}>
                          <div className="flex items-center space-x-1 cursor-help hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <LucideList className="w-3 h-3" />
                            <span>{(() => {
                              const subtasks = taskSubtasks[task.id] || [];
                              const completedSubtasks = subtasks.filter((sub: any) => sub.completed).length;
                              const totalSubtasks = subtasks.length;
                              
                              if (loadingSubtasks) {
                                return '...';
                              }
                              if (totalSubtasks === 0 && !loadedSubtasks.has(task.id)) {
                                return '...';
                              }
                              return totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : '0/0';
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
                            const profile = assigneeProfiles[id];
                            return profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Unknown User';
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
                                  const profile = assigneeProfiles[id];
                                  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Unknown User';
                                  const initials = profile ? `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`.toUpperCase() : '?';
                                  
                                  return (
                                    <div key={`${id}-${index}`} className="relative">
                                      {profile?.profilePicture ? (
                                        <img
                                          src={profile.profilePicture}
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
                                        style={{ display: (profile?.profilePicture && profile.profilePicture.trim() !== '') ? 'none' : 'flex' }}
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
    </div>
  );
};

export default ListView;
