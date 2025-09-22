const FirestoreService = require('../services/firestoreService');

class TaskDependency extends FirestoreService {
  constructor() {
    super('taskDependencies');
  }

  async findByTask(taskId) {
    return this.findByField('taskId', taskId);
  }

  async findByDependency(dependencyId) {
    return this.findByField('dependencyId', dependencyId);
  }

  async createDependency(dependencyData, taskId, creatorId) {
    const data = {
      dependencyId: dependencyData.dependencyId,
      dependencyType: dependencyData.dependencyType,
      description: dependencyData.description || '',
      taskId,
      creatorId,
      createdAt: new Date(),
    };
    return this.create(data);
  }

  async deleteDependency(dependencyId) {
    return this.delete(dependencyId);
  }
}

module.exports = new TaskDependency();
