import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityService, Facility, FacilityStats } from '../../api/facilityService';
import { useAuth } from '../../context/AuthContext';
import { useCurrentFacility } from '../../context/CurrentFacilityContext';
import { useFacilityRefresh } from '../../context/FacilityRefreshContext';
import Notification from '../../components/Notification';
import DeleteConfirmationModal from '../../components/DeleteProjectModal';
import ArchiveConfirmationModal from '../../components/ArchiveProjectModal';
import TaskDetailDrawer from '../../components/TaskDetailDrawer';
import SlimFacilityHeader from './components/SlimFacilityHeader';
import CommandPalette from '../../components/CommandPalette';
import KanbanBoard from './components/KanbanBoard';
import ListView from './components/ListView';
import CalendarView from './components/CalendarView';
import TimelineView from './components/TimelineView';
import { useOptimizedProjectManagement } from '../../hooks/useOptimizedProjectManagement';
import { useTaskManagement } from '../../hooks/useTaskManagement';
import { taskService } from '../../api/taskService';
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
  const [isTaskDetailDrawerOpen, setIsTaskDetailDrawerOpen] = useState(false);
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

  const handleOpenTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailDrawerOpen(true);
  };

  // Wrapper function to show confirmation modal before deleting task
  const handleTaskDeleteClick = (taskId: string, taskTitle: string, columnId: string) => {
    setItemToDelete({ id: taskId, name: taskTitle, type: 'task', columnId });
    setIsDeleteModalOpen(true);
  };


  const handleTaskMove = async (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => {
    console.log('handleTaskMove called:', { taskId, fromColumnId, toColumnId, newIndex });
    
    // Update the local state immediately for better UX (optimistic update)
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      
      // Find source and target columns
      const sourceColumnIndex = newColumns.findIndex(col => col.id === fromColumnId);
      const targetColumnIndex = newColumns.findIndex(col => col.id === toColumnId);
      
      console.log('Column indices:', { sourceColumnIndex, targetColumnIndex });
      
      if (sourceColumnIndex === -1 || targetColumnIndex === -1) {
        console.log('Column not found, returning previous columns');
        return prevColumns;
      }
      
      // Find the task in the source column
      const sourceColumn = newColumns[sourceColumnIndex];
      const taskIndex = sourceColumn.tasks.findIndex(task => task.id === taskId);
      
      console.log('Task index in source column:', taskIndex);
      
      if (taskIndex === -1) {
        console.log('Task not found in source column');
        return prevColumns;
      }
      
      // Remove task from source column
      const [movedTask] = sourceColumn.tasks.splice(taskIndex, 1);
      
      // Update the task's projectId
      const updatedTask = { ...movedTask, projectId: toColumnId };
      
      // Add task to target column at the specified index
      const targetColumn = newColumns[targetColumnIndex];
      targetColumn.tasks.splice(newIndex, 0, updatedTask);
      
      console.log('Task moved locally, updating backend...');
      return newColumns;
    });

    // Update the task's projectId in the backend
    try {
      console.log('Calling taskService.update with:', { taskId, projectId: toColumnId });
      const updatedTask = await taskService.update(taskId, { projectId: toColumnId });
      console.log('Backend update successful:', updatedTask);
      
      // Manually invalidate cache for both source and target projects
      // This ensures fresh data is loaded when returning to the facility view
      cacheService.invalidateProject(fromColumnId);
      cacheService.invalidateProject(toColumnId);
      console.log('Cache invalidated for both projects:', { fromColumnId, toColumnId });
      
      // Show success notification
      setShowTaskMoveNotification(true);
    } catch (error) {
      console.error('Failed to move task:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Revert the local state change on error
      setColumns(prevColumns => {
        // Reload columns from server to get the correct state
        loadColumnsForProject(projects);
        return prevColumns;
      });
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

  // Enhanced task deletion with fallback refresh
  const handleDeleteTask = async (taskId: string, taskTitle: string, columnId: string) => {
    const success = await originalHandleDeleteTask(taskId, taskTitle, columnId);
    
    if (success) {
      // Add a small delay and then refresh to ensure UI is updated
      setTimeout(async () => {
        await refreshTasks();
      }, 1000);
    } else {
      // If deletion failed, refresh the tasks to get the current state
      await refreshTasks();
    }
    
    return success;
  };

  // Load facility data on mount and when id changes using optimized method
  useEffect(() => {
    if (id) {
      loadFacilityData();
    }
  }, [id]);

  // Collect available assignees from facility members
  const [availableAssignees, setAvailableAssignees] = useState<Array<{id: string, name: string}>>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Handle task updates
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskService.update(taskId, updates);
      // Refresh tasks to get updated data
      await refreshTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Fetch facility members for assignee filter
  useEffect(() => {
    const fetchFacilityMembers = async () => {
      if (!facility?.id) return;
      
      try {
        const membersData = await facilityService.getFacilityMembers(facility.id);
        const assignees = membersData.map(member => ({
          id: member.id,
          name: member.name
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
            statusMatches = true;
            break;
          case 'completed':
            statusMatches = false;
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
          // Match by assignee name or assignee ID
          return task.assigneeName === assigneeFilter || 
                 task.assignee === assigneeFilter ||
                 (task.assignee && availableAssignees.some(a => a.id === task.assignee && a.name === assigneeFilter));
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
    const handleTaskUpdated = (event: CustomEvent) => {
      const updatedTask = event.detail;
      setColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
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

    window.addEventListener('taskUpdated', handleTaskUpdated as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeleted as EventListener);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeleted as EventListener);
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
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        isDarkMode={isDarkMode}
        totalTasks={facilityStats?.taskCount || 0}
        completedTasks={facilityStats?.completedTaskCount || 0}
        overdueTasks={facilityStats?.overdueTaskCount || 0}
        currentView={currentView}
        onViewChange={setCurrentView}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        availableAssignees={availableAssignees}
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
      />


      {/* View Content */}
      <div className="flex-1">
        {currentView === 'kanban' && (
          <div className="h-full">
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
            handleOpenTaskDetail={handleOpenTaskDetail}
            onTaskMove={handleTaskMove}
            facilityId={id}
          />
          </div>
        )}
        
        {currentView === 'list' && (
          <div className="overflow-auto">
            <ListView
            columns={filteredColumns}
            isDarkMode={isDarkMode}
            onTaskClick={handleOpenTaskDetail}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDeleteClick}
            onTaskMove={handleTaskMove}
          />
          </div>
        )}
        
        {currentView === 'calendar' && (
          <CalendarView
            columns={filteredColumns}
            isDarkMode={isDarkMode}
            onTaskClick={handleOpenTaskDetail}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDeleteClick}
          />
        )}
        
        {currentView === 'timeline' && (
          <TimelineView
            columns={filteredColumns}
            isDarkMode={isDarkMode}
            onTaskClick={handleOpenTaskDetail}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDeleteClick}
          />
        )}
      </div>

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
      {isTaskDetailDrawerOpen && selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          isOpen={isTaskDetailDrawerOpen}
          onClose={() => {
            setIsTaskDetailDrawerOpen(false);
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
    </div>
  );
};

export default FacilityView;
