const SavedFilterView = require('../models/SavedFilterView');

// Get all saved filter views for a user in a facility
exports.getSavedFilterViews = async (req, res) => {
  try {
    const userId = req.userId;
    const { facilityId } = req.params;

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const filterViews = await SavedFilterView.getByUserAndFacility(userId, facilityId);
    
    res.json({
      success: true,
      data: filterViews.map(view => view.toJSON())
    });
  } catch (error) {
    console.error('Error getting saved filter views:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved filter views',
      error: error.message
    });
  }
};

// Get a specific saved filter view by ID
exports.getSavedFilterView = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const filterView = await SavedFilterView.getById(id);
    
    if (!filterView) {
      return res.status(404).json({
        success: false,
        message: 'Saved filter view not found'
      });
    }

    // Check if user has access to this filter view
    if (filterView.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: filterView.toJSON()
    });
  } catch (error) {
    console.error('Error getting saved filter view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved filter view',
      error: error.message
    });
  }
};

// Create a new saved filter view
exports.createSavedFilterView = async (req, res) => {
  try {
    const userId = req.userId;
    const { facilityId, name, filters, isDefault } = req.body;

    // Validation
    if (!facilityId || !name || !filters) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID, name, and filters are required'
      });
    }

    if (name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Filter view name cannot be empty'
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Filter view name cannot exceed 50 characters'
      });
    }

    // Validate filters
    try {
      SavedFilterView.validateFilters(filters);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Check if a filter view with the same name already exists for this user/facility
    const existingViews = await SavedFilterView.getByUserAndFacility(userId, facilityId);
    const nameExists = existingViews.some(view => 
      view.name.toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      return res.status(409).json({
        success: false,
        message: 'A filter view with this name already exists'
      });
    }

    const filterViewData = {
      name: name.trim(),
      facilityId,
      userId,
      filters,
      isDefault: isDefault || false
    };

    const filterView = await SavedFilterView.create(filterViewData);
    
    res.status(201).json({
      success: true,
      data: filterView.toJSON(),
      message: 'Filter view saved successfully'
    });
  } catch (error) {
    console.error('Error creating saved filter view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create saved filter view',
      error: error.message
    });
  }
};

// Update a saved filter view
exports.updateSavedFilterView = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, filters, isDefault } = req.body;

    // Check if filter view exists and user has access
    const existingView = await SavedFilterView.getById(id);
    if (!existingView) {
      return res.status(404).json({
        success: false,
        message: 'Saved filter view not found'
      });
    }

    if (existingView.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validation
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Filter view name cannot be empty'
        });
      }

      if (name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Filter view name cannot exceed 50 characters'
        });
      }

      // Check if a filter view with the same name already exists (excluding current one)
      const existingViews = await SavedFilterView.getByUserAndFacility(userId, existingView.facilityId);
      const nameExists = existingViews.some(view => 
        view.id !== id && view.name.toLowerCase() === name.toLowerCase()
      );

      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: 'A filter view with this name already exists'
        });
      }
    }

    if (filters) {
      try {
        SavedFilterView.validateFilters(filters);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (filters !== undefined) updateData.filters = filters;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedView = await SavedFilterView.update(id, updateData);
    
    res.json({
      success: true,
      data: updatedView.toJSON(),
      message: 'Filter view updated successfully'
    });
  } catch (error) {
    console.error('Error updating saved filter view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update saved filter view',
      error: error.message
    });
  }
};

// Delete a saved filter view
exports.deleteSavedFilterView = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if filter view exists and user has access
    const existingView = await SavedFilterView.getById(id);
    if (!existingView) {
      return res.status(404).json({
        success: false,
        message: 'Saved filter view not found'
      });
    }

    if (existingView.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await SavedFilterView.delete(id);
    
    res.json({
      success: true,
      message: 'Filter view deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved filter view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete saved filter view',
      error: error.message
    });
  }
};

// Set a filter view as default
exports.setAsDefault = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Check if filter view exists and user has access
    const existingView = await SavedFilterView.getById(id);
    if (!existingView) {
      return res.status(404).json({
        success: false,
        message: 'Saved filter view not found'
      });
    }

    if (existingView.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedView = await SavedFilterView.setAsDefault(id, userId, existingView.facilityId);
    
    res.json({
      success: true,
      data: updatedView.toJSON(),
      message: 'Filter view set as default successfully'
    });
  } catch (error) {
    console.error('Error setting filter view as default:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set filter view as default',
      error: error.message
    });
  }
};

// Get default filter view for a user in a facility
exports.getDefaultFilterView = async (req, res) => {
  try {
    const userId = req.userId;
    const { facilityId } = req.params;

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: 'Facility ID is required'
      });
    }

    const defaultView = await SavedFilterView.getDefaultByUserAndFacility(userId, facilityId);
    
    res.json({
      success: true,
      data: defaultView ? defaultView.toJSON() : null
    });
  } catch (error) {
    console.error('Error getting default filter view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get default filter view',
      error: error.message
    });
  }
};
