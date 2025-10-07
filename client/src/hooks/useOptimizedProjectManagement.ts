import { useState, useEffect, useRef, useCallback } from 'react';
import { facilityService } from '../api/facilityService';
import { projectService } from '../api/projectService';
import { taskService } from '../api/taskService';
import { useAuth } from '../context/AuthContext';
import { useFacilityProjectData } from '../context/FacilityProjectDataContext';
import { Column } from '../pages/Facility/types';
import cacheService from '../services/cacheService';

export const useOptimizedProjectManagement = (
  facilityId: string, 
  onProjectCreate?: () => void, 
  onProjectDelete?: () => void, 
  onProjectArchive?: () => void
) => {
  const { user } = useAuth();
  const { getFacilityData, setFacilityData, updateFacilityProjects, updateFacilityColumns } = useFacilityProjectData();
  
  // Initialize state from persistent context
  const existingData = getFacilityData(facilityId);
  const [projects, setProjects] = useState<any[]>(existingData?.projects || []);
  const [columns, setColumns] = useState<Column[]>(existingData?.columns || []);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use refs to track when we're updating from context vs user actions
  const isUpdatingFromContext = useRef(false);
  const lastSyncedData = useRef<{ projects: any[]; columns: Column[] } | null>(null);
  const projectsRef = useRef<any[]>([]);
  const columnsRef = useRef<Column[]>([]);



  // Helper function to sync data to context (called manually when needed)
  const syncToContext = useCallback((projectsToSync?: any[], columnsToSync?: Column[]) => {
    const projs = projectsToSync || projectsRef.current;
    const cols = columnsToSync || columnsRef.current;
    
    if (facilityId && (projs.length > 0 || cols.length > 0)) {
      setFacilityData(facilityId, projs, cols);
      lastSyncedData.current = { projects: projs, columns: cols };
    }
  }, [facilityId, setFacilityData]);

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
      
      // Sync to context after state changes
      setTimeout(syncToContext, 0);
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
      const updatedProject = await projectService.update(projectId, { name: newName.trim() });
      
      setProjects(prev => prev.map(p => 
        p.id === projectId ? updatedProject : p
      ));
      
      setColumns(prev => prev.map(col => 
        col.id === projectId ? { ...col, title: newName.trim() } : col
      ));
      
      setEditingProjectId(null);
      setEditingProjectName('');
      
      // Sync to context after state changes
      setTimeout(syncToContext, 0);
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
      
      // Sync to context after state changes
      setTimeout(syncToContext, 0);
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
      
      // Sync to context after state changes
      setTimeout(syncToContext, 0);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Optimized loading function that uses the new endpoint
  const loadFacilityData = useCallback(async (forceRefresh: boolean = false) => {
    if (!facilityId) return;
    
    setIsLoading(true);
    try {
      // Only clear cache if explicitly requested or if we don't have existing data
      if (forceRefresh || (projects.length === 0 && columns.length === 0)) {
        cacheService.clearFacilityCache(facilityId);
      }
      
      const data = await facilityService.getWithData(facilityId, true);
      
      setProjects(data.projects);

      const newColumns: Column[] = data.projects.map(project => ({
        id: project.id,
        title: project.name,
        _projectStatus: project.status,
        status: project.status, // Add the actual status property
        tasks: (project.tasks || []).map(task => ({
          ...task,
          creatorId: (task as any).creatorId || task.assigneeId || '', 
          status: task.status as 'todo' | 'in-progress' | 'review' | 'done', 
          priority: task.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined, 
          assigneeName: (task as any).assigneeName,
          assigneeProfilePicture: (task as any).assigneeProfilePicture
        }))
      }));
      
      setColumns(newColumns);
      
      // Sync to context after loading data
      setTimeout(syncToContext, 0);
    } catch (error) {
      console.error('Error loading facility data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, setFacilityData]);


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
          _projectStatus: project.status, // Include project status in column
          status: project.status, // Also include as direct status field
          tasks: tasks.map(task => ({
            ...task,
            // Ensure assignee information is preserved
            assigneeName: (task as any).assigneeName,
            assigneeProfilePicture: (task as any).assigneeProfilePicture
          })),
        };
      } catch (error) {
        console.error('Error loading tasks for project:', project.id, error);
        return {
          id: project.id,
          title: project.name,
          _projectStatus: project.status, // Include project status in column
          status: project.status, // Also include as direct status field
          tasks: [],
        };
      }
    }));
    setColumns(newColumns);
  };

  const refreshTasks = async (forceRefresh: boolean = false) => {
    await loadFacilityData(forceRefresh);
  };

  // All useEffect hooks must be at the end to maintain consistent hook order
  // Update refs when state changes
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  // Auto-sync state changes to context (but avoid circular updates)
  useEffect(() => {
    if (facilityId && !isUpdatingFromContext.current && (projects.length > 0 || columns.length > 0)) {
      // Only sync if the data is actually different from what we last synced
      const hasChanged = !lastSyncedData.current || 
        lastSyncedData.current.projects !== projects ||
        lastSyncedData.current.columns !== columns;
      
      if (hasChanged) {
        setFacilityData(facilityId, projects, columns);
        lastSyncedData.current = { projects, columns };
      }
    }
  }, [facilityId, projects, columns, setFacilityData]);

  // Initialize from persistent context when facilityId changes
  useEffect(() => {
    if (facilityId) {
      const existingData = getFacilityData(facilityId);
      
      if (existingData) {
        // Load from context if data exists
        isUpdatingFromContext.current = true;
        setProjects(existingData.projects);
        setColumns(existingData.columns);
        lastSyncedData.current = { projects: existingData.projects, columns: existingData.columns };
        isUpdatingFromContext.current = false;
      } else {
        // Clear local state first to avoid showing stale data
        isUpdatingFromContext.current = true;
        setProjects([]);
        setColumns([]);
        lastSyncedData.current = null;
        isUpdatingFromContext.current = false;
        
        // Then load from server
        loadFacilityData();
      }
    }
  }, [facilityId, loadFacilityData]);

  return {
    projects,
    setProjects,
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
