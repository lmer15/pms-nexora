const FirestoreService = require('../services/firestoreService');

class TaskActivityLog extends FirestoreService {
  constructor() {
    super('taskActivityLogs');
  }

  async findByTask(taskId) {
    return this.findByField('taskId', taskId);
  }

  async createActivityLog(activityData, taskId, userId) {
    const data = {
      ...activityData,
      taskId,
      userId,
      timestamp: new Date(),
    };
    return this.create(data);
  }
}

module.exports = new TaskActivityLog();
