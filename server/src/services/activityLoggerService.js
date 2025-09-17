const TaskActivityLog = require('../models/TaskActivityLog');

class ActivityLoggerService {
  static async logActivity(taskId, userId, action, details = null, metadata = {}) {
    try {
      const activityData = {
        taskId,
        userId,
        action,
        details,
        metadata,
        timestamp: new Date().toISOString()
      };

      const activity = await TaskActivityLog.create(activityData);
      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error to prevent breaking main functionality
      return null;
    }
  }

  // Task-related activities
  static async logTaskCreated(taskId, userId, taskTitle) {
    return this.logActivity(
      taskId,
      userId,
      'task_created',
      `Created task "${taskTitle}"`,
      { taskTitle }
    );
  }

  static async logTaskUpdated(taskId, userId, changes) {
    const changesList = Object.keys(changes).join(', ');
    return this.logActivity(
      taskId,
      userId,
      'task_updated',
      `Updated task fields: ${changesList}`,
      { changes }
    );
  }

  static async logTaskStatusChanged(taskId, userId, oldStatus, newStatus) {
    return this.logActivity(
      taskId,
      userId,
      'status_changed',
      `Changed status from "${oldStatus}" to "${newStatus}"`,
      { oldStatus, newStatus }
    );
  }

  static async logTaskDeleted(taskId, userId, taskTitle) {
    return this.logActivity(
      taskId,
      userId,
      'task_deleted',
      `Deleted task "${taskTitle}"`,
      { taskTitle }
    );
  }

  // Comment-related activities
  static async logCommentAdded(taskId, userId, commentId) {
    return this.logActivity(
      taskId,
      userId,
      'comment_added',
      'Added a comment',
      { commentId }
    );
  }

  static async logCommentUpdated(taskId, userId, commentId) {
    return this.logActivity(
      taskId,
      userId,
      'comment_updated',
      'Updated a comment',
      { commentId }
    );
  }

  static async logCommentDeleted(taskId, userId, commentId) {
    return this.logActivity(
      taskId,
      userId,
      'comment_deleted',
      'Deleted a comment',
      { commentId }
    );
  }

  // Attachment-related activities
  static async logAttachmentAdded(taskId, userId, filename, fileSize) {
    return this.logActivity(
      taskId,
      userId,
      'attachment_added',
      `Uploaded attachment "${filename}"`,
      { filename, fileSize }
    );
  }

  static async logAttachmentDeleted(taskId, userId, filename) {
    return this.logActivity(
      taskId,
      userId,
      'attachment_deleted',
      `Deleted attachment "${filename}"`,
      { filename }
    );
  }

  // Subtask-related activities
  static async logSubtaskAdded(taskId, userId, subtaskTitle) {
    return this.logActivity(
      taskId,
      userId,
      'subtask_added',
      `Added subtask "${subtaskTitle}"`,
      { subtaskTitle }
    );
  }

  static async logSubtaskCompleted(taskId, userId, subtaskTitle) {
    return this.logActivity(
      taskId,
      userId,
      'subtask_completed',
      `Completed subtask "${subtaskTitle}"`,
      { subtaskTitle }
    );
  }

  static async logSubtaskUncompleted(taskId, userId, subtaskTitle) {
    return this.logActivity(
      taskId,
      userId,
      'subtask_uncompleted',
      `Marked subtask "${subtaskTitle}" as incomplete`,
      { subtaskTitle }
    );
  }

  static async logSubtaskDeleted(taskId, userId, subtaskTitle) {
    return this.logActivity(
      taskId,
      userId,
      'subtask_deleted',
      `Deleted subtask "${subtaskTitle}"`,
      { subtaskTitle }
    );
  }

  // Dependency-related activities
  static async logDependencyAdded(taskId, userId, dependencyType, dependentTaskId) {
    return this.logActivity(
      taskId,
      userId,
      'dependency_added',
      `Added ${dependencyType} dependency with task #${dependentTaskId}`,
      { dependencyType, dependentTaskId }
    );
  }

  static async logDependencyRemoved(taskId, userId, dependencyType, dependentTaskId) {
    return this.logActivity(
      taskId,
      userId,
      'dependency_removed',
      `Removed ${dependencyType} dependency with task #${dependentTaskId}`,
      { dependencyType, dependentTaskId }
    );
  }

  // Time tracking activities
  static async logTimeTrackingStarted(taskId, userId, description) {
    return this.logActivity(
      taskId,
      userId,
      'time_tracking_started',
      `Started time tracking: ${description}`,
      { description }
    );
  }

  static async logTimeTrackingStopped(taskId, userId, duration, description) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    return this.logActivity(
      taskId,
      userId,
      'time_tracking_stopped',
      `Logged ${timeStr} of work: ${description}`,
      { duration, description }
    );
  }

  static async logTimeLogAdded(taskId, userId, duration, description) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    return this.logActivity(
      taskId,
      userId,
      'time_log_added',
      `Added time log: ${timeStr} - ${description}`,
      { duration, description }
    );
  }

  // Assignment activities
  static async logTaskAssigned(taskId, userId, assigneeId) {
    return this.logActivity(
      taskId,
      userId,
      'task_assigned',
      `Assigned task to ${assigneeId}`,
      { assigneeId }
    );
  }

  static async logTaskUnassigned(taskId, userId, previousAssigneeId) {
    return this.logActivity(
      taskId,
      userId,
      'task_unassigned',
      `Unassigned task from ${previousAssigneeId}`,
      { previousAssigneeId }
    );
  }
}

module.exports = ActivityLoggerService;
