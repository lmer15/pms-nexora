const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
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
router.get('/', authMiddleware, getTasks);
router.get('/:id', authMiddleware, getTaskById);
router.get('/project/:projectId', authMiddleware, getTasksByProject);
router.get('/user/:userId', authMiddleware, getTasksByUser);
router.post('/', authMiddleware, createTask);
router.put('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);

module.exports = router;
