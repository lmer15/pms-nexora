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
    // Fetch user profile
    const User = require('./User');
    const user = await User.findById(creatorId);
    const userProfile = user ? await User.getProfile(user.id) : { firstName: 'Unknown', lastName: '', profilePicture: null };
    data.userProfile = userProfile;
    return this.create(data);
  }

  async updateComment(commentId, updateData) {
    // Preserve userProfile if not provided
    const current = await this.findById(commentId);
    const data = { ...updateData, updatedAt: new Date() };
    if (current && current.userProfile && !data.userProfile) {
      data.userProfile = current.userProfile;
    }
    return this.update(commentId, data);
  }

  async deleteComment(commentId) {
    return this.delete(commentId);
  }
}

module.exports = new TaskComment();
