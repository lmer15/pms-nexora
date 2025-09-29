const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTasks,
  getTaskById,
  getTaskDetails,
  getTasksByProject,
  getTasksByUser,
  createTask,
  updateTask,
  pinTask,
  deleteTask
} = require('../controllers/taskController');

// Import sub-routes
const taskCommentRoutes = require('./taskCommentRoutes');
const taskAttachmentRoutes = require('./taskAttachmentRoutes');
const taskDependencyRoutes = require('./taskDependencyRoutes');
const taskSubtaskRoutes = require('./taskSubtaskRoutes');
const taskTimeLogRoutes = require('./taskTimeLogRoutes');
const taskActivityLogRoutes = require('./taskActivityLogRoutes');

// Routes
router.get('/', authMiddleware, getTasks);
router.get('/:id', authMiddleware, getTaskById);
router.get('/:id/details', authMiddleware, getTaskDetails);
router.get('/project/:projectId', authMiddleware, getTasksByProject);
router.get('/user/:userId', authMiddleware, getTasksByUser);
router.post('/', authMiddleware, createTask);
router.put('/:id', authMiddleware, updateTask);
router.put('/:id/pin', authMiddleware, pinTask);
router.delete('/:id', authMiddleware, deleteTask);

// Sub-routes for task details
router.use('/:taskId/comments', taskCommentRoutes);
router.use('/:taskId/attachments', taskAttachmentRoutes);
router.use('/:taskId/dependencies', taskDependencyRoutes);
router.use('/:taskId/subtasks', taskSubtaskRoutes);
router.use('/:taskId/timeLogs', taskTimeLogRoutes);
router.use('/:taskId/activityLogs', taskActivityLogRoutes);

module.exports = router;
