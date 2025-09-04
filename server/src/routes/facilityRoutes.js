const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility
} = require('../controllers/facilityController');

// Routes
router.get('/', getFacilities);
router.get('/:id', getFacilityById);
router.post('/', createFacility); // Temporarily remove auth for testing
router.put('/:id', authMiddleware, updateFacility);
router.delete('/:id', authMiddleware, deleteFacility);

module.exports = router;
