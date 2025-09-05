import api from './api';

export interface Facility {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
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
  create: async (facilityData: Omit<Facility, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<Facility> => {
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
};
