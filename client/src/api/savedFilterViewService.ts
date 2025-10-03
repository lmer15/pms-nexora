import api from './api';

export interface SavedFilterView {
  id: string;
  name: string;
  facilityId: string;
  userId: string;
  filters: {
    searchTerm: string;
    filter: string;
    assigneeFilter: string;
    tagFilter: string;
    priorityFilter: string;
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedFilterViewData {
  name: string;
  facilityId: string;
  filters: {
    searchTerm: string;
    filter: string;
    assigneeFilter: string;
    tagFilter: string;
    priorityFilter: string;
  };
  isDefault?: boolean;
}

export interface UpdateSavedFilterViewData {
  name?: string;
  filters?: {
    searchTerm: string;
    filter: string;
    assigneeFilter: string;
    tagFilter: string;
    priorityFilter: string;
  };
  isDefault?: boolean;
}

class SavedFilterViewService {
  private baseURL = '/savedFilterViews';

  // Get all saved filter views for a user in a facility
  async getByFacility(facilityId: string): Promise<SavedFilterView[]> {
    try {
      const response = await api.get(`${this.baseURL}/facility/${facilityId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching saved filter views:', error);
      throw error;
    }
  }

  // Get a specific saved filter view by ID
  async getById(id: string): Promise<SavedFilterView> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching saved filter view:', error);
      throw error;
    }
  }

  // Get default filter view for a user in a facility
  async getDefaultByFacility(facilityId: string): Promise<SavedFilterView | null> {
    try {
      const response = await api.get(`${this.baseURL}/facility/${facilityId}/default`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching default filter view:', error);
      throw error;
    }
  }

  // Create a new saved filter view
  async create(data: CreateSavedFilterViewData): Promise<SavedFilterView> {
    try {
      const response = await api.post(this.baseURL, data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating saved filter view:', error);
      throw error;
    }
  }

  // Update a saved filter view
  async update(id: string, data: UpdateSavedFilterViewData): Promise<SavedFilterView> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating saved filter view:', error);
      throw error;
    }
  }

  // Set a filter view as default
  async setAsDefault(id: string): Promise<SavedFilterView> {
    try {
      const response = await api.patch(`${this.baseURL}/${id}/default`, {});
      return response.data.data;
    } catch (error) {
      console.error('Error setting filter view as default:', error);
      throw error;
    }
  }

  // Delete a saved filter view
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
    } catch (error) {
      console.error('Error deleting saved filter view:', error);
      throw error;
    }
  }

  // Save current filters as a new view
  async saveCurrentFilters(
    facilityId: string, 
    name: string, 
    filters: SavedFilterView['filters'],
    isDefault: boolean = false
  ): Promise<SavedFilterView> {
    return this.create({
      name,
      facilityId,
      filters,
      isDefault
    });
  }

  // Apply a saved filter view (returns the filters object)
  async applyFilterView(id: string): Promise<SavedFilterView['filters']> {
    const filterView = await this.getById(id);
    return filterView.filters;
  }
}

export const savedFilterViewService = new SavedFilterViewService();
