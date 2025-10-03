const FirestoreService = require('../services/firestoreService');

class SavedFilterView extends FirestoreService {
  constructor(data = null) {
    super('savedFilterViews');
    if (data) {
      this.id = data.id;
      this.name = data.name;
      this.facilityId = data.facilityId;
      this.userId = data.userId;
      this.filters = data.filters || {};
      this.isDefault = data.isDefault || false;
      this.createdAt = data.createdAt;
      this.updatedAt = data.updatedAt;
    }
  }

  // Create a new saved filter view
  static async create(data) {
    try {
      const filterViewData = {
        name: data.name,
        facilityId: data.facilityId,
        userId: data.userId,
        filters: {
          searchTerm: data.filters.searchTerm || '',
          filter: data.filters.filter || 'all',
          assigneeFilter: data.filters.assigneeFilter || 'all',
          tagFilter: data.filters.tagFilter || 'all',
          priorityFilter: data.filters.priorityFilter || 'all'
        },
        isDefault: data.isDefault || false
      };

      const instance = new SavedFilterView();
      const result = await instance.create(filterViewData);
      return new SavedFilterView(result);
    } catch (error) {
      console.error('Error creating saved filter view:', error);
      throw error;
    }
  }

  // Get saved filter views for a user in a facility
  static async getByUserAndFacility(userId, facilityId) {
    try {
      const instance = new SavedFilterView();
      const conditions = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'facilityId', operator: '==', value: facilityId }
      ];
      
      const results = await instance.query(conditions);
      
      // Sort by createdAt descending
      results.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      return results.map(result => new SavedFilterView(result));
    } catch (error) {
      console.error('Error getting saved filter views:', error);
      throw error;
    }
  }

  // Get a specific saved filter view by ID
  static async getById(id) {
    try {
      const instance = new SavedFilterView();
      const result = await instance.findById(id);
      if (!result) {
        return null;
      }
      return new SavedFilterView(result);
    } catch (error) {
      console.error('Error getting saved filter view by ID:', error);
      throw error;
    }
  }

  // Update a saved filter view
  static async update(id, data) {
    try {
      const instance = new SavedFilterView();
      await instance.update(id, data);
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating saved filter view:', error);
      throw error;
    }
  }

  // Delete a saved filter view
  static async delete(id) {
    try {
      const instance = new SavedFilterView();
      await instance.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting saved filter view:', error);
      throw error;
    }
  }

  // Set a filter view as default (and unset others for the same user/facility)
  static async setAsDefault(id, userId, facilityId) {
    try {
      const instance = new SavedFilterView();
      
      // First, unset all other default filter views for this user/facility
      const conditions = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'facilityId', operator: '==', value: facilityId },
        { field: 'isDefault', operator: '==', value: true }
      ];
      
      const defaultViews = await instance.query(conditions);
      const batch = FirestoreService.batch();

      // Unset all existing default views
      defaultViews.forEach(view => {
        const docRef = FirestoreService.collection('savedFilterViews').doc(view.id);
        batch.update(docRef, { isDefault: false, updatedAt: new Date() });
      });

      // Set the specified filter view as default
      const targetDocRef = FirestoreService.collection('savedFilterViews').doc(id);
      batch.update(targetDocRef, {
        isDefault: true,
        updatedAt: new Date()
      });

      await batch.commit();
      return await this.getById(id);
    } catch (error) {
      console.error('Error setting filter view as default:', error);
      throw error;
    }
  }

  // Get default filter view for a user in a facility
  static async getDefaultByUserAndFacility(userId, facilityId) {
    try {
      const instance = new SavedFilterView();
      const conditions = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'facilityId', operator: '==', value: facilityId },
        { field: 'isDefault', operator: '==', value: true }
      ];
      
      const results = await instance.query(conditions);
      
      if (results.length === 0) {
        return null;
      }

      return new SavedFilterView(results[0]);
    } catch (error) {
      console.error('Error getting default filter view:', error);
      throw error;
    }
  }

  // Check if user has access to a filter view
  static async hasAccess(id, userId) {
    try {
      const filterView = await this.getById(id);
      if (!filterView) {
        return false;
      }
      return filterView.userId === userId;
    } catch (error) {
      console.error('Error checking filter view access:', error);
      return false;
    }
  }

  // Validate filter data
  static validateFilters(filters) {
    const validFilters = ['searchTerm', 'filter', 'assigneeFilter', 'tagFilter', 'priorityFilter'];
    const validFilterValues = {
      filter: ['all', 'todo', 'in-progress', 'review', 'done', 'completed', 'active', 'with-tasks', 'empty'],
      assigneeFilter: ['all'], // Allow any string value for assignee names
      tagFilter: ['all'], // Allow any string value for tag names
      priorityFilter: ['all', 'low', 'medium', 'high', 'urgent']
    };

    for (const [key, value] of Object.entries(filters)) {
      if (!validFilters.includes(key)) {
        throw new Error(`Invalid filter key: ${key}`);
      }

      if (key === 'searchTerm') {
        if (typeof value !== 'string') {
          throw new Error('searchTerm must be a string');
        }
      } else if (key === 'assigneeFilter' || key === 'tagFilter') {
        // Allow any string value for assignee and tag filters
        if (typeof value !== 'string') {
          throw new Error(`${key} must be a string`);
        }
      } else if (key !== 'searchTerm' && validFilterValues[key]) {
        if (!validFilterValues[key].includes(value)) {
          throw new Error(`Invalid value for ${key}: ${value}`);
        }
      }
    }

    return true;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      facilityId: this.facilityId,
      userId: this.userId,
      filters: this.filters,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = SavedFilterView;
