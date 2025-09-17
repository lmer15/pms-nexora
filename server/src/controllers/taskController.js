const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const TaskAttachment = require('../models/TaskAttachment');
const TaskDependency = require('../models/TaskDependency');
const TaskSubtask = require('../models/TaskSubtask');
const TaskTimeLog = require('../models/TaskTimeLog');
const TaskActivityLog = require('../models/TaskActivityLog');
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

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Convert Firestore Timestamp fields to ISO strings for client
    if (task.createdAt && typeof task.createdAt.toDate === 'function') {
      task.createdAt = task.createdAt.toDate().toISOString();
    } else if (task.createdAt instanceof Date) {
      task.createdAt = task.createdAt.toISOString();
    }

    if (task.updatedAt && typeof task.updatedAt.toDate === 'function') {
      task.updatedAt = task.updatedAt.toDate().toISOString();
    } else if (task.updatedAt instanceof Date) {
      task.updatedAt = task.updatedAt.toISOString();
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Server error fetching task' });
  }
};

exports.getTaskDetails = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.userId;

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    // Get task basic info
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Convert Firestore Timestamp fields to ISO strings for client
    if (task.createdAt && typeof task.createdAt.toDate === 'function') {
      task.createdAt = task.createdAt.toDate().toISOString();
    } else if (task.createdAt instanceof Date) {
      task.createdAt = task.createdAt.toISOString();
    }

    if (task.updatedAt && typeof task.updatedAt.toDate === 'function') {
      task.updatedAt = task.updatedAt.toDate().toISOString();
    } else if (task.updatedAt instanceof Date) {
      task.updatedAt = task.updatedAt.toISOString();
    }

    // Get all related data in parallel for better performance
    const [
      comments,
      attachments,
      dependencies,
      subtasks,
      timeLogs,
      activityLogs
    ] = await Promise.all([
      TaskComment.findByTask(taskId),
      TaskAttachment.findByTask(taskId),
      TaskDependency.findByTask(taskId),
      TaskSubtask.findByTask(taskId),
      TaskTimeLog.findByTask(taskId),
      TaskActivityLog.findByTask(taskId)
    ]);

    // Aggregate all task details
    const taskDetails = {
      task,
      comments: comments || [],
      attachments: attachments || [],
      dependencies: dependencies || [],
      subtasks: subtasks || [],
      timeLogs: timeLogs || [],
      activityLogs: activityLogs || []
    };

    res.json(taskDetails);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ message: 'Server error fetching task details' });
  }
};

exports.getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.findByProject(req.params.projectId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

exports.getTasksByUser = async (req, res) => {
  try {
    const tasks = await Task.findByUser(req.params.userId);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by user:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const creatorId = req.userId; // from authMiddleware
    const { projectId, ...taskData } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const task = await Task.createTask(taskData, projectId, creatorId);

    // Convert Firestore Timestamp fields to ISO strings for client
    if (task.createdAt && typeof task.createdAt.toDate === 'function') {
      task.createdAt = task.createdAt.toDate().toISOString();
    } else if (task.createdAt instanceof Date) {
      task.createdAt = task.createdAt.toISOString();
    }

    if (task.updatedAt && typeof task.updatedAt.toDate === 'function') {
      task.updatedAt = task.updatedAt.toDate().toISOString();
    } else if (task.updatedAt instanceof Date) {
      task.updatedAt = task.updatedAt.toISOString();
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const updatedTask = await Task.update(req.params.id, req.body);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Convert Firestore Timestamp fields to ISO strings for client
    if (updatedTask.createdAt && typeof updatedTask.createdAt.toDate === 'function') {
      updatedTask.createdAt = updatedTask.createdAt.toDate().toISOString();
    } else if (updatedTask.createdAt instanceof Date) {
      updatedTask.createdAt = updatedTask.createdAt.toISOString();
    }

    if (updatedTask.updatedAt && typeof updatedTask.updatedAt.toDate === 'function') {
      updatedTask.updatedAt = updatedTask.updatedAt.toDate().toISOString();
    } else if (updatedTask.updatedAt instanceof Date) {
      updatedTask.updatedAt = updatedTask.updatedAt.toISOString();
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
};
