const FirestoreService = require('../services/firestoreService');

class TaskTimeLog extends FirestoreService {
  constructor() {
    super('taskTimeLogs');
  }

  async findByTask(taskId) {
    return this.findByField('taskId', taskId);
  }

  async createTimeLog(timeLogData, taskId, userId) {
    const data = {
      ...timeLogData,
      taskId,
      userId,
      startTime: timeLogData.startTime || new Date(),
      endTime: timeLogData.endTime || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.create(data);
  }

  async updateTimeLog(timeLogId, updateData) {
    return this.update(timeLogId, { ...updateData, updatedAt: new Date() });
  }

  async deleteTimeLog(timeLogId) {
    return this.delete(timeLogId);
  }
}

module.exports = new TaskTimeLog();
