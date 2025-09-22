const TaskTimeLog = require('../models/TaskTimeLog');
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

// Get all time logs for the authenticated user
exports.getAllTimeLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const timeLogs = await TaskTimeLog.findByField('userId', userId);
    
    // Enrich with task and project information
    const enrichedTimeLogs = await Promise.all(
      timeLogs.map(async (timeLog) => {
        try {
          const task = await Task.findById(timeLog.taskId);
          if (task) {
            const project = await Project.findById(task.projectId);
            return {
              ...timeLog,
              taskTitle: task.title,
              projectId: task.projectId,
              projectName: project ? project.name : 'Unknown Project'
            };
          }
          return timeLog;
        } catch (error) {
          console.error('Error enriching time log:', error);
          return timeLog;
        }
      })
    );

    res.json(enrichedTimeLogs);
  } catch (error) {
    console.error('Error fetching all time logs:', error);
    res.status(500).json({ message: 'Server error fetching time logs' });
  }
};

// Get time logs by project
exports.getTimeLogsByProject = async (req, res) => {
  try {
    const userId = req.userId;
    const projectId = req.params.projectId;

    // Check if user has access to the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userFacility = await UserFacility.findByUserAndFacility(userId, project.facilityId);
    if (userFacility.length === 0) {
      return res.status(403).json({ message: 'Access denied: User is not a member of the facility' });
    }

    // Get all tasks for the project
    const tasks = await Task.findByField('projectId', projectId);
    const taskIds = tasks.map(task => task.id);

    // Get time logs for all tasks in the project
    const timeLogs = [];
    for (const taskId of taskIds) {
      const taskTimeLogs = await TaskTimeLog.findByTask(taskId);
      timeLogs.push(...taskTimeLogs);
    }

    // Filter by user
    const userTimeLogs = timeLogs.filter(log => log.userId === userId);

    res.json(userTimeLogs);
  } catch (error) {
    console.error('Error fetching time logs by project:', error);
    res.status(500).json({ message: 'Server error fetching time logs' });
  }
};

// Get time logs by date range
exports.getTimeLogsByDateRange = async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Get all time logs for the user
    const allTimeLogs = await TaskTimeLog.findByField('userId', userId);
    
    // Filter by date range
    const filteredTimeLogs = allTimeLogs.filter(timeLog => {
      const logDate = new Date(timeLog.startTime);
      return logDate >= start && logDate <= end;
    });

    res.json(filteredTimeLogs);
  } catch (error) {
    console.error('Error fetching time logs by date range:', error);
    res.status(500).json({ message: 'Server error fetching time logs' });
  }
};

// Get time log summary
exports.getTimeLogSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const allTimeLogs = await TaskTimeLog.findByField('userId', userId);

    // Calculate today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Filter today's time logs
    const todayTimeLogs = allTimeLogs.filter(timeLog => {
      const logDate = new Date(timeLog.startTime);
      return logDate >= startOfDay && logDate < endOfDay;
    });

    // Calculate totals
    const totalTime = allTimeLogs.reduce((total, log) => total + (log.duration || 0), 0);
    const todayTime = todayTimeLogs.reduce((total, log) => total + (log.duration || 0), 0);
    const activeTasks = allTimeLogs.filter(log => !log.endTime).length;

    const summary = {
      totalTime,
      totalEntries: allTimeLogs.length,
      todayTime,
      todayEntries: todayTimeLogs.length,
      activeTasks
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching time log summary:', error);
    res.status(500).json({ message: 'Server error fetching time log summary' });
  }
};

// Get running time logs
exports.getRunningTimeLogs = async (req, res) => {
  try {
    const userId = req.userId;
    const allTimeLogs = await TaskTimeLog.findByField('userId', userId);
    
    // Filter running time logs (no end time)
    const runningTimeLogs = allTimeLogs.filter(timeLog => !timeLog.endTime);

    res.json(runningTimeLogs);
  } catch (error) {
    console.error('Error fetching running time logs:', error);
    res.status(500).json({ message: 'Server error fetching running time logs' });
  }
};

// Start time tracking
exports.startTimeTracking = async (req, res) => {
  try {
    const userId = req.userId;
    const taskId = req.params.taskId;
    const { description } = req.body;

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    // Check if there's already a running time log for this task
    const existingTimeLogs = await TaskTimeLog.findByTask(taskId);
    const runningLog = existingTimeLogs.find(log => log.userId === userId && !log.endTime);
    
    if (runningLog) {
      return res.status(400).json({ message: 'You already have a running time log for this task' });
    }

    const timeLogData = {
      description: description || 'Work session',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0
    };

    const timeLog = await TaskTimeLog.createTimeLog(timeLogData, taskId, userId);
    res.status(201).json(timeLog);
  } catch (error) {
    console.error('Error starting time tracking:', error);
    res.status(500).json({ message: 'Server error starting time tracking' });
  }
};

// Stop time tracking
exports.stopTimeTracking = async (req, res) => {
  try {
    const userId = req.userId;
    const { taskId, timeLogId } = req.params;

    // Get the time log
    const timeLog = await TaskTimeLog.findById(timeLogId);
    if (!timeLog) {
      return res.status(404).json({ message: 'Time log not found' });
    }

    // Check if user owns the time log
    if (timeLog.userId !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only stop your own time logs' });
    }

    // Check if time log is already stopped
    if (timeLog.endTime) {
      return res.status(400).json({ message: 'Time log is already stopped' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - new Date(timeLog.startTime).getTime()) / 1000);

    const updatedTimeLog = await TaskTimeLog.updateTimeLog(timeLogId, {
      endTime: endTime.toISOString(),
      duration
    });

    res.json(updatedTimeLog);
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    res.status(500).json({ message: 'Server error stopping time tracking' });
  }
};
