const FirestoreService = require('../services/firestoreService');

class Project extends FirestoreService {
  constructor() {
    super('projects');
  }

  // Find projects by facility with caching
  async findByFacility(facilityId) {
    try {
      const cacheService = require('../services/cacheService');
      
      // Check cache first
      const cachedProjects = cacheService.getFacilityProjects(facilityId);
      if (cachedProjects) {
        return cachedProjects;
      }

      // Exclude archived projects by default
      const projects = await this.query([
        { field: 'facilityId', operator: '==', value: facilityId },
        { field: 'archived', operator: '==', value: false }
      ]);

      // Cache the results
      cacheService.setFacilityProjects(facilityId, projects);
      
      return projects;
    } catch (error) {
      console.error('Error finding projects by facility:', error);
      return [];
    }
  }

  // Find projects by assignee
  async findByAssignee(userId) {
    try {
      return await this.query([
        { field: 'assignees', operator: 'array-contains', value: userId },
        { field: 'archived', operator: '==', value: false }
      ]);
    } catch (error) {
      console.error('Error finding projects by assignee:', error);
      return [];
    }
  }

  // Find projects by status
  async findByStatus(status) {
    try {
      return await this.query([
        { field: 'status', operator: '==', value: status },
        { field: 'archived', operator: '==', value: false }
      ]);
    } catch (error) {
      console.error('Error finding projects by status:', error);
      return [];
    }
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

  // Archive project
  async archiveProject(projectId) {
    return this.update(projectId, { archived: true, updatedAt: new Date() });
  }

  // Create project with facility
  async createProject(projectData, facilityId, creatorId) {
    const data = {
      ...projectData,
      facilityId,
      creatorId,
      assignees: projectData.assignees || [creatorId],
      status: projectData.status || 'planning',
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(data);
  }
}

module.exports = new Project();
