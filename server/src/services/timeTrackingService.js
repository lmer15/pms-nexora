const TaskTimeLog = require('../models/TaskTimeLog');
const ActivityLoggerService = require('./activityLoggerService');

class TimeTrackingService {
  constructor() {
    // In-memory storage for active time tracking sessions
    // In production, this should be stored in Redis or database
    this.activeSessions = new Map();
  }

  // Start time tracking session
  async startTimeTracking(taskId, userId, description = 'Work session') {
    try {
      const sessionKey = `${taskId}-${userId}`;
      
      // Check if there's already an active session
      if (this.activeSessions.has(sessionKey)) {
        throw new Error('Time tracking session already active for this task');
      }

      const session = {
        taskId,
        userId,
        description,
        startTime: new Date(),
        isActive: true
      };

      this.activeSessions.set(sessionKey, session);

      // Log activity
      await ActivityLoggerService.logTimeTrackingStarted(taskId, userId, description);

      return {
        sessionId: sessionKey,
        startTime: session.startTime,
        description: session.description
      };
    } catch (error) {
      console.error('Error starting time tracking:', error);
      throw error;
    }
  }

  // Stop time tracking session and save to database
  async stopTimeTracking(taskId, userId) {
    try {
      const sessionKey = `${taskId}-${userId}`;
      const session = this.activeSessions.get(sessionKey);

      if (!session || !session.isActive) {
        throw new Error('No active time tracking session found');
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

      // Create time log entry
      const timeLogData = {
        taskId: session.taskId,
        userId: session.userId,
        description: session.description,
        startTime: session.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration
      };

      const timeLog = await TaskTimeLog.create(timeLogData);

      // Remove from active sessions
      this.activeSessions.delete(sessionKey);

      // Log activity
      await ActivityLoggerService.logTimeTrackingStopped(
        taskId, 
        userId, 
        duration, 
        session.description
      );

      return {
        timeLog,
        duration,
        startTime: session.startTime,
        endTime
      };
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      throw error;
    }
  }

  // Get active session for a user and task
  getActiveSession(taskId, userId) {
    const sessionKey = `${taskId}-${userId}`;
    const session = this.activeSessions.get(sessionKey);
    
    if (!session || !session.isActive) {
      return null;
    }

    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime.getTime() - session.startTime.getTime()) / 1000);

    return {
      sessionId: sessionKey,
      startTime: session.startTime,
      description: session.description,
      elapsedTime,
      isActive: true
    };
  }

  // Get all active sessions for a user
  getUserActiveSessions(userId) {
    const userSessions = [];
    
    for (const [sessionKey, session] of this.activeSessions.entries()) {
      if (session.userId === userId && session.isActive) {
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime.getTime() - session.startTime.getTime()) / 1000);
        
        userSessions.push({
          sessionId: sessionKey,
          taskId: session.taskId,
          startTime: session.startTime,
          description: session.description,
          elapsedTime,
          isActive: true
        });
      }
    }
    
    return userSessions;
  }

  // Add manual time log entry
  async addManualTimeLog(taskId, userId, timeLogData) {
    try {
      const { description, startTime, endTime, duration } = timeLogData;

      // Validate data
      if (!description || !startTime || !endTime) {
        throw new Error('Description, start time, and end time are required');
      }

      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        throw new Error('End time must be after start time');
      }

      // Calculate duration if not provided
      const calculatedDuration = duration || Math.floor((end.getTime() - start.getTime()) / 1000);

      const timeLog = await TaskTimeLog.create({
        taskId,
        userId,
        description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: calculatedDuration
      });

      // Log activity
      await ActivityLoggerService.logTimeLogAdded(taskId, userId, calculatedDuration, description);

      return timeLog;
    } catch (error) {
      console.error('Error adding manual time log:', error);
      throw error;
    }
  }

  // Get time logs for a task
  async getTaskTimeLogs(taskId) {
    try {
      return await TaskTimeLog.findByTask(taskId);
    } catch (error) {
      console.error('Error fetching task time logs:', error);
      throw error;
    }
  }

  // Get time logs for a user
  async getUserTimeLogs(userId, startDate = null, endDate = null) {
    try {
      return await TaskTimeLog.findByUserId(userId, startDate, endDate);
    } catch (error) {
      console.error('Error fetching user time logs:', error);
      throw error;
    }
  }

  // Calculate total time logged for a task
  async getTaskTotalTime(taskId) {
    try {
      const timeLogs = await TaskTimeLog.findByTask(taskId);
      const totalSeconds = timeLogs.reduce((total, log) => total + (log.duration || 0), 0);

      return {
        totalSeconds,
        totalMinutes: Math.floor(totalSeconds / 60),
        totalHours: Math.floor(totalSeconds / 3600),
        formattedTime: this.formatDuration(totalSeconds)
      };
    } catch (error) {
      console.error('Error calculating task total time:', error);
      throw error;
    }
  }

  // Format duration in seconds to human readable format
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds > 0 ? `${remainingSeconds}s` : ''}`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  // Clean up inactive sessions (should be called periodically)
  cleanupInactiveSessions(maxInactiveHours = 24) {
    const cutoffTime = new Date(Date.now() - (maxInactiveHours * 60 * 60 * 1000));
    
    for (const [sessionKey, session] of this.activeSessions.entries()) {
      if (session.startTime < cutoffTime) {
        this.activeSessions.delete(sessionKey);
      }
    }
  }
}

// Create singleton instance
const timeTrackingService = new TimeTrackingService();

module.exports = timeTrackingService;
