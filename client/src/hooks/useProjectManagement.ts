import { useState, useEffect } from 'react';
import { projectService } from '../api/projectService';
import { taskService } from '../api/taskService';
import { useAuth } from '../context/AuthContext';
import { Column } from '../pages/Facility/types';

export const useProjectManagement = (facilityId: string, onProjectCreate?: () => void, onProjectDelete?: () => void, onProjectArchive?: () => void) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const handleStartCreateProject = () => {
    setIsCreatingProject(true);
    setNewProjectName('');
    setCreateError('');
  };

  const handleCancelCreateProject = () => {
    setIsCreatingProject(false);
    setNewProjectName('');
    setCreateError('');
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user || isCreatingLoading) return;

    setIsCreatingLoading(true);
    setCreateError('');

    try {
      await projectService.create({
        name: newProjectName.trim(),
        facilityId,
        creatorId: user.uid,
        assignees: [user.uid],
        status: 'planning',
        archived: false,
      });
      setIsCreatingProject(false);
      setNewProjectName('');
      // Reload projects and columns
      await loadProjects();
      onProjectCreate?.();
    } catch (error) {
      console.error('Error creating project:', error);
      setCreateError('Failed to create project. Please try again.');
    } finally {
      setIsCreatingLoading(false);
    }
  };

  const handleUpdateProjectName = async (projectId: string, name: string) => {
    if (!name.trim()) return;

    try {
      await projectService.update(projectId, { name: name.trim() });
      // Reload projects
      await loadProjects();
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  };

  const handleArchiveProject = async (projectId: string, projectName: string) => {
    try {
      await projectService.archive(projectId);
      // Reload projects
      await loadProjects();
      onProjectArchive?.();
      return true;
    } catch (error) {
      console.error('Error archiving project:', error);
      return false;
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    try {
      await projectService.delete(projectId);
      // Reload projects
      await loadProjects();
      onProjectDelete?.();
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  const loadProjects = async () => {
    if (!facilityId) return;
    try {
      const projectsData = await projectService.getByFacility(facilityId);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadColumnsForProject = async (projects: any[]) => {
    const newColumns: Column[] = await Promise.all(projects.map(async (project) => {
      try {
        const tasksResult = await taskService.getByProject(project.id);
        // Handle both array and paginated response formats
        const tasks = Array.isArray(tasksResult) ? tasksResult : tasksResult.tasks || [];
        return {
          id: project.id,
          title: project.name,
          tasks: tasks,
        };
      } catch (error) {
        console.error('Error loading tasks for project:', project.id, error);
        return {
          id: project.id,
          title: project.name,
          tasks: [],
        };
      }
    }));
    setColumns(newColumns);
  };

  useEffect(() => {
    if (facilityId) {
      loadProjects();
    }
  }, [facilityId]);

  const refreshTasks = async () => {
    await loadColumnsForProject(projects);
  };

  return {
    projects,
    columns,
    setColumns,
    loadProjects,
    loadColumnsForProject,
    refreshTasks,
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
    handleArchiveProject,
    handleDeleteProject,
  };
};
