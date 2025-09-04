const FirestoreService = require('../services/firestoreService');

class Project extends FirestoreService {
  constructor() {
    super('projects');
  }

  // Find projects by facility
  async findByFacility(facilityId) {
    return this.findByField('facilityId', facilityId);
  }

  // Find projects by assignee
  async findByAssignee(userId) {
    return this.query([
      { field: 'assignees', operator: 'array-contains', value: userId }
    ]);
  }

  // Find projects by status
  async findByStatus(status) {
    return this.findByField('status', status);
  }

  // Add assignee to project
  async addAssignee(projectId, userId) {
    const project = await this.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const assignees = project.assignees || [];
    if (!assignees.includes(userId)) {
      assignees.push(userId);
      return this.update(projectId, { assignees });
    }

    return project;
  }

  // Remove assignee from project
  async removeAssignee(projectId, userId) {
    const project = await this.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const assignees = project.assignees || [];
    const updatedAssignees = assignees.filter(id => id !== userId);
    return this.update(projectId, { assignees: updatedAssignees });
  }

  // Update project status
  async updateStatus(projectId, status) {
    const validStatuses = ['planning', 'in-progress', 'completed', 'on-hold'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return this.update(projectId, { status });
  }

  // Create project with facility
  async createProject(projectData, facilityId, creatorId) {
    const data = {
      ...projectData,
      facilityId,
      creatorId,
      assignees: projectData.assignees || [creatorId],
      status: projectData.status || 'planning',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(data);
  }
}

module.exports = new Project();
