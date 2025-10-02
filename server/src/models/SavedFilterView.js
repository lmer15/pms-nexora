const FirestoreService = require('../services/firestoreService');

class SavedFilterView {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.facilityId = data.facilityId;
    this.userId = data.userId;
    this.filters = data.filters || {};
    this.isDefault = data.isDefault || false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
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
        isDefault: data.isDefault || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await FirestoreService.create('savedFilterViews', filterViewData);
      return new SavedFilterView({ id: docRef.id, ...filterViewData });
    } catch (error) {
      console.error('Error creating saved filter view:', error);
      throw error;
    }
  }

  // Get saved filter views for a user in a facility
  static async getByUserAndFacility(userId, facilityId) {
    try {
      const query = FirestoreService.collection('savedFilterViews')
        .where('userId', '==', userId)
        .where('facilityId', '==', facilityId)
        .orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      const filterViews = [];

      snapshot.forEach(doc => {
        filterViews.push(new SavedFilterView({ id: doc.id, ...doc.data() }));
      });

      return filterViews;
    } catch (error) {
      console.error('Error getting saved filter views:', error);
      throw error;
    }
  }

  // Get a specific saved filter view by ID
  static async getById(id) {
    try {
      const doc = await FirestoreService.get('savedFilterViews', id);
      if (!doc.exists) {
        return null;
      }
      return new SavedFilterView({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error getting saved filter view by ID:', error);
      throw error;
    }
  }

  // Update a saved filter view
  static async update(id, data) {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await FirestoreService.update('savedFilterViews', id, updateData);
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating saved filter view:', error);
      throw error;
    }
  }

  // Delete a saved filter view
  static async delete(id) {
    try {
      await FirestoreService.delete('savedFilterViews', id);
      return true;
    } catch (error) {
      console.error('Error deleting saved filter view:', error);
      throw error;
    }
  }

  // Set a filter view as default (and unset others for the same user/facility)
  static async setAsDefault(id, userId, facilityId) {
    try {
      // First, unset all other default filter views for this user/facility
      const query = FirestoreService.collection('savedFilterViews')
        .where('userId', '==', userId)
        .where('facilityId', '==', facilityId)
        .where('isDefault', '==', true);

      const snapshot = await query.get();
      const batch = FirestoreService.batch();

      snapshot.forEach(doc => {
        batch.update(doc.ref, { isDefault: false, updatedAt: new Date() });
      });

      // Set the specified filter view as default
      batch.update(FirestoreService.collection('savedFilterViews').doc(id), {
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
      const query = FirestoreService.collection('savedFilterViews')
        .where('userId', '==', userId)
        .where('facilityId', '==', facilityId)
        .where('isDefault', '==', true)
        .limit(1);

      const snapshot = await query.get();
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return new SavedFilterView({ id: doc.id, ...doc.data() });
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
      filter: ['all', 'todo', 'in-progress', 'review', 'done'],
      assigneeFilter: ['all'], // Will be populated with actual assignee names
      tagFilter: ['all'], // Will be populated with actual tags
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
