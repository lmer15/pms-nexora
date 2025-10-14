const FirestoreService = require('../services/firestoreService');

class Notification extends FirestoreService {
  constructor() {
    super('notifications');
  }

  async createNotification(data) {
    const notification = {
      id: data.id,
      userId: data.userId,
      type: data.type, // 'task_assigned', 'task_updated', 'project_updated', 'facility_invite', 'comment_mention', 'due_date_reminder', 'system_announcement'
      title: data.title,
      message: data.message,
      data: data.data || {}, // Additional context data
      read: false,
      priority: data.priority || 'normal', // 'low', 'normal', 'high', 'urgent'
      category: data.category || 'general', // 'task', 'project', 'facility', 'system', 'communication'
      sourceId: data.sourceId || null, // ID of the source (task, project, etc.)
      sourceType: data.sourceType || null, // Type of source ('task', 'project', 'facility', etc.)
      facilityId: data.facilityId || null, // Facility context
      projectId: data.projectId || null, // Project context
      taskId: data.taskId || null, // Task context
      actionUrl: data.actionUrl || null, // URL to navigate to when clicked
      expiresAt: data.expiresAt || null, // Optional expiration date
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await this.create(notification);
  }

  async findByUser(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      unreadOnly = false,
      category = null,
      type = null,
      facilityId = null
    } = options;

    try {
      let conditions = [
        { field: 'userId', operator: '==', value: userId }
      ];

      if (unreadOnly) {
        conditions.push({ field: 'read', operator: '==', value: false });
      }

      if (category) {
        conditions.push({ field: 'category', operator: '==', value: category });
      }

      if (type) {
        conditions.push({ field: 'type', operator: '==', value: type });
      }

      if (facilityId) {
        conditions.push({ field: 'facilityId', operator: '==', value: facilityId });
      }

      const notifications = await this.query(conditions);
      
      // Sort by creation date (newest first) and apply pagination
      const sortedNotifications = notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit);

      return sortedNotifications;
    } catch (error) {
      console.error('Error finding notifications by user:', error);
      return [];
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await this.findById(notificationId);
      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found or access denied');
      }

      return await this.update(notificationId, {
        read: true,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId, facilityId = null) {
    try {
      const conditions = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'read', operator: '==', value: false }
      ];

      if (facilityId) {
        conditions.push({ field: 'facilityId', operator: '==', value: facilityId });
      }

      const unreadNotifications = await this.query(conditions);
      
      const updatePromises = unreadNotifications.map(notification => 
        this.update(notification.id, {
          read: true,
          updatedAt: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);
      return { updated: unreadNotifications.length };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const notification = await this.findById(notificationId);
      if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found or access denied');
      }

      await this.delete(notificationId);
      return { deleted: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getUnreadCount(userId, facilityId = null) {
    try {
      const conditions = [
        { field: 'userId', operator: '==', value: userId },
        { field: 'read', operator: '==', value: false }
      ];

      if (facilityId) {
        conditions.push({ field: 'facilityId', operator: '==', value: facilityId });
      }

      const unreadNotifications = await this.query(conditions);
      return unreadNotifications.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async getNotificationStats(userId, facilityId = null) {
    try {
      const conditions = [
        { field: 'userId', operator: '==', value: userId }
      ];

      if (facilityId) {
        conditions.push({ field: 'facilityId', operator: '==', value: facilityId });
      }

      const allNotifications = await this.query(conditions);
      
      const stats = {
        total: allNotifications.length,
        unread: allNotifications.filter(n => !n.read).length,
        byCategory: {},
        byType: {},
        byPriority: {}
      };

      // Calculate stats by category
      allNotifications.forEach(notification => {
        const category = notification.category || 'general';
        const type = notification.type || 'unknown';
        const priority = notification.priority || 'normal';

        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byCategory: {},
        byType: {},
        byPriority: {}
      };
    }
  }

  async cleanupExpiredNotifications() {
    try {
      const now = new Date().toISOString();
      const expiredNotifications = await this.query([
        { field: 'expiresAt', operator: '<=', value: now }
      ]);

      const deletePromises = expiredNotifications.map(notification => 
        this.delete(notification.id)
      );

      await Promise.all(deletePromises);
      return { deleted: expiredNotifications.length };
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

module.exports = Notification;
