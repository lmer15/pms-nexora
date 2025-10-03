const express = require('express');
const router = express.Router();
const {
  getSavedFilterViews,
  getSavedFilterView,
  createSavedFilterView,
  updateSavedFilterView,
  deleteSavedFilterView,
  setAsDefault,
  getDefaultFilterView
} = require('../controllers/savedFilterViewController');
const authenticateToken = require('../middleware/authMiddleware');
const { validateSavedFilterView, validateSavedFilterViewUpdate } = require('../middleware/validationMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all saved filter views for a user in a facility
router.get('/facility/:facilityId', getSavedFilterViews);

// Get default filter view for a user in a facility
router.get('/facility/:facilityId/default', getDefaultFilterView);

// Get a specific saved filter view by ID
router.get('/:id', getSavedFilterView);

// Create a new saved filter view
router.post('/', validateSavedFilterView, createSavedFilterView);

// Update a saved filter view
router.put('/:id', validateSavedFilterViewUpdate, updateSavedFilterView);

// Set a filter view as default
router.patch('/:id/default', setAsDefault);

// Delete a saved filter view
router.delete('/:id', deleteSavedFilterView);

module.exports = router;
