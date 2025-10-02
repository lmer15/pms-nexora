import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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
  private baseURL = `${API_BASE_URL}/savedFilterViews`;

  // Get all saved filter views for a user in a facility
  async getByFacility(facilityId: string): Promise<SavedFilterView[]> {
    try {
      const response = await axios.get(`${this.baseURL}/facility/${facilityId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching saved filter views:', error);
      throw error;
    }
  }

  // Get a specific saved filter view by ID
  async getById(id: string): Promise<SavedFilterView> {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching saved filter view:', error);
      throw error;
    }
  }

  // Get default filter view for a user in a facility
  async getDefaultByFacility(facilityId: string): Promise<SavedFilterView | null> {
    try {
      const response = await axios.get(`${this.baseURL}/facility/${facilityId}/default`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching default filter view:', error);
      throw error;
    }
  }

  // Create a new saved filter view
  async create(data: CreateSavedFilterViewData): Promise<SavedFilterView> {
    try {
      const response = await axios.post(this.baseURL, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating saved filter view:', error);
      throw error;
    }
  }

  // Update a saved filter view
  async update(id: string, data: UpdateSavedFilterViewData): Promise<SavedFilterView> {
    try {
      const response = await axios.put(`${this.baseURL}/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating saved filter view:', error);
      throw error;
    }
  }

  // Set a filter view as default
  async setAsDefault(id: string): Promise<SavedFilterView> {
    try {
      const response = await axios.patch(`${this.baseURL}/${id}/default`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error setting filter view as default:', error);
      throw error;
    }
  }

  // Delete a saved filter view
  async delete(id: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
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
