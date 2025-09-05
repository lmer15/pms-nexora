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
router.get('/', authMiddleware, getFacilities);
router.get('/:id', authMiddleware, getFacilityById);
router.post('/', authMiddleware, createFacility);
router.put('/:id', authMiddleware, updateFacility);
router.delete('/:id', authMiddleware, deleteFacility);

module.exports = router;
