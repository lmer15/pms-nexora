import api from './api';
import cacheService from '../services/cacheService';
import jwtUtils from '../utils/jwtUtils';

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
  getById: async (id: string, forceRefresh: boolean = false): Promise<Facility> => {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = cacheService.getFacility(id) as Facility | null;
      if (cached) {
        return cached;
      }
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

  // Get current user's role in facility (more efficient than fetching all members)
  getUserRole: async (facilityId: string): Promise<{ role: string; isOwner: boolean }> => {
    // Check cache first
    const cacheKey = `user_role_${facilityId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      const parsedData = JSON.parse(cached);
      const cacheTime = parsedData.timestamp;
      const now = Date.now();
      
      // Use cache if less than 1 minute old
      if (now - cacheTime < 60000) {
        return parsedData.data;
      }
    }
    
    try {
      const response = await api.get(`/facilities/${facilityId}/user-role`);
      
      // Cache the response for 1 minute
      const cacheData = {
        data: response.data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      return response.data;
    } catch (error: any) {
      // If the endpoint doesn't exist, fall back to fetching all members
      console.log('User role endpoint not available, falling back to members list');
      const members = await facilityService.getFacilityMembers(facilityId);
      const currentUserId = jwtUtils.getCurrentUserId();
      
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }
      
      const currentUser = members.find(member => member.id === currentUserId);
      
      if (currentUser) {
        return { role: currentUser.role, isOwner: currentUser.isOwner };
      }
      
      throw new Error('User not found in facility');
    }
  },

  // Clear user role cache
  clearUserRoleCache: (facilityId: string): void => {
    const cacheKey = `user_role_${facilityId}`;
    localStorage.removeItem(cacheKey);
    console.log('Cleared user role cache for facility:', facilityId);
  },

  // Clear all facility-related localStorage cache
  clearFacilityLocalStorageCache: (facilityId: string): void => {
    const keysToRemove = [
      `user_role_${facilityId}`,
      `facility_members_${facilityId}`,
      `facility_data_${facilityId}_true`,
      `facility_data_${facilityId}_false`
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
  },

  // Get facility statistics
  getFacilityStats: async (facilityId: string, forceRefresh: boolean = false): Promise<FacilityStats> => {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = cacheService.getFacilityStats(facilityId) as FacilityStats | null;
      if (cached) {
        return cached;
      }
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
    // Check cache first
    const cacheKey = `facility_data_${id}_${includeTasks}`;
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData && (cachedData as any).facility && (cachedData as any).projects) {
      return cachedData as any;
    }
    
    try {
      const response = await api.get(`/facilities/${id}/data?includeTasks=${includeTasks}`);
      
      // Cache the response for 30 seconds
      cacheService.set(cacheKey, response.data, 30000);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching facility data:', error);
      throw error;
    }
  },
};
