import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityService, Facility, FacilityStats } from '../../api/facilityService';
import { useAuth } from '../../context/AuthContext';
import { useCurrentFacility } from '../../context/CurrentFacilityContext';
import { useFacilityRefresh } from '../../context/FacilityRefreshContext';
import Notification from '../../components/Notification';
import DeleteConfirmationModal from '../../components/DeleteProjectModal';
import ArchiveConfirmationModal from '../../components/ArchiveProjectModal';
import TaskDetailModal from '../../components/TaskDetailModal';
import SlimFacilityHeader from './components/SlimFacilityHeader';
import CommandPalette from '../../components/CommandPalette';
import FloatingViewNavigation from '../../components/FloatingViewNavigation';
import KanbanBoard from './components/KanbanBoard';
import ListView from './components/ListView';
import CalendarView from './components/CalendarView';
import TimelineView from './components/TimelineView';
import RoleManagementModal from '../../components/RoleManagementModal';
import RoleIndicator from '../../components/RoleIndicator';
import { RoleGuard, usePermissions } from '../../components/RoleGuard';
import { useOptimizedProjectManagement } from '../../hooks/useOptimizedProjectManagement';
import { useTaskManagement } from '../../hooks/useTaskManagement';
import { taskService } from '../../api/taskService';
import { projectService } from '../../api/projectService';
import cacheService from '../../services/cacheService';
import { Column, Task } from './types';
import './components/Views.css';

