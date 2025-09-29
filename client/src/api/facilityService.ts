import api from './api';

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
}

export const facilityService = {
  // Get all facilities
  getAll: async (): Promise<Facility[]> => {
    const response = await api.get('/facilities');
    return response.data;
  },

  // Get facility by ID
  getById: async (id: string): Promise<Facility> => {
    const response = await api.get(`/facilities/${id}`);
    return response.data;
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
    const response = await api.get(`/facilities/${facilityId}/stats`);
    return response.data;
  },

  // Update facility status
  updateStatus: async (facilityId: string, status: 'active' | 'inactive' | 'archived'): Promise<Facility> => {
    const response = await api.put(`/facilities/${facilityId}`, { status });
    return response.data;
  },
};
