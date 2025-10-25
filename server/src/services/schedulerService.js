const cron = require('node-cron');
const Task = require('../models/Task');
const notificationService = require('./notificationService');
const fs = require('fs').promises;
const path = require('path');

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start all scheduled jobs
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler...');
    
    // Run deadline reminders check every day at 9:00 AM
    const deadlineReminderJob = cron.schedule('0 9 * * *', async () => {
      console.log('Running deadline reminder check...');
      await this.checkDeadlineReminders();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Run cleanup job every day at 2:00 AM
    const cleanupJob = cron.schedule('0 2 * * *', async () => {
      console.log('Running notification cleanup...');
      await this.cleanupExpiredNotifications();
      console.log('Running PDF cleanup...');
      await this.cleanupExpiredPDFs();
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Store job references
    this.jobs.set('deadlineReminders', deadlineReminderJob);
    this.jobs.set('cleanup', cleanupJob);

    // Start all jobs
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Started ${name} job`);
    });

    this.isRunning = true;
    console.log('All scheduled jobs started successfully');
  }

  // Stop all scheduled jobs
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped ${name} job`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('All scheduled jobs stopped');
  }

  // Check for tasks with upcoming deadlines and send reminders
  async checkDeadlineReminders() {
    try {
      console.log('Checking for upcoming task deadlines...');
      
      const taskModel = new Task();
      
      // Get tasks with due dates in the next 1, 3, and 7 days
      const reminderDays = [1, 3, 7];
      
      for (const daysAhead of reminderDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysAhead);
        targetDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(targetDate);
        endDate.setHours(23, 59, 59, 999);
        
        console.log(`Checking for tasks due on ${targetDate.toISOString().split('T')[0]} (${daysAhead} days ahead)`);
        
        // Find tasks with due dates in this range
        const tasks = await taskModel.findTasksByDueDateRange(targetDate, endDate);
        
        console.log(`Found ${tasks.length} tasks due in ${daysAhead} days`);
        
        for (const task of tasks) {
          // Skip completed or cancelled tasks
          if (task.status === 'completed' || task.status === 'cancelled') {
            continue;
          }
          
          // Send reminder to all assignees
          if (task.assigneeIds && task.assigneeIds.length > 0) {
            for (const assigneeId of task.assigneeIds) {
              try {
                // Check if we already sent a reminder for this task and assignee recently
                const reminderId = `due_date_reminder_${task.id}_${assigneeId}_${daysAhead}d`;
                const existingReminder = await this.checkExistingReminder(reminderId);
                
                if (!existingReminder) {
                  await notificationService.createDueDateReminderNotification(
                    task.id,
                    assigneeId,
                    task.title,
                    task.dueDate,
                    task.facilityId || task.projectId?.split('_')[0] // Extract facility ID from project ID
                  );
                  
                  // Mark that we sent this reminder
                  await this.markReminderSent(reminderId, task.id, assigneeId, daysAhead);
                  
                  console.log(`Sent ${daysAhead}-day reminder for task "${task.title}" to user ${assigneeId}`);
                }
              } catch (error) {
                console.error(`Error sending reminder for task ${task.id} to user ${assigneeId}:`, error);
              }
            }
          }
        }
      }
      
      console.log('Deadline reminder check completed');
    } catch (error) {
      console.error('Error in deadline reminder check:', error);
    }
  }

  // Check if we already sent a reminder for this task/assignee/day combination
  async checkExistingReminder(reminderId) {
    try {
      const Notification = require('../models/Notification');
      const notificationModel = new Notification();
      
      // Look for existing reminder notifications created in the last 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const conditions = [
        { field: 'id', operator: '==', value: reminderId },
        { field: 'createdAt', operator: '>=', value: twoDaysAgo.toISOString() }
      ];
      
      const existingReminders = await notificationModel.query(conditions);
      return existingReminders.length > 0;
    } catch (error) {
      console.error('Error checking existing reminder:', error);
      return false;
    }
  }

  // Mark that we sent a reminder (create a tracking notification)
  async markReminderSent(reminderId, taskId, assigneeId, daysAhead) {
    try {
      const Notification = require('../models/Notification');
      const notificationModel = new Notification();
      
      await notificationModel.createNotification({
        id: reminderId,
        userId: assigneeId,
        type: 'due_date_reminder',
        title: `Reminder Sent (${daysAhead} days)`,
        message: `Reminder sent for task due in ${daysAhead} days`,
        category: 'system',
        priority: 'low',
        sourceId: taskId,
        sourceType: 'task',
        read: true, // Mark as read since it's just a tracking notification
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // Expire after 2 days
      });
    } catch (error) {
      console.error('Error marking reminder sent:', error);
    }
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      console.log('Cleaning up expired notifications...');
      const result = await notificationService.cleanupExpiredNotifications();
      console.log(`Cleaned up ${result.deleted} expired notifications`);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  // Clean up expired PDF files from temp directory
  async cleanupExpiredPDFs() {
    try {
      console.log('Cleaning up expired PDF files...');
      const tempDir = path.join(__dirname, '../temp');
      
      // Check if temp directory exists
      try {
        await fs.access(tempDir);
      } catch {
        console.log('Temp directory does not exist, skipping PDF cleanup');
        return;
      }

      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const filePath = path.join(tempDir, file);
          try {
            const stats = await fs.stat(filePath);
            const fileAge = now - stats.mtime.getTime();
            
            if (fileAge > maxAge) {
              await fs.unlink(filePath);
              deletedCount++;
              console.log(`Deleted expired PDF: ${file}`);
            }
          } catch (error) {
            console.error(`Error processing file ${file}:`, error);
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} expired PDF files`);
    } catch (error) {
      console.error('Error cleaning up expired PDFs:', error);
    }
  }

  // Manual trigger for testing
  async triggerDeadlineReminders() {
    console.log('Manually triggering deadline reminder check...');
    await this.checkDeadlineReminders();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }
}

module.exports = new SchedulerService();
