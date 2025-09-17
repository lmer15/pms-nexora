import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { facilityService, Facility } from '../../api/facilityService';
import { useAuth } from '../../context/AuthContext';
import Notification from '../../components/Notification';
import DeleteConfirmationModal from '../../components/DeleteProjectModal';
import ArchiveConfirmationModal from '../../components/ArchiveProjectModal';
import TaskDetailModal from '../../components/TaskDetailModal';
import FacilityHeader from './components/FacilityHeader';
import KanbanBoard from './components/KanbanBoard';
import { useProjectManagement } from '../../hooks/useProjectManagement';
import { useTaskManagement } from '../../hooks/useTaskManagement';
import { Column, Task } from './types';

const FacilityView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleOpenTaskDetail = (taskId: string) => {
    console.log('handleOpenTaskDetail called with taskId:', taskId);
    setSelectedTaskId(taskId);
    setIsTaskDetailModalOpen(true);
    console.log('Modal state after opening:', { isTaskDetailModalOpen: true, selectedTaskId: taskId });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'project') {
      setColumns(prev => prev.filter(col => col.id !== itemToDelete.id));
      const success = await deleteProjectHook(itemToDelete.id, itemToDelete.name);
      if (success) {
        setShowProjectDeleteNotification(true);
      } else {
        await loadProjects();
      }
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
    const success = await archiveProjectHook(itemToArchive.id, itemToArchive.name);
    if (success) {
      setShowProjectArchiveNotification(true);
    } else {
      // If archiving failed, reload to restore the column
      await loadProjects();
    }
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

  useEffect(() => {
    if (id) {
      loadFacility();
    }
  }, [id]);

  const loadFacility = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await facilityService.getById(id);
      setFacility(data);
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
  } = useProjectManagement(id || '', () => setShowProjectCreateNotification(true), () => setShowProjectDeleteNotification(true), () => setShowProjectArchiveNotification(true));

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
    handleDeleteTask,
    handleDragEnd,
  } = useTaskManagement(columns, setColumns, () => setShowNotification(true));

  // Load projects on mount and when id changes
  useEffect(() => {
    if (id) {
      loadProjects();
    }
  }, [id]);

  // Update columns when projects change
  useEffect(() => {
    if (projects.length > 0) {
      loadColumnsForProject(projects);
    }
  }, [projects]);

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

    window.addEventListener('taskUpdated', handleTaskUpdated as EventListener);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated as EventListener);
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
    <div className="bg-neutral-light dark:bg-gray-900 flex flex-col overflow-hidden h-full">
      <FacilityHeader
        facility={facility}
        projectsCount={projects.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        isDarkMode={isDarkMode}
      />

      <KanbanBoard
        columns={columns}
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
        handleDragEnd={handleDragEnd}
        handleCreateTask={handleCreateTask}
        handleSaveNewTask={handleSaveNewTask}
        handleCancelNewTask={handleCancelNewTask}
        handleDeleteTask={handleDeleteTask}
        handleSaveTask={handleSaveTask}
        handleCancelEdit={handleCancelEdit}
        handleArchiveProject={handleArchiveProject}
        handleDeleteProject={handleDeleteProject}
        handleUpdateProjectName={handleUpdateProjectName}
        handleOpenTaskDetail={handleOpenTaskDetail}
      />

      {showNotification && (
        <Notification
          message="Task created successfully!"
          onClose={() => setShowNotification(false)}
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
    </div>
  );
};

export default FacilityView;
