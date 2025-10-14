const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissions');

// Apply authentication to all routes
router.use(authMiddleware);

// Get user's notifications
router.get('/', notificationController.getNotifications);

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

// Admin/System routes (require notifications.manage permission)
router.post('/', checkPermission('notifications.manage'), notificationController.createNotification);
router.post('/bulk', checkPermission('notifications.manage'), notificationController.createBulkNotifications);
router.delete('/cleanup/expired', checkPermission('notifications.manage'), notificationController.cleanupExpiredNotifications);

module.exports = router;
