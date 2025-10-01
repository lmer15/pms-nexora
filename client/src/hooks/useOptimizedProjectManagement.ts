import { useState, useEffect } from 'react';
import { facilityService } from '../api/facilityService';
import { projectService } from '../api/projectService';
import { taskService } from '../api/taskService';
import { useAuth } from '../context/AuthContext';
import { Column } from '../pages/Facility/types';

export const useOptimizedProjectManagement = (
  facilityId: string, 
  onProjectCreate?: () => void, 
  onProjectDelete?: () => void, 
  onProjectArchive?: () => void
) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (!newProjectName.trim() || isCreatingLoading) return;
    
    setIsCreatingLoading(true);
    setCreateError('');
    
    try {
      const newProject = await projectService.create({
        name: newProjectName.trim(),
        facilityId: facilityId,
        description: '',
        status: 'planning',
        creatorId: user?.uid || '',
        assignees: [],
        archived: false
      });
      
      setProjects(prev => [...prev, newProject]);
      
      // Add new column for the project
      setColumns(prev => [...prev, {
        id: newProject.id,
        title: newProject.name,
        tasks: []
      }]);
      
      setNewProjectName('');
      setIsCreatingProject(false);
      onProjectCreate?.();
    } catch (error: any) {
      console.error('Error creating project:', error);
      setCreateError(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsCreatingLoading(false);
    }
  };

  const handleUpdateProjectName = async (projectId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      console.log('Updating project name:', { projectId, newName });
      const updatedProject = await projectService.update(projectId, { name: newName.trim() });
      console.log('Updated project received:', updatedProject);
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? updatedProject : p
      ));
      
      setColumns(prev => prev.map(col => 
        col.id === projectId ? { ...col, title: newName.trim() } : col
      ));
      
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch (error) {
      console.error('Error updating project name:', error);
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await projectService.archive(projectId);
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setColumns(prev => prev.filter(col => col.id !== projectId));
      
      onProjectArchive?.();
    } catch (error) {
      console.error('Error archiving project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await projectService.delete(projectId);
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setColumns(prev => prev.filter(col => col.id !== projectId));
      
      onProjectDelete?.();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Optimized loading function that uses the new endpoint
  const loadFacilityData = async () => {
    if (!facilityId) return;
    
    setIsLoading(true);
    try {
      // Use the optimized endpoint to get all data in one request
      const data = await facilityService.getWithData(facilityId, true);
      
      setProjects(data.projects);
      
      // Convert projects to columns format
      const newColumns: Column[] = data.projects.map(project => ({
        id: project.id,
        title: project.name,
        tasks: (project.tasks || []).map(task => ({
          ...task,
          creatorId: (task as any).creatorId || task.assigneeId || '', // Add missing creatorId field
          status: task.status as 'todo' | 'in-progress' | 'review' | 'done', // Cast status to correct type
          priority: task.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined // Cast priority to correct type
        }))
      }));
      
      setColumns(newColumns);
    } catch (error) {
      console.error('Error loading facility data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback method for individual project loading (if needed)
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

  const refreshTasks = async () => {
    await loadFacilityData();
  };

  useEffect(() => {
    if (facilityId) {
      loadFacilityData();
    }
  }, [facilityId]);

  return {
    projects,
    columns,
    setColumns,
    loadProjects,
    loadColumnsForProject,
    loadFacilityData, // New optimized method
    refreshTasks,
    isLoading,
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