const FacilityView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentFacilityName } = useCurrentFacility();
  const { memberRefreshTriggers } = useFacilityRefresh();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [facilityStats, setFacilityStats] = useState<FacilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showTaskMoveNotification, setShowTaskMoveNotification] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: 'project' | 'task', columnId?: string} | null>(null);
  const [itemToArchive, setItemToArchive] = useState<{id: string, name: string} | null>(null);
  const [showProjectDeleteNotification, setShowProjectDeleteNotification] = useState(false);
  const [showTaskDeleteNotification, setShowTaskDeleteNotification] = useState(false);
  const [showProjectArchiveNotification, setShowProjectArchiveNotification] = useState(false);
  const [showProjectCreateNotification, setShowProjectCreateNotification] = useState(false);
  const [openTaskDropdownId, setOpenTaskDropdownId] = useState<string | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  
  const [tagFilter, setTagFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'kanban' | 'list' | 'calendar' | 'timeline'>('kanban');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [availableAssignees, setAvailableAssignees] = useState<Array<{id: string, name: string, email?: string, profilePicture?: string}>>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const { canManageUsers } = usePermissions(id);

  const handleOpenTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailModalOpen(true);
  };

  // Handle project status update
  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      // Update UI immediately (optimistic update)
      setColumns(prevColumns => 
        prevColumns.map(col => 
          col.id === projectId 
            ? { ...col, _status: newStatus, _projectStatus: newStatus, status: newStatus } // Add temporary status for UI
            : col
        )
      );
      
      const updatedProject = await projectService.update(projectId, { status: newStatus as any });
      
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId ? updatedProject : project
        )
      );
      
      // Update columns state with the server response
      setColumns(prevColumns => 
        prevColumns.map(col => 
          col.id === projectId 
            ? { ...col, _status: undefined, _projectStatus: updatedProject.status, status: updatedProject.status }
            : col
        )
      );
    
      // When project is marked as completed, automatically mark all tasks as done
      if (newStatus === 'completed') {
        const projectTasks = columns
          .find(col => col.id === projectId)?.tasks || [];
        
        const taskIdsToUpdate = projectTasks
          .filter(task => task.status !== 'done')
          .map(task => task.id);
        
        if (taskIdsToUpdate.length > 0) {
          try {
            await taskService.bulkUpdateStatus(taskIdsToUpdate, 'done');
            
            // Update local task states
            setColumns(prevColumns => 
              prevColumns.map(col => 
                col.id === projectId 
                  ? {
                      ...col,
                      tasks: col.tasks.map(task => 
                        taskIdsToUpdate.includes(task.id) 
                          ? { ...task, status: 'done' as any }
                          : task
                      )
                    }
                  : col
              )
            );
            
            // Show notification about automatic task completion
            if (taskIdsToUpdate.length > 0) {
              setShowNotification(true);
            }
          } catch (error) {
            console.error('Error updating tasks to done status:', error);
          }
        }
      }
      
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
      
      // Revert optimistic update on error
      setColumns(prevColumns => 
        prevColumns.map(col => 
          col.id === projectId 
            ? { ...col, _status: undefined, _projectStatus: col._projectStatus }
            : col
        )
      );
    }
  };

  const handleTaskDeleteClick = (taskId: string, taskTitle: string, columnId: string) => {
    setItemToDelete({ id: taskId, name: taskTitle, type: 'task', columnId });
    setIsDeleteModalOpen(true);
  };


  const handleTaskMove = async (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
    
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      
      // Find source and target columns
      const sourceColumnIndex = newColumns.findIndex(col => col.id === fromColumnId);
      const targetColumnIndex = newColumns.findIndex(col => col.id === toColumnId);
      
      if (sourceColumnIndex === -1 || targetColumnIndex === -1) {
        return prevColumns;
      }

      const sourceColumn = newColumns[sourceColumnIndex];
      const taskIndex = sourceColumn.tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        return prevColumns;
      }

      const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);
      const updatedTask = { ...movedTask, projectId: toColumnId };
      
      const targetColumn = newColumns[targetColumnIndex];
      targetColumn.tasks.splice(newIndex, 0, updatedTask);
      
      return newColumns;
    });
    try {
      await taskService.update(taskId, { projectId: toColumnId });
      setShowTaskMoveNotification(true);
    } catch (error) {
      console.error('Failed to move task:', error);
      // Revert optimistic update on error
      loadFacilityData();
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'project') {
      setColumns(prev => prev.filter(col => col.id !== itemToDelete.id));
      await deleteProjectHook(itemToDelete.id);
      setShowProjectDeleteNotification(true);
    } else {
      await handleDeleteTask(itemToDelete.id, itemToDelete.name, itemToDelete.columnId || '');
      setShowTaskDeleteNotification(true);
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmArchive = async () => {
    if (!itemToArchive) return;
    // Immediately remove the project column from UI
    setColumns(prev => prev.filter(col => col.id !== itemToArchive.id));
    await archiveProjectHook(itemToArchive.id);
    setShowProjectArchiveNotification(true);
    setIsArchiveModalOpen(false);
    setItemToArchive(null);
  };

  const handleArchiveProject = (projectId: string, projectName: string) => {
    setItemToArchive({ id: projectId, name: projectName });
    setIsArchiveModalOpen(true);
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    setItemToDelete({ id: projectId, name: projectName, type: 'project' });
    setIsDeleteModalOpen(true);
  };

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (id) {
      loadFacility();
    }
    
    // Cleanup: clear facility name when component unmounts
    return () => {
      setCurrentFacilityName(null);
    };
  }, [id, setCurrentFacilityName]);

  const loadFacility = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [facilityData, statsData] = await Promise.all([
        facilityService.getById(id),
        facilityService.getFacilityStats(id)
      ]);
      setFacility(facilityData);
      setFacilityStats(statsData);
      setCurrentFacilityName(facilityData.name);
    } catch (err) {
      setError('Failed to load facility details');
      console.error('Error loading facility:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use custom hooks for project and task management
  const {
    projects,
    setProjects,
    columns,
    setColumns,
    loadProjects,
    loadColumnsForProject,
    loadFacilityData,
    refreshTasks,
    isLoading: projectLoading,
    isCreatingProject,
    newProjectName,
    setNewProjectName,
    isCreatingLoading,
    createError,
    editingProjectId,
    setEditingProjectId,
    editingProjectName,
    setEditingProjectName,
    handleStartCreateProject,
    handleCancelCreateProject,
    handleCreateProject,
    handleUpdateProjectName,
    handleArchiveProject: archiveProjectHook,
    handleDeleteProject: deleteProjectHook,
  } = useOptimizedProjectManagement(id || '', () => setShowProjectCreateNotification(true), () => setShowProjectDeleteNotification(true), () => setShowProjectArchiveNotification(true));

  const {
    editingTaskId,
    setEditingTaskId,
    editingTaskTitle,
    setEditingTaskTitle,
    addingTaskColumnId,
    setAddingTaskColumnId,
    handleCreateTask,
    handleSaveNewTask,
    handleCancelNewTask,
    handleSaveTask,
    handleCancelEdit,
    handleDeleteTask: originalHandleDeleteTask,
  } = useTaskManagement(columns, setColumns, () => setShowNotification(true));

  useEffect(() => {
    const updateProjectStatuses = async () => {
      for (const column of columns) {
        const projectTasks = column.tasks;
        if (projectTasks.length === 0) continue;

        const completedTasks = projectTasks.filter(task => task.status === 'done').length;
        const totalTasks = projectTasks.length;
        
        // Only auto-complete if ALL tasks are done
        if (completedTasks === totalTasks && totalTasks > 0) {
          const currentProject = projects.find(p => p.id === column.id);
          if (currentProject && currentProject.status !== 'completed') {
            try {
              await projectService.update(column.id, { status: 'completed' as any });
              
              // Update local state
              setProjects(prevProjects => 
                prevProjects.map(project => 
                  project.id === column.id ? { ...project, status: 'completed' } : project
                )
              );
              
              setColumns(prevColumns => 
                prevColumns.map(col => 
                  col.id === column.id 
                    ? { ...col, _projectStatus: 'completed', status: 'completed' }
                    : col
                )
              );
              
              // Show notification about automatic project completion
              setShowNotification(true);
            } catch (error) {
              console.error(`Error auto-completing project ${column.id}:`, error);
            }
          }
        }
      }
    };

    if (columns.length > 0 && projects.length > 0) {
      updateProjectStatuses();
    }
  }, [columns, projects]);

  // Enhanced task deletion with event-based updates
  const handleDeleteTask = async (taskId: string, taskTitle: string, columnId: string) => {
    const success = await originalHandleDeleteTask(taskId, taskTitle, columnId);
    
    return success;
  };
  useEffect(() => {
    if (id) {
      loadFacilityData();
    }
  }, [id]);

  // Collect available assignees from facility members

  // Fetch facility members for assignee filter
  useEffect(() => {
    const fetchFacilityMembers = async () => {
      if (!facility?.id) return;
      
      try {
        const membersData = await facilityService.getFacilityMembers(facility.id);
        const assignees = membersData.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          profilePicture: member.profilePicture
        }));
        setAvailableAssignees(assignees);
        
      } catch (error) {
        console.error('Failed to fetch facility members for assignee filter:', error);
        setAvailableAssignees([]);
      }
    };

    fetchFacilityMembers();
  }, [facility?.id, memberRefreshTriggers[facility?.id || '']]);


  // Collect available tags from all tasks
  useEffect(() => {
    const tags = new Set<string>();
    columns.forEach(column => {
      column.tasks.forEach(task => {
        if (task.tags) {
          task.tags.forEach(tag => tags.add(tag));
        }
      });
    });
    setAvailableTags(Array.from(tags));
  }, [columns]);

  // Handle task updates
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Convert assignees from objects to strings if needed
      const updateData = { ...updates };
      if (updateData.assignees && Array.isArray(updateData.assignees)) {
        updateData.assignees = updateData.assignees.map((assignee: any) => 
          typeof assignee === 'string' ? assignee : assignee.id
        );
      }
      
      await taskService.update(taskId, updateData as any);
      // Note: Removed refreshTasks() call - real-time updates are handled by the event system
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };


  // Filter columns based on search term and filter criteria
  const filteredColumns = React.useMemo(() => {
    const hasFilters = searchTerm || filter !== 'all' || assigneeFilter !== 'all' || tagFilter !== 'all' || priorityFilter !== 'all';
    
    if (!hasFilters) {
      return columns;
    }

    return columns.filter(column => {
      // Filter by project name
      const projectMatches = !searchTerm || 
        column.title.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by project status and characteristics
      let statusMatches = true;
      if (filter !== 'all') {
        switch (filter) {
          case 'active':
            const activeProject = projects.find(p => p.id === column.id);
            statusMatches = activeProject?.status !== 'completed';
            break;
          case 'completed':
            const project = projects.find(p => p.id === column.id);
            statusMatches = project?.status === 'completed';
            break;
          case 'with-tasks':
            statusMatches = column.tasks.length > 0;
            break;
          case 'empty':
            statusMatches = column.tasks.length === 0;
            break;
          default:
            statusMatches = true;
        }
      }

      // Filter by tasks within the project
      const taskMatches = !searchTerm || 
        column.tasks.some(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );

      return (projectMatches || taskMatches) && statusMatches;
    }).map(column => {
      // Filter tasks within each column based on all criteria
      let filteredTasks = column.tasks;

      // Search term filter
      if (searchTerm) {
        filteredTasks = filteredTasks.filter(task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        
        filteredTasks = filteredTasks.filter(task => {
          // Check for assignee data in various field names
          const hasAssignee = task.assignee || 
                             task.assigneeName || 
                             (task as any).assigneeIds ||
                             (task as any).assignedTo ||
                             (task as any).assignedToName ||
                             (task as any).userId ||
                             (task as any).user ||
                             (task as any).owner ||
                             (task as any).ownerId;
          
          // Check if any of these fields have actual values (not just truthy)
          const hasValue = hasAssignee && 
                          hasAssignee !== '' && 
                          hasAssignee !== null && 
                          hasAssignee !== undefined &&
                          (Array.isArray(hasAssignee) ? hasAssignee.length > 0 : true);
          
          if (!hasValue) {
            return false;
          }
          
          // Match by assignee name (primary check) - exact match
          if (task.assigneeName === assigneeFilter) {
            return true;
          }
          
          // Match by assignee name (case-insensitive)
          if (task.assigneeName && task.assigneeName.toLowerCase() === assigneeFilter.toLowerCase()) {
            return true;
          }
          
          // Match by assignee ID if assigneeName doesn't match
          if (task.assignee === assigneeFilter) {
            return true;
          }
          
          // Match by assignee ID (case-insensitive for string IDs)
          if (task.assignee && task.assignee.toLowerCase() === assigneeFilter.toLowerCase()) {
            return true;
          }
          
          // Match by assigneeIds array
          if ((task as any).assigneeIds && Array.isArray((task as any).assigneeIds)) {
            const assigneeIds = (task as any).assigneeIds;
            if (assigneeIds.includes(assigneeFilter)) {
              return true;
            }
          }
          
          // Match by other possible field names
          if ((task as any).assignedTo === assigneeFilter || 
              (task as any).assignedToName === assigneeFilter ||
              (task as any).userId === assigneeFilter ||
              (task as any).user === assigneeFilter ||
              (task as any).owner === assigneeFilter ||
              (task as any).ownerId === assigneeFilter) {
            return true;
          }
          
          // Match by finding the assignee in availableAssignees by name
          if (availableAssignees.length > 0) {
            const matchingAssignee = availableAssignees.find(a => a.name === assigneeFilter);
            if (matchingAssignee) {
              // Check multiple assignee field names
              const taskAssigneeId = task.assignee || 
                                   (task as any).assignedTo ||
                                   (task as any).userId ||
                                   (task as any).user ||
                                   (task as any).owner ||
                                   (task as any).ownerId;
              
              if (taskAssigneeId === matchingAssignee.id) {
                return true;
              }
              
              // Check assigneeIds array
              if ((task as any).assigneeIds && Array.isArray((task as any).assigneeIds)) {
                const assigneeIds = (task as any).assigneeIds;
                if (assigneeIds.includes(matchingAssignee.id)) {
                  return true;
                }
              }
            }
          }
          
          if (task.assigneeName && assigneeFilter) {
            const taskName = task.assigneeName.toLowerCase();
            const filterName = assigneeFilter.toLowerCase();

            if (taskName.includes(filterName) || filterName.includes(taskName)) {
              return true;
            }

            if (filterName.includes('@')) {
              const emailUsername = filterName.split('@')[0];
              if (taskName.includes(emailUsername) || emailUsername.includes(taskName)) {
                return true;
              }
            }
          }
          
          if (availableAssignees.length > 0) {
            const matchingAssignee = availableAssignees.find(a => a.name === assigneeFilter);
            if (matchingAssignee) {
              if (task.assigneeName && task.assigneeName.toLowerCase() === matchingAssignee.name.toLowerCase()) {
                return true;
              }
              
              // Try to match by partial name comparison
              if (task.assigneeName && matchingAssignee.name) {
                const taskName = task.assigneeName.toLowerCase();
                const memberName = matchingAssignee.name.toLowerCase();
                
                // Check if names are similar (one contains the other)
                if (taskName.includes(memberName) || memberName.includes(taskName)) {
                  return true;
                }
              }
              
              if (task.assigneeName && matchingAssignee.email) {
                const taskEmail = task.assigneeName.toLowerCase();
                const memberEmail = matchingAssignee.email.toLowerCase();
  
                if (taskEmail === memberEmail || taskEmail.includes(memberEmail.split('@')[0])) {
                  return true;
                }
              }
            }
          }
          
          return false;
        });
      }

      // Tag filter
      if (tagFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task =>
          task.tags && task.tags.includes(tagFilter)
        );
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task =>
          task.priority === priorityFilter
        );
      }

      return {
        ...column,
        tasks: filteredTasks
      };
    });
  }, [columns, searchTerm, filter, assigneeFilter, tagFilter, priorityFilter, availableAssignees]);



  // Listen for task updates from TaskDetailModal
  useEffect(() => {
    const handleTaskUpdated = async (event: CustomEvent) => {
      const updatedTask = event.detail;
      setColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.map(task =>
            task.id === updatedTask.id ? { 
              ...updatedTask, 
              _clientUpdatedAt: Date.now()
            } : task
          )
        }))
      );
      
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      setColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.filter(task => task.id !== taskId)
        }))
      );
    };

    const handleTaskCreated = (event: CustomEvent) => {
      const newTask = event.detail;
      setColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.id === newTask.projectId 
            ? [...column.tasks, { ...newTask, _clientUpdatedAt: Date.now() }]
            : column.tasks
        }))
      );
    };

    window.addEventListener('taskUpdated', handleTaskUpdated as unknown as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeleted as EventListener);
    window.addEventListener('taskCreated', handleTaskCreated as EventListener);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated as unknown as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeleted as EventListener);
      window.removeEventListener('taskCreated', handleTaskCreated as EventListener);
    };
  }, []);


  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs">{error || 'Facility not found'}</p>
          <button
            onClick={() => navigate('/Facilities')}
            className="px-3 py-1.5 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors text-xs"
          >
            Back to Facilities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-light dark:bg-gray-900 flex flex-col h-full">
      <SlimFacilityHeader
        facility={facility}
        projectsCount={projects.length}
        memberCount={facilityStats?.memberCount || 0}
        filteredProjectsCount={filteredColumns.length}
        searchTerm={searchTerm}
        onManageRoles={() => setShowRoleManagement(true)}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        isDarkMode={isDarkMode}
        totalTasks={facilityStats?.taskCount || 0}
        completedTasks={facilityStats?.completedTaskCount || 0}
        overdueTasks={facilityStats?.overdueTaskCount || 0}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        availableAssignees={availableAssignees}
        availableTags={availableTags.map(tag => ({ id: tag, name: tag, color: '#3b82f6' }))}
        projects={columns.map(col => ({
          id: col.id,
          title: col.title,
          taskCount: col.tasks.length
        }))}
        selectedProjectId={selectedProjectId}
        onProjectSelect={(projectId) => {
          // Set the selected project
          setSelectedProjectId(projectId);
          
          // Scroll to the project column
          const element = document.querySelector(`[data-column-id="${projectId}"]`);
          if (element) {
            // Find the horizontal scrolling container (KanbanBoard)
            const scrollContainer = document.querySelector('.kanban-board');
            if (scrollContainer) {
              // Calculate the position of the element relative to the scroll container
              const containerRect = scrollContainer.getBoundingClientRect();
              const elementRect = element.getBoundingClientRect();
              const scrollLeft = scrollContainer.scrollLeft + (elementRect.left - containerRect.left) - (containerRect.width / 2) + (elementRect.width / 2);
              
              // Smooth scroll to the element
              scrollContainer.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
              });
            } else {
              // Fallback to regular scrollIntoView
              element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }}
        onApplyFilters={(filters) => {
          setSearchTerm(filters.searchTerm);
          setFilter(filters.filter);
          setAssigneeFilter(filters.assigneeFilter);
          setTagFilter(filters.tagFilter);
          setPriorityFilter(filters.priorityFilter);
        }}
        isCollapsed={isHeaderCollapsed}
        onToggleCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
      />


      {/* View Content with Enhanced Transitions */}
      <div className="flex-1 flex flex-col min-h-0 relative" style={{ zIndex: 1 }}>
        {/* Kanban View */}
        <div className={`
          absolute inset-0 transition-all duration-300 ease-in-out
          ${currentView === 'kanban' 
            ? 'opacity-100 z-10' 
            : 'opacity-0 z-0 pointer-events-none'
          }
        `}>
          <KanbanBoard
            columns={filteredColumns}
            isDarkMode={isDarkMode}
            editingTaskId={editingTaskId}
            editingTaskTitle={editingTaskTitle}
            setEditingTaskTitle={setEditingTaskTitle}
            setEditingTaskId={(id) => {}}
            addingTaskColumnId={addingTaskColumnId}
            setAddingTaskColumnId={(id) => {}}
            openTaskDropdownId={openTaskDropdownId}
            setOpenTaskDropdownId={setOpenTaskDropdownId}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
            editingProjectId={editingProjectId}
            editingProjectName={editingProjectName}
            setEditingProjectId={setEditingProjectId}
            setEditingProjectName={setEditingProjectName}
            isCreatingProject={isCreatingProject}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            isCreatingLoading={isCreatingLoading}
            createError={createError}
            handleStartCreateProject={handleStartCreateProject}
            handleCancelCreateProject={handleCancelCreateProject}
            handleCreateProject={handleCreateProject}
            handleCreateTask={handleCreateTask}
            handleSaveNewTask={handleSaveNewTask}
            handleCancelNewTask={handleCancelNewTask}
            handleDeleteTask={handleTaskDeleteClick}
            handleSaveTask={handleSaveTask}
            handleCancelEdit={handleCancelEdit}
            handleArchiveProject={handleArchiveProject}
            handleDeleteProject={handleDeleteProject}
            handleUpdateProjectName={handleUpdateProjectName}
            handleUpdateProjectStatus={handleUpdateProjectStatus}
            handleOpenTaskDetail={handleOpenTaskDetail}
            onTaskMove={handleTaskMove}
            facilityId={id}
            selectedProjectId={selectedProjectId}
          />
        </div>
        
        {/* List View */}
        <div className={`
          absolute inset-0 transition-all duration-300 ease-in-out
          ${currentView === 'list' 
            ? 'opacity-100 z-10' 
            : 'opacity-0 z-0 pointer-events-none'
          }
        `}>
          <div className="flex-1 overflow-auto h-full">
            <ListView
              columns={filteredColumns}
              isDarkMode={isDarkMode}
              facilityId={facility?.id}
              onTaskClick={handleOpenTaskDetail}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDeleteClick}
              onTaskMove={handleTaskMove}
            />
          </div>
        </div>
        
        {/* Calendar View */}
        <div className={`
          absolute inset-0 transition-all duration-300 ease-in-out
          ${currentView === 'calendar' 
            ? 'opacity-100 z-10' 
            : 'opacity-0 z-0 pointer-events-none'
          }
        `}>
          <div className="flex-1 overflow-auto h-full">
            <CalendarView
              columns={filteredColumns}
              isDarkMode={isDarkMode}
              facilityId={facility?.id}
              onTaskClick={handleOpenTaskDetail}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDeleteClick}
            />
          </div>
        </div>
        
        {/* Timeline View */}
        <div className={`
          absolute inset-0 transition-all duration-500 ease-in-out transform
          ${currentView === 'timeline' 
            ? 'opacity-100 translate-x-0 z-10' 
            : 'opacity-0 translate-x-full z-0 pointer-events-none'
          }
        `}>
          <div className="flex-1 overflow-auto h-full">
            <TimelineView
              columns={filteredColumns}
              isDarkMode={isDarkMode}
              facilityId={facility?.id}
              onTaskClick={handleOpenTaskDetail}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDeleteClick}
            />
          </div>
        </div>
      </div>

      {/* Floating View Navigation */}
      <FloatingViewNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        isDarkMode={isDarkMode}
      />

      {showNotification && (
        <Notification
          message="Task created successfully!"
          onClose={() => setShowNotification(false)}
        />
      )}
      {showTaskMoveNotification && (
        <Notification
          message="Task moved successfully!"
          onClose={() => setShowTaskMoveNotification(false)}
        />
      )}
      {showProjectCreateNotification && (
        <Notification
          message="Project created successfully!"
          onClose={() => setShowProjectCreateNotification(false)}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          itemName={itemToDelete?.name || ''}
          itemType={itemToDelete?.type || 'project'}
          isDarkMode={isDarkMode}
        />
      )}
      {showProjectDeleteNotification && (
        <Notification
          message="Project deleted successfully!"
          onClose={() => setShowProjectDeleteNotification(false)}
        />
      )}
      {showTaskDeleteNotification && (
        <Notification
          message="Task deleted successfully!"
          onClose={() => setShowTaskDeleteNotification(false)}
        />
      )}
      {showProjectArchiveNotification && (
        <Notification
          message="Project archived successfully!"
          onClose={() => setShowProjectArchiveNotification(false)}
        />
      )}
      {isArchiveModalOpen && (
        <ArchiveConfirmationModal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          onConfirm={handleConfirmArchive}
          projectName={itemToArchive?.name || ''}
          isDarkMode={isDarkMode}
        />
      )}
      {isTaskDetailModalOpen && selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={isTaskDetailModalOpen}
          onClose={() => {
            setIsTaskDetailModalOpen(false);
            setSelectedTaskId(null);

          }}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        isDarkMode={isDarkMode}
        tasks={columns.flatMap(col => col.tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assigneeName: task.assigneeName,
          projectTitle: col.title
        })))}
        projects={columns.map(col => ({
          id: col.id,
          title: col.title,
          taskCount: col.tasks.length
        }))}
        assignees={availableAssignees}
        tags={availableTags}
        onTaskClick={handleOpenTaskDetail}
        onViewChange={setCurrentView}
        onAssigneeFilter={setAssigneeFilter}
        onTagFilter={setTagFilter}
        onPriorityFilter={setPriorityFilter}
      />

      {/* Role Management Modal */}
      <RoleManagementModal
        isOpen={showRoleManagement}
        onClose={() => setShowRoleManagement(false)}
        facilityId={facility?.id || ''}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default FacilityView;
