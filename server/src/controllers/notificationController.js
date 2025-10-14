const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const firebaseUserId = req.user.firebaseUid;
    
    // Convert Firebase UID to database user ID
    const User = require('../models/User');
    let databaseUserId = firebaseUserId;
    
    try {
      // Check if firebaseUserId is a Firebase UID (longer string) or database ID
      if (firebaseUserId.length > 20) {
        const user = await User.findByFirebaseUid(firebaseUserId);
        if (user) {
          databaseUserId = user.id;
        }
      }
    } catch (error) {
      console.error('Error converting user ID for notification query:', error);
      // Fallback to original ID
    }
    
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      category = null,
      type = null,
      facilityId = null
    } = req.query;

    const notificationModel = new Notification();
    const notifications = await notificationModel.findByUser(databaseUserId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      category,
      type,
      facilityId
    });

    res.json({
      success: true,
      notifications,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get notifications' 
    });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const firebaseUserId = req.user.firebaseUid;
    const { facilityId } = req.query;

    // Convert Firebase UID to database user ID
    const User = require('../models/User');
    let databaseUserId = firebaseUserId;
    
    try {
      if (firebaseUserId.length > 20) {
        const user = await User.findByFirebaseUid(firebaseUserId);
        if (user) {
          databaseUserId = user.id;
        }
      }
    } catch (error) {
      console.error('Error converting user ID for stats:', error);
    }

    const notificationModel = new Notification();
    const stats = await notificationModel.getNotificationStats(databaseUserId, facilityId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get notification stats' 
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const firebaseUserId = req.user.firebaseUid;
    const { facilityId } = req.query;

    // Convert Firebase UID to database user ID
    const User = require('../models/User');
    let databaseUserId = firebaseUserId;
    
    try {
      if (firebaseUserId.length > 20) {
        const user = await User.findByFirebaseUid(firebaseUserId);
        if (user) {
          databaseUserId = user.id;
        }
      }
    } catch (error) {
      console.error('Error converting user ID for unread count:', error);
    }

    const notificationModel = new Notification();
    const count = await notificationModel.getUnreadCount(databaseUserId, facilityId);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count' 
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const firebaseUserId = req.user.firebaseUid;
    const { notificationId } = req.params;

        // Convert Firebase UID to database user ID
        const User = require('../models/User');
        let databaseUserId = firebaseUserId;
        
        try {
          if (firebaseUserId.length > 20) {
            const user = await User.findByFirebaseUid(firebaseUserId);
            if (user) {
              databaseUserId = user.id;
            }
          }
        } catch (error) {
          console.error('Error converting user ID for mark as read:', error);
        }
    
    const notificationModel = new Notification();
    const notification = await notificationModel.markAsRead(notificationId, databaseUserId);

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const firebaseUserId = req.user.firebaseUid;
    const { facilityId } = req.body;

    // Convert Firebase UID to database user ID
    const User = require('../models/User');
    let databaseUserId = firebaseUserId;
    
    try {
      if (firebaseUserId.length > 20) {
        const user = await User.findByFirebaseUid(firebaseUserId);
        if (user) {
          databaseUserId = user.id;
        }
      }
    } catch (error) {
      console.error('Error converting user ID for mark all as read:', error);
    }

    const notificationModel = new Notification();
    const result = await notificationModel.markAllAsRead(databaseUserId, facilityId);

    res.json({
      success: true,
      message: `Marked ${result.updated} notifications as read`,
      updated: result.updated
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const firebaseUserId = req.user.firebaseUid;
    const { notificationId } = req.params;

    // Convert Firebase UID to database user ID
    const User = require('../models/User');
    let databaseUserId = firebaseUserId;
    
    try {
      if (firebaseUserId.length > 20) {
        const user = await User.findByFirebaseUid(firebaseUserId);
        if (user) {
          databaseUserId = user.id;
        }
      }
    } catch (error) {
      console.error('Error converting user ID for delete notification:', error);
    }

    const notificationModel = new Notification();
    await notificationModel.deleteNotification(notificationId, databaseUserId);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
};

// Create notification (admin/system use)
exports.createNotification = async (req, res) => {
  try {
    const notificationData = req.body;
    
    // Validate required fields
    if (!notificationData.userId || !notificationData.type || !notificationData.title || !notificationData.message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, title, message'
      });
    }

    const notification = await notificationService.createNotification(notificationData);

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification' 
    });
  }
};

// Create bulk notifications (admin/system use)
exports.createBulkNotifications = async (req, res) => {
  try {
    const { notifications } = req.body;
    
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notifications array is required and must not be empty'
      });
    }

    const results = await notificationService.createBulkNotifications(notifications);

    res.status(201).json({
      success: true,
      results,
      created: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create bulk notifications' 
    });
  }
};

// Cleanup expired notifications (admin/system use)
exports.cleanupExpiredNotifications = async (req, res) => {
  try {
    const result = await notificationService.cleanupExpiredNotifications();

    res.json({
      success: true,
      message: `Cleaned up ${result.deleted} expired notifications`,
      deleted: result.deleted
    });
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cleanup expired notifications' 
    });
  }
};
