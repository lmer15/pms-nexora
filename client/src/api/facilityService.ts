import api from './api';
import cacheService from '../services/cacheService';

export interface Facility {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  projectCount?: number;
  taskCount?: number;
}

export interface FacilityMember {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  joinedAt: string;
  isOwner: boolean;
}

export interface FacilityStats {
  memberCount: number;
  projectCount: number;
  taskCount: number;
  completedTaskCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  completionPercentage: number;
  nearestDueDate: string | null;
}

export const facilityService = {
  // Get all facilities
  getAll: async (): Promise<Facility[]> => {
    const response = await api.get('/facilities');
    return response.data;
  },

  // Get facility by ID
  getById: async (id: string): Promise<Facility> => {
    // Check cache first
    const cached = cacheService.getFacility(id) as Facility | null;
    if (cached) {
      return cached;
    }

    const response = await api.get(`/facilities/${id}`);
    const facility = response.data;
    
    // Cache the result
    cacheService.setFacility(id, facility);
    
    return facility;
  },

  // Create new facility
  create: async (facilityData: { name: string; description?: string; status?: 'active' | 'inactive' | 'archived' }): Promise<Facility> => {
    const response = await api.post('/facilities', facilityData);
    return response.data;
  },

  // Update facility
  update: async (id: string, facilityData: Partial<Facility>): Promise<Facility> => {
    const response = await api.put(`/facilities/${id}`, facilityData);
    return response.data;
  },

  // Delete facility
  delete: async (id: string): Promise<void> => {
    await api.delete(`/facilities/${id}`);
  },

  // Get facility members
  getFacilityMembers: async (facilityId: string): Promise<FacilityMember[]> => {
    const response = await api.get(`/facilities/${facilityId}/members`);
    return response.data.members;
  },

  // Get facility statistics
  getFacilityStats: async (facilityId: string): Promise<FacilityStats> => {
    // Check cache first
    const cached = cacheService.getFacilityStats(facilityId) as FacilityStats | null;
    if (cached) {
      return cached;
    }

    const response = await api.get(`/facilities/${facilityId}/stats`);
    const stats = response.data;
    
    // Cache the result
    cacheService.setFacilityStats(facilityId, stats);
    
    return stats;
  },

  getFacilityTags: async (facilityId: string): Promise<string[]> => {
    const response = await api.get(`/facilities/${facilityId}/tags`);
    return response.data;
  },

  // Update facility status
  updateStatus: async (facilityId: string, status: 'active' | 'inactive' | 'archived'): Promise<Facility> => {
    const response = await api.put(`/facilities/${facilityId}`, { status });
    return response.data;
  },

  // Optimized method to get facility with all data in one request
  getWithData: async (id: string, includeTasks: boolean = true): Promise<{
    facility: Facility;
    projects: Array<{
      id: string;
      name: string;
      description?: string;
      facilityId: string;
      status: string;
      archived: boolean;
      createdAt: string;
      updatedAt: string;
      tasks: Array<{
        id: string;
        title: string;
        description?: string;
        status: string;
        priority: string;
        assigneeId?: string;
        assigneeName?: string;
        assigneeProfilePicture?: string;
        projectId: string;
        dueDate?: string;
        tags: string[];
        progress: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>;
  }> => {
    const response = await api.get(`/facilities/${id}/data?includeTasks=${includeTasks}`);
    return response.data;
  },
};
