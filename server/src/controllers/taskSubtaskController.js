const TaskSubtask = require('../models/TaskSubtask');
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

exports.getSubtasksByTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.userId;

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const subtasks = await TaskSubtask.findByTask(taskId);
    res.json(subtasks);
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ message: 'Server error fetching subtasks' });
  }
};

exports.createSubtask = async (req, res) => {
  try {
    const creatorId = req.userId;
    const { taskId } = req.params;
    const { title, description, isCompleted } = req.body;

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ message: 'Subtask title is required and must be a non-empty string' });
    }

    if (title.length > 200) {
      return res.status(400).json({ message: 'Subtask title must be less than 200 characters' });
    }

    if (description && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({ message: 'Subtask description must be a string less than 500 characters' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, creatorId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const subtaskData = {
      title: title.trim(),
      description: description ? description.trim() : null,
      isCompleted: isCompleted || false
    };

    const subtask = await TaskSubtask.createSubtask(subtaskData, taskId, creatorId);

    // Log activity
    await ActivityLoggerService.logSubtaskAdded(taskId, creatorId, title.trim());

    res.status(201).json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ message: 'Server error creating subtask' });
  }
};

exports.updateSubtask = async (req, res) => {
  try {
    const userId = req.userId;
    const { subtaskId } = req.params;
    const { title, description, isCompleted } = req.body;

    // Validate input
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Subtask title must be a non-empty string' });
      }
      if (title.length > 200) {
        return res.status(400).json({ message: 'Subtask title must be less than 200 characters' });
      }
    }

    if (description !== undefined && (typeof description !== 'string' || description.length > 500)) {
      return res.status(400).json({ message: 'Subtask description must be a string less than 500 characters' });
    }

    // Get subtask to check ownership and access
    const subtask = await TaskSubtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(subtask.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const updatedSubtask = await TaskSubtask.updateSubtask(subtaskId, updateData);
    if (!updatedSubtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    // Log activity based on changes
    if (isCompleted !== undefined && isCompleted !== subtask.isCompleted) {
      if (isCompleted) {
        await ActivityLoggerService.logSubtaskCompleted(subtask.taskId, userId, subtask.title);
      } else {
        await ActivityLoggerService.logSubtaskUncompleted(subtask.taskId, userId, subtask.title);
      }
    }

    res.json(updatedSubtask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ message: 'Server error updating subtask' });
  }
};

exports.deleteSubtask = async (req, res) => {
  try {
    const userId = req.userId;
    const { subtaskId } = req.params;

    // Get subtask info before deletion
    const subtask = await TaskSubtask.findById(subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(subtask.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const deleted = await TaskSubtask.deleteSubtask(subtaskId);
    if (!deleted) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    // Log activity
    await ActivityLoggerService.logSubtaskDeleted(subtask.taskId, userId, subtask.title);

    res.json({ message: 'Subtask deleted successfully' });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ message: 'Server error deleting subtask' });
  }
};
