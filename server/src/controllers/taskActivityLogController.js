const TaskActivityLog = require('../models/TaskActivityLog');
const Task = require('../models/Task');
const Project = require('../models/Project');
const UserFacility = require('../models/UserFacility');

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

exports.getActivityLogsByTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.userId;

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const activityLogs = await TaskActivityLog.findByTask(taskId);
    res.json(activityLogs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Server error fetching activity logs' });
  }
};

exports.createActivityLog = async (req, res) => {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    const { action, details, metadata } = req.body;

    // Validate input
    if (!action || typeof action !== 'string' || action.trim().length === 0) {
      return res.status(400).json({ message: 'Activity action is required and must be a non-empty string' });
    }

    if (action.length > 100) {
      return res.status(400).json({ message: 'Activity action must be less than 100 characters' });
    }

    if (details && (typeof details !== 'string' || details.length > 500)) {
      return res.status(400).json({ message: 'Activity details must be a string less than 500 characters' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const activityData = {
      action: action.trim(),
      details: details ? details.trim() : null,
      metadata: metadata || {}
    };

    const activityLog = await TaskActivityLog.createActivityLog(activityData, taskId, userId);
    res.status(201).json(activityLog);
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ message: 'Server error creating activity log' });
  }
};
