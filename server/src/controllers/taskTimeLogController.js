const TaskTimeLog = require('../models/TaskTimeLog');
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

exports.getTimeLogsByTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.userId;

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const timeLogs = await TaskTimeLog.findByTask(taskId);
    res.json(timeLogs);
  } catch (error) {
    console.error('Error fetching time logs:', error);
    res.status(500).json({ message: 'Server error fetching time logs' });
  }
};

exports.createTimeLog = async (req, res) => {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    const { description, startTime, endTime, duration } = req.body;

    // Validate input
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ message: 'Time log description is required and must be a non-empty string' });
    }

    if (description.length > 500) {
      return res.status(400).json({ message: 'Time log description must be less than 500 characters' });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for start time or end time' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const calculatedDuration = duration || Math.floor((end.getTime() - start.getTime()) / 1000);

    const timeLogData = {
      description: description.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: calculatedDuration
    };

    const timeLog = await TaskTimeLog.createTimeLog(timeLogData, taskId, userId);

    // Log activity
    await ActivityLoggerService.logTimeLogAdded(taskId, userId, calculatedDuration, description.trim());

    res.status(201).json(timeLog);
  } catch (error) {
    console.error('Error creating time log:', error);
    res.status(500).json({ message: 'Server error creating time log' });
  }
};

exports.updateTimeLog = async (req, res) => {
  try {
    const userId = req.userId;
    const { timeLogId } = req.params;
    const { description, startTime, endTime, duration } = req.body;

    // Validate input
    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({ message: 'Time log description must be a non-empty string' });
      }
      if (description.length > 500) {
        return res.status(400).json({ message: 'Time log description must be less than 500 characters' });
      }
    }

    if (startTime !== undefined || endTime !== undefined) {
      const start = startTime ? new Date(startTime) : null;
      const end = endTime ? new Date(endTime) : null;

      if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      if (start && end && start >= end) {
        return res.status(400).json({ message: 'End time must be after start time' });
      }
    }

    // Get time log to check ownership and access
    const timeLog = await TaskTimeLog.findById(timeLogId);
    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    // Check if user owns the time log
    if (timeLog.userId !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own time logs' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(timeLog.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const updateData = {};
    if (description !== undefined) updateData.description = description.trim();
    if (startTime !== undefined) updateData.startTime = new Date(startTime).toISOString();
    if (endTime !== undefined) updateData.endTime = new Date(endTime).toISOString();
    if (duration !== undefined) updateData.duration = duration;

    const updatedTimeLog = await TaskTimeLog.updateTimeLog(timeLogId, updateData);
    if (!updatedTimeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    res.json(updatedTimeLog);
  } catch (error) {
    console.error('Error updating time log:', error);
    res.status(500).json({ message: 'Server error updating time log' });
  }
};

exports.deleteTimeLog = async (req, res) => {
  try {
    const userId = req.userId;
    const { timeLogId } = req.params;

    // Get time log info before deletion
    const timeLog = await TaskTimeLog.findById(timeLogId);
    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    // Check if user owns the time log
    if (timeLog.userId !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own time logs' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(timeLog.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const deleted = await TaskTimeLog.deleteTimeLog(timeLogId);
    if (!deleted) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    res.json({ message: 'Time log deleted successfully' });
  } catch (error) {
    console.error('Error deleting time log:', error);
    res.status(500).json({ message: 'Server error deleting time log' });
  }
};
