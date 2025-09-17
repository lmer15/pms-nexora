const FirestoreService = require('../services/firestoreService');

class Task extends FirestoreService {
  constructor() {
    super('tasks');
  }

  // Find tasks by project
  async findByProject(projectId) {
    return this.findByField('projectId', projectId);
  }

  // Find tasks by assignee
  async findByAssignee(userId) {
    return this.findByField('assigneeId', userId);
  }

  // Find tasks by status
  async findByStatus(status) {
    return this.findByField('status', status);
  }

  // Find tasks by priority
  async findByPriority(priority) {
    return this.findByField('priority', priority);
  }

  // Update task status
  async updateStatus(taskId, status) {
    const validStatuses = ['todo', 'in-progress', 'review', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return this.update(taskId, { status });
  }

  // Update task priority
  async updatePriority(taskId, priority) {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new Error('Invalid priority');
    }

    return this.update(taskId, { priority });
  }

  // Assign task to user
  async assignTask(taskId, userId) {
    return this.update(taskId, { assigneeId: userId });
  }

  // Create task with project
  async createTask(taskData, projectId, creatorId) {
    const data = {
      ...taskData,
      projectId,
      creatorId,
      assigneeId: taskData.assigneeId || null,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      startDate: taskData.startDate || null,
      estimatedDuration: taskData.estimatedDuration || null,
      actualCompletionDate: taskData.actualCompletionDate || null,
      progress: taskData.progress || 0,
      tags: taskData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(data);
  }

  // Get tasks with project info
  async getTasksWithProject(userId = null) {
    // This would require a more complex query or joining
    // For now, return all tasks
    const tasks = await this.findAll();

    // In a real implementation, you might want to fetch project details
    // and filter by user permissions
    return tasks;
  }
}

module.exports = new Task();
