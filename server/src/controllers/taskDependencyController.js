const TaskDependency = require('../models/TaskDependency');
const Task = require('../models/Task');
const Project = require('../models/Project');
const UserFacility = require('../models/UserFacility');
const ActivityLoggerService = require('../services/activityLoggerService');

// Helper function to check if user has access to a task
const checkTaskAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const userFacility = await UserFacility.findByUserAndFacility(userId, project.facilityId);
  if (userFacility.length === 0) {
    throw new Error('Access denied: User is not a member of the facility');
  }

  return { task, project, facilityId: project.facilityId };
};

exports.getDependenciesByTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.userId;

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const dependencies = await TaskDependency.findByTask(taskId);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ message: 'Server error fetching dependencies' });
  }
};

exports.createDependency = async (req, res) => {
  try {
    const creatorId = req.userId;
    const { taskId } = req.params;
    const { dependentTaskId, dependencyType } = req.body;

    // Validate input
    if (!dependentTaskId || !dependencyType) {
      return res.status(400).json({ message: 'dependentTaskId and dependencyType are required' });
    }

    if (!['blocks', 'blocked_by', 'relates_to'].includes(dependencyType)) {
      return res.status(400).json({ message: 'Invalid dependency type. Must be blocks, blocked_by, or relates_to' });
    }

    // Check user access to the main task
    try {
      await checkTaskAccess(taskId, creatorId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    // Check user access to the dependent task
    try {
      await checkTaskAccess(dependentTaskId, creatorId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const dependencyData = {
      dependentTaskId,
      dependencyType
    };

    const dependency = await TaskDependency.createDependency(dependencyData, taskId, creatorId);

    // Log activity
    await ActivityLoggerService.logDependencyAdded(taskId, creatorId, dependencyType, dependentTaskId);

    res.status(201).json(dependency);
  } catch (error) {
    console.error('Error creating dependency:', error);
    res.status(500).json({ message: 'Server error creating dependency' });
  }
};

exports.deleteDependency = async (req, res) => {
  try {
    const userId = req.userId;
    const { dependencyId } = req.params;

    // Get dependency info before deletion
    const dependency = await TaskDependency.findById(dependencyId);
    if (!dependency) {
      return res.status(404).json({ message: 'Dependency not found' });
    }

    // Check user access to the main task
    try {
      await checkTaskAccess(dependency.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const deleted = await TaskDependency.deleteDependency(dependencyId);
    if (!deleted) {
      return res.status(404).json({ message: 'Dependency not found' });
    }

    // Log activity
    await ActivityLoggerService.logDependencyRemoved(
      dependency.taskId,
      userId,
      dependency.dependencyType,
      dependency.dependentTaskId
    );

    res.json({ message: 'Dependency deleted successfully' });
  } catch (error) {
    console.error('Error deleting dependency:', error);
    res.status(500).json({ message: 'Server error deleting dependency' });
  }
};
