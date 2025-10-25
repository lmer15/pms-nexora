const Notification = require('../models/Notification');
const { sendEmailNotification } = require('./emailService');
const { realtimeDb } = require('../config/firebase-admin');

class NotificationService {
  constructor() {
    this.notificationModel = new Notification();
  }

  // Create and send notification
  async createNotification(data) {
    try {
      // Create notification in database
      const notification = await this.notificationModel.createNotification(data);
      
      // Send real-time notification (non-blocking)
      this.sendRealtimeNotification(notification).catch(error => {
        console.warn('Real-time notification failed (notification still saved):', error.message);
      });
      
      // Send email notification if enabled (non-blocking)
      this.sendEmailNotificationIfEnabled(notification).catch(error => {
        console.warn('Email notification failed (notification still saved):', error.message);
      });
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send real-time notification via Firebase Realtime Database
  async sendRealtimeNotification(notification) {
    try {
      if (!realtimeDb) {
        console.warn('Firebase Realtime Database not initialized, skipping real-time notification');
        return;
      }
      
      const notificationRef = realtimeDb.ref(`userNotifications/${notification.userId}/${notification.id}`);
      const notificationData = {
        ...notification,
        timestamp: Date.now()
      };
      await notificationRef.set(notificationData);

      // Also update the user's notification count
      const countRef = realtimeDb.ref(`userNotificationCounts/${notification.userId}`);
      const currentCount = await countRef.once('value');
      const newCount = (currentCount.val() || 0) + 1;
      await countRef.set(newCount);
      
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      // Don't throw error to avoid breaking the main notification creation
    }
  }

  // Send email notification if user has email notifications enabled
  async sendEmailNotificationIfEnabled(notification) {
    try {
      // Check user's notification preferences
      const userSettings = require('../models/UserSettings');
      const settings = await userSettings.getByUserId(notification.userId);
      
      if (!settings || !settings.notifications?.emailNotifications) {
        return; // User has disabled email notifications
      }

      // Check if this type of notification should be sent via email
      const shouldSendEmail = this.shouldSendEmailNotification(notification, settings);
      if (!shouldSendEmail) {
        return;
      }

      // Get user details for email
      const User = require('../models/User');
      const userModel = new User();
      const user = await userModel.findByFirebaseUid(notification.userId);
      
      if (!user || !user.email) {
        return;
      }

      // Send email notification
      await sendEmailNotification(user.email, notification);
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw error to avoid breaking the main notification creation
    }
  }

  // Check if email notification should be sent based on user preferences
  shouldSendEmailNotification(notification, settings) {
    const { notifications } = settings;
    
    switch (notification.type) {
      case 'task_assigned':
      case 'task_updated':
        return notifications.taskReminders;
      case 'project_updated':
        return notifications.projectUpdates;
      case 'facility_invite':
        return notifications.facilityInvites;
      case 'comment_mention':
        return notifications.emailNotifications;
      case 'due_date_reminder':
        return notifications.taskReminders;
      case 'system_announcement':
        return notifications.emailNotifications;
      default:
        return notifications.emailNotifications;
    }
  }

  // Notification creation methods for different types
  async createTaskAssignedNotification(taskId, assigneeId, assignerId, taskTitle, projectName, facilityId) {
    // Convert Firebase UID to database user ID if needed
    const User = require('../models/User');
    let databaseUserId = assigneeId;
    
    try {
      // Check if assigneeId is a Firebase UID (longer string) or database ID
      if (assigneeId.length > 20) {
        const user = await User.findByFirebaseUid(assigneeId);
        if (user) {
          databaseUserId = user.id;
        }
      }
    } catch (error) {
      console.error('Error converting user ID for notification:', error);
      // Fallback to original ID
    }

    const notification = await this.createNotification({
      id: `task_assigned_${taskId}_${databaseUserId}_${Date.now()}`,
      userId: databaseUserId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to "${taskTitle}" in project "${projectName}"`,
      category: 'task',
      priority: 'normal',
      sourceId: taskId,
      sourceType: 'task',
      facilityId,
      actionUrl: `/facility/${facilityId}`
    });
    return notification;
  }

  async createTaskUpdatedNotification(taskId, assigneeIds, updaterId, taskTitle, updateType, facilityId) {
    const notifications = [];
    const User = require('../models/User');
    
    for (const assigneeId of assigneeIds) {
      if (assigneeId !== updaterId) { // Don't notify the person who made the update
        // Convert Firebase UID to database user ID if needed
        let databaseUserId = assigneeId;
        
        try {
          // Check if assigneeId is a Firebase UID (longer string) or database ID
          if (assigneeId.length > 20) {
            const user = await User.findByFirebaseUid(assigneeId);
            if (user) {
              databaseUserId = user.id;
            }
          }
        } catch (error) {
          console.error('Error converting user ID for notification:', error);
          // Fallback to original ID
        }

        const notification = await this.createNotification({
          id: `task_updated_${taskId}_${databaseUserId}_${Date.now()}`,
          userId: databaseUserId,
          type: 'task_updated',
          title: 'Task Updated',
          message: `Task "${taskTitle}" has been updated (${updateType})`,
          category: 'task',
          priority: 'normal',
          sourceId: taskId,
          sourceType: 'task',
          facilityId,
          actionUrl: `/facility/${facilityId}`
        });
        notifications.push(notification);
      }
    }
    
    return notifications;
  }

  async createProjectUpdatedNotification(projectId, memberIds, updaterId, projectName, updateType, facilityId) {
    const notifications = [];
    
    for (const memberId of memberIds) {
      if (memberId !== updaterId) { // Don't notify the person who made the update
        const notification = await this.createNotification({
          id: `project_updated_${projectId}_${memberId}_${Date.now()}`,
          userId: memberId,
          type: 'project_updated',
          title: 'Project Updated',
          message: `Project "${projectName}" has been updated (${updateType})`,
          category: 'project',
          priority: 'normal',
          sourceId: projectId,
          sourceType: 'project',
          facilityId,
          actionUrl: `/facility/${facilityId}`
        });
        notifications.push(notification);
      }
    }
    
    return notifications;
  }

  async createFacilityInviteNotification(inviteeEmail, facilityName, inviterName, facilityId) {
    // This will be handled by the existing email invitation system
    // We'll create an in-app notification when the user accepts the invitation
    return null;
  }

  async createCommentMentionNotification(commentId, mentionedUserId, commenterName, taskTitle, facilityId, taskId) {
    const notification = await this.createNotification({
      id: `comment_mention_${commentId}_${mentionedUserId}_${Date.now()}`,
      userId: mentionedUserId,
      type: 'comment_mention',
      title: 'You were mentioned in a comment',
      message: `${commenterName} mentioned you in a comment on task "${taskTitle}"`,
      category: 'communication',
      priority: 'normal',
      sourceId: commentId,
      sourceType: 'comment',
      facilityId,
      taskId,
      actionUrl: `/facility/${facilityId}`
    });
    return notification;
  }

  async createDueDateReminderNotification(taskId, assigneeId, taskTitle, dueDate, facilityId) {
    const notification = await this.createNotification({
      id: `due_date_reminder_${taskId}_${assigneeId}_${Date.now()}`,
      userId: assigneeId,
      type: 'due_date_reminder',
      title: 'Task Due Soon',
      message: `Task "${taskTitle}" is due on ${new Date(dueDate).toLocaleDateString()}`,
      category: 'task',
      priority: 'high',
      sourceId: taskId,
      sourceType: 'task',
      facilityId,
      actionUrl: `/facility/${facilityId}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expire after 7 days
    });
    return notification;
  }

  async createSystemAnnouncementNotification(userIds, title, message, priority = 'normal') {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await this.createNotification({
        id: `system_announcement_${userId}_${Date.now()}`,
        userId,
        type: 'system_announcement',
        title,
        message,
        category: 'system',
        priority,
        sourceType: 'system',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Expire after 30 days
      });
      notifications.push(notification);
    }
    
    return notifications;
  }

  // Bulk notification methods
  async createBulkNotifications(notifications) {
    const results = [];
    
    for (const notificationData of notifications) {
      try {
        const notification = await this.createNotification(notificationData);
        results.push({ success: true, notification });
      } catch (error) {
        console.error('Error creating bulk notification:', error);
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Cleanup expired notifications (should be run periodically)
  async cleanupExpiredNotifications() {
    try {
      const result = await this.notificationModel.cleanupExpiredNotifications();
      return result;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
