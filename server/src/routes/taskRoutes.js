const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  getTasksByProject,
  getTasksByUser,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// Routes
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.get('/project/:projectId', getTasksByProject);
router.get('/user/:userId', getTasksByUser);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
