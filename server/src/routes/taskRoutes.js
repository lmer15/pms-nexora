const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { validateTask, validateTaskUpdate, validatePagination, sanitizeInput, rateLimit } = require('../middleware/validationMiddleware');
const {
  getTasks,
  getTaskById,
  getTaskDetails,
  getTasksByProject,
  getTasksByUser,
  createTask,
  updateTask,
  pinTask,
  deleteTask,
  bulkUpdateTaskStatus
} = require('../controllers/taskController');

// Import sub-routes
const taskCommentRoutes = require('./taskCommentRoutes');
const taskAttachmentRoutes = require('./taskAttachmentRoutes');
const taskDependencyRoutes = require('./taskDependencyRoutes');
const taskSubtaskRoutes = require('./taskSubtaskRoutes');
const taskTimeLogRoutes = require('./taskTimeLogRoutes');
const taskActivityLogRoutes = require('./taskActivityLogRoutes');

// Apply rate limiting and sanitization to all routes
router.use(rateLimit(500, 15 * 60 * 1000)); // 500 requests per 15 minutes (increased for development)
router.use(sanitizeInput);

// Routes
router.get('/', authMiddleware, getTasks);
router.get('/:id', authMiddleware, getTaskById);
router.get('/:id/details', authMiddleware, getTaskDetails);
router.get('/project/:projectId', authMiddleware, validatePagination, getTasksByProject);
router.get('/user/:userId', authMiddleware, getTasksByUser);
router.post('/', authMiddleware, validateTask, createTask);
router.put('/:id', authMiddleware, validateTaskUpdate, updateTask);
router.put('/:id/pin', authMiddleware, pinTask);
router.put('/bulk/status', authMiddleware, bulkUpdateTaskStatus);
router.delete('/:id', authMiddleware, deleteTask);

// Sub-routes for task details
router.use('/:taskId/comments', taskCommentRoutes);
router.use('/:taskId/attachments', taskAttachmentRoutes);
router.use('/:taskId/dependencies', taskDependencyRoutes);
router.use('/:taskId/subtasks', taskSubtaskRoutes);
router.use('/:taskId/timeLogs', taskTimeLogRoutes);
router.use('/:taskId/activityLogs', taskActivityLogRoutes);

module.exports = router;
