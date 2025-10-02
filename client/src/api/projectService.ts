import api from './api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  facilityId: string;
  creatorId: string;
  assignees: string[];
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'critical';
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const projectService = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  // Get project by ID
  getById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Get projects by facility
  getByFacility: async (facilityId: string): Promise<Project[]> => {
    const response = await api.get(`/projects/facility/${facilityId}`);
    return response.data;
  },

  // Create new project
  create: async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Update project
  update: async (id: string, projectData: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project
  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Archive project
  archive: async (id: string): Promise<Project> => {
    const response = await api.put(`/projects/${id}/archive`);
    return response.data;
  },
};
