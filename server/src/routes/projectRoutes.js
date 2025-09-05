const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getProjects,
  getProjectById,
  getProjectsByFacility,
  createProject,
  updateProject,
  deleteProject,
  archiveProject
} = require('../controllers/projectController');

// Routes
router.get('/', authMiddleware, getProjects);
router.get('/:id', authMiddleware, getProjectById);
router.get('/facility/:facilityId', authMiddleware, getProjectsByFacility);
router.post('/', authMiddleware, createProject);
router.put('/:id', authMiddleware, updateProject);
router.put('/:id/archive', authMiddleware, archiveProject);
router.delete('/:id', authMiddleware, deleteProject);

module.exports = router;
