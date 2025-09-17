const FirestoreService = require('../services/firestoreService');

class TaskAttachment extends FirestoreService {
  constructor() {
    super('taskAttachments');
  }

  async findByTask(taskId) {
    return this.findByField('taskId', taskId);
  }

  async findByFilename(filename) {
    return this.findOneByField('filePath', filename);
  }

  async createAttachment(attachmentData, taskId, uploaderId) {
    const data = {
      ...attachmentData,
      taskId,
      uploaderId,
      uploadedAt: attachmentData.uploadedAt || new Date(),
    };
    return this.create(data);
  }

  async deleteAttachment(attachmentId) {
    return this.delete(attachmentId);
  }
}

module.exports = new TaskAttachment();
