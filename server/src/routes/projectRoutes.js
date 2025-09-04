const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  getProjectsByFacility,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// Routes
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.get('/facility/:facilityId', getProjectsByFacility);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
