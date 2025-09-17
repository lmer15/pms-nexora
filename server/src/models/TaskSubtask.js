const FirestoreService = require('../services/firestoreService');

class TaskSubtask extends FirestoreService {
  constructor() {
    super('taskSubtasks');
  }

  async findByTask(taskId) {
    return this.findByField('taskId', taskId);
  }

  async createSubtask(subtaskData, taskId, creatorId) {
    const data = {
      ...subtaskData,
      taskId,
      creatorId,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.create(data);
  }

  async updateSubtask(subtaskId, updateData) {
    return this.update(subtaskId, { ...updateData, updatedAt: new Date() });
  }

  async deleteSubtask(subtaskId) {
    return this.delete(subtaskId);
  }
}

module.exports = new TaskSubtask();
