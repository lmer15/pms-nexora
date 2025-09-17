const RealtimeDatabaseService = require('../services/realtimeDatabaseService');

class TaskComment extends RealtimeDatabaseService {
  constructor() {
    super('taskComments');
  }

  async findByTask(taskId) {
    return this.findByField('taskId', taskId);
  }

  async createComment(commentData, taskId, creatorId) {
    const data = {
      ...commentData,
      taskId,
      creatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.create(data);
  }

  async updateComment(commentId, updateData) {
    return this.update(commentId, { ...updateData, updatedAt: new Date() });
  }

  async deleteComment(commentId) {
    return this.delete(commentId);
  }
}

module.exports = new TaskComment();
