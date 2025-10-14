const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const TaskAttachment = require('../models/TaskAttachment');
const TaskDependency = require('../models/TaskDependency');
const TaskSubtask = require('../models/TaskSubtask');
const TaskTimeLog = require('../models/TaskTimeLog');
const TaskActivityLog = require('../models/TaskActivityLog');
const Project = require('../models/Project');
const UserFacility = require('../models/UserFacility');
const ActivityLoggerService = require('../services/activityLoggerService');
const cacheService = require('../services/cacheService');
const notificationService = require('../services/notificationService');

// Helper function to check if user has access to a task
const checkTaskAccess = async (taskId, userId) => {
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    try {
      const userFacility = await UserFacility.findByUserAndFacility(userId, project.facilityId);
      if (userFacility.length === 0) {
        throw new Error('Access denied: User is not a member of the facility');
      }
    } catch (accessError) {
      if (accessError.message && accessError.message.includes('index')) {
        // Fallback: Check if user has any relationship with this facility
        const userFacilities = await UserFacility.findByUser(userId);
        const hasAccess = userFacilities.some(uf => uf.facilityId === project.facilityId);
        if (!hasAccess) {
          throw new Error('Access denied: User is not a member of the facility');
        }
      } else {
        throw accessError;
      }
    }

    return { task, project, facilityId: project.facilityId };
  } catch (error) {
    // If it's a Firestore index error, provide a more helpful message
    if (error.message && error.message.includes('index')) {
      console.error('Firestore index error in checkTaskAccess:', error.message);
      throw new Error('Database index is being created. Please try again in a few minutes.');
    }
    throw error;
  }
};

exports.getTasks = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Add pagination and limits to prevent excessive reads
    const { page = 1, limit = 50, status, priority, assignee } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get user's facilities where they are owner or manager
    const userFacilities = await UserFacility.findByUser(userId);
    const authorizedFacilities = userFacilities.filter(uf => 
      uf.role === 'owner' || uf.role === 'manager'
    );
    
    if (authorizedFacilities.length === 0) {
      return res.json([]); // User has no authorized facilities
    }
    
    // Get all projects from authorized facilities
    const facilityIds = authorizedFacilities.map(uf => uf.facilityId);
    const projects = await Project.findByFacilities(facilityIds);
    const projectIds = projects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return res.json([]); // No projects in authorized facilities
    }
    
    // Build filters for tasks from authorized projects only
    const filters = [
      { field: 'projectId', operator: 'in', value: projectIds }
    ];
    
    if (status) filters.push({ field: 'status', operator: '==', value: status });
    if (priority) filters.push({ field: 'priority', operator: '==', value: priority });
    if (assignee) filters.push({ field: 'assigneeId', operator: '==', value: assignee });
    
    const tasks = await Task.query(filters, {
      limit: parseInt(limit),
      offset: offset,
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
    
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

    // Normalize assignee fields for client
    if (task.assigneeId && !task.assignee) {
      task.assignee = task.assigneeId;
    }
    if (task.assigneeIds && !task.assignees) {
      task.assignees = task.assigneeIds;
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

    // Normalize assignee fields for client
    if (task.assigneeId && !task.assignee) {
      task.assignee = task.assigneeId;
    }
    if (task.assigneeIds && !task.assignees) {
      task.assignees = task.assigneeIds;
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
    const { projectId } = req.params;
    const { page = 1, limit = 50, status, priority, assignee } = req.query;
    
    // Validate project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check user access to the project's facility
    const userFacility = await UserFacility.findByUserAndFacility(req.userId, project.facilityId);
    if (userFacility.length === 0) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }
    
    // Build filters for efficient Firestore query
    const filters = [{ field: 'projectId', operator: '==', value: projectId }];
    if (status) filters.push({ field: 'status', operator: '==', value: status });
    if (priority) filters.push({ field: 'priority', operator: '==', value: priority });
    if (assignee) filters.push({ field: 'assigneeId', operator: '==', value: assignee });
    
    // Apply pagination at database level to reduce reads
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;
    
    // Use optimized query with filters and pagination
    const tasks = await Task.query(filters, {
      limit: limitNum,
      offset: offset,
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
    
    const paginatedTasks = tasks;
    
    // Get unique assignee IDs for batch lookup
    const assigneeIds = [...new Set(paginatedTasks.map(task => task.assigneeId).filter(Boolean))];
    // Batch fetch user profiles
    const User = require('../models/User');
    const userProfiles = assigneeIds.length > 0 
      ? await User.getProfilesByIds(assigneeIds)
      : {};
    
    // Map tasks with assignee names
    const tasksWithAssigneeNames = paginatedTasks.map(task => {
      const taskData = { ...task };
      
      // Standardize field names for client
      if (task.assigneeId) {
        taskData.assignee = task.assigneeId;
        taskData.assigneeName = userProfiles[task.assigneeId]?.displayName || 
                               userProfiles[task.assigneeId]?.email || 
                               'Unknown User';
        taskData.assigneeProfilePicture = userProfiles[task.assigneeId]?.profilePicture;
      }
      
      // Convert timestamps to ISO strings
      if (task.createdAt && typeof task.createdAt.toDate === 'function') {
        taskData.createdAt = task.createdAt.toDate().toISOString();
      } else if (task.createdAt instanceof Date) {
        taskData.createdAt = task.createdAt.toISOString();
      }
      
      if (task.updatedAt && typeof task.updatedAt.toDate === 'function') {
        taskData.updatedAt = task.updatedAt.toDate().toISOString();
      } else if (task.updatedAt instanceof Date) {
        taskData.updatedAt = task.updatedAt.toISOString();
      }
      
      return taskData;
    });
    
    // Check if client expects pagination response or simple array
    const expectsPagination = req.query.page || req.query.limit;
    
    if (expectsPagination) {
      res.json({
        tasks: tasksWithAssigneeNames,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: tasks.length,
          pages: Math.ceil(tasks.length / limitNum)
        }
      });
    } else {
      // Backward compatibility - return simple array
      res.json(tasksWithAssigneeNames);
    }
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    res.status(500).json({ 
      message: 'Server error fetching tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    // Input validation is now handled by middleware

    // Check project access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check user access to the project's facility
    const userFacility = await UserFacility.findByUserAndFacility(creatorId, project.facilityId);
    if (userFacility.length === 0) {
      return res.status(403).json({ message: 'Access denied to this project' });
    }

    // Task data is already validated and sanitized by middleware
    const sanitizedTaskData = {
      ...taskData,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || null,
      tags: taskData.tags || [],
      progress: taskData.progress || 0
    };

    const task = await Task.createTask(sanitizedTaskData, projectId, creatorId);

    // Log activity
    await ActivityLoggerService.logTaskCreated(task.id, creatorId, sanitizedTaskData.title);

    // Send notifications for task assignment
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      for (const assigneeId of task.assigneeIds) {
        if (assigneeId !== creatorId) { // Don't notify the creator
          try {
            await notificationService.createTaskAssignedNotification(
              task.id,
              assigneeId,
              creatorId,
              task.title,
              project.name,
              project.facilityId
            );
          } catch (notificationError) {
            console.error('Error sending task assignment notification:', notificationError);
            // Don't fail the task creation if notification fails
          }
        }
      }
    }

    // Invalidate cache for project task counts and facility stats
    cacheService.invalidateProjectTasksCount(projectId);
    cacheService.invalidateFacilityStats(project.facilityId);

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

    // Standardize field names for client
    if (task.assigneeId && !task.assignee) {
      task.assignee = task.assigneeId;
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      message: 'Server error creating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const payload = { ...req.body };
    // Map client 'assignee' to server 'assigneeId' (backward compatibility)
    if (typeof payload.assignee !== 'undefined') {
      payload.assigneeId = payload.assignee || null;
      delete payload.assignee;
    }
    // Map client 'assignees' to server 'assigneeIds'
    if (typeof payload.assignees !== 'undefined') {
      payload.assigneeIds = payload.assignees || [];
      delete payload.assignees;
    }
    
    // Get the original task to check if projectId changed
    const originalTask = await Task.findById(req.params.id);
    const oldProjectId = originalTask?.projectId;
    
    const updatedTask = await Task.update(req.params.id, payload);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Log activity
    await ActivityLoggerService.logTaskUpdated(req.params.id, req.userId, payload);

    // Send notifications for task updates
    try {
      const project = await Project.findById(updatedTask.projectId);
      if (project && updatedTask.assigneeIds && updatedTask.assigneeIds.length > 0) {
        // Check if assignees were changed
        const originalAssigneeIds = originalTask.assigneeIds || [];
        const newAssigneeIds = updatedTask.assigneeIds || [];
        const assigneesChanged = JSON.stringify(originalAssigneeIds.sort()) !== JSON.stringify(newAssigneeIds.sort());
        
        // Determine what type of update occurred
        let updateType = 'updated';
        let notificationType = 'task_updated';
        
        // Use the database user ID for notifications
        const updaterUserId = req.user?.id || req.userId;
        
        if (assigneesChanged) {
          // New assignees were added - send task_assigned notifications to new assignees only
          const newAssignees = newAssigneeIds.filter(id => !originalAssigneeIds.includes(id));
          const removedAssignees = originalAssigneeIds.filter(id => !newAssigneeIds.includes(id));
          
          // Send task_assigned notifications to new assignees
          for (const assigneeId of newAssignees) {
            if (assigneeId !== updaterUserId) {
              try {
                await notificationService.createTaskAssignedNotification(
                  updatedTask.id,
                  assigneeId,
                  updaterUserId,
                  updatedTask.title,
                  project.name,
                  project.facilityId
                );
              } catch (notificationError) {
                console.error('Error sending task assignment notification:', notificationError);
              }
            }
          }
          
          // Send task_updated notification to existing assignees about assignee changes
          const existingAssignees = newAssigneeIds.filter(id => originalAssigneeIds.includes(id));
          for (const assigneeId of existingAssignees) {
            if (assigneeId !== updaterUserId) {
              try {
                await notificationService.createTaskUpdatedNotification(
                  updatedTask.id,
                  [assigneeId],
                  updaterUserId,
                  updatedTask.title,
                  `assignees updated (${newAssignees.length} added, ${removedAssignees.length} removed)`,
                  project.facilityId
                );
              } catch (notificationError) {
                console.error('Error sending task update notification:', notificationError);
              }
            }
          }
        } else {
          // No assignee changes - send regular update notifications
          if (payload.status && payload.status !== originalTask.status) {
            updateType = `status changed to ${payload.status}`;
          } else if (payload.priority && payload.priority !== originalTask.priority) {
            updateType = `priority changed to ${payload.priority}`;
          } else if (payload.dueDate && payload.dueDate !== originalTask.dueDate) {
            updateType = 'due date updated';
          }

          // Notify all assignees except the person who made the update
          for (const assigneeId of updatedTask.assigneeIds) {
            if (assigneeId !== updaterUserId) {
              try {
                await notificationService.createTaskUpdatedNotification(
                  updatedTask.id,
                  [assigneeId],
                  updaterUserId,
                  updatedTask.title,
                  updateType,
                  project.facilityId
                );
              } catch (notificationError) {
                console.error('Error sending task update notification:', notificationError);
              }
            }
          }
        }
      }
    } catch (notificationError) {
      console.error('Error processing task update notifications:', notificationError);
      // Don't fail the task update if notification processing fails
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

    // Normalize assignee fields for client
    if (updatedTask.assigneeId && !updatedTask.assignee) {
      updatedTask.assignee = updatedTask.assigneeId;
    }
    if (updatedTask.assigneeIds && !updatedTask.assignees) {
      updatedTask.assignees = updatedTask.assigneeIds;
    }

    // Invalidate cache for project task counts and facility stats
    cacheService.invalidateProjectTasksCount(updatedTask.projectId);
    cacheService.invalidateProjectTasks(updatedTask.projectId);
    
    // If projectId changed, also invalidate the old project's cache
    if (oldProjectId && oldProjectId !== updatedTask.projectId) {
      cacheService.invalidateProjectTasksCount(oldProjectId);
      cacheService.invalidateProjectTasks(oldProjectId);
    }
    
    const project = await Project.findById(updatedTask.projectId);
    if (project) {
      cacheService.invalidateFacilityStats(project.facilityId);
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      taskId: req.params.id,
      payload: req.body
    });
    res.status(500).json({ message: 'Server error updating task' });
  }
};

exports.pinTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { pinned } = req.body;
    
    // Check if task exists and user has access
    try {
      await checkTaskAccess(taskId, req.userId);
    } catch (error) {
      return res.status(403).json({ message: error.message });
    }

    const updatedTask = await Task.update(taskId, { pinned: Boolean(pinned) });
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Log activity
    await ActivityLoggerService.logTaskUpdated(taskId, req.userId, { pinned: Boolean(pinned) });

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

    // Map server fields to client fields for backward compatibility
    if (updatedTask.assigneeId && !updatedTask.assignee) {
      updatedTask.assignee = updatedTask.assigneeId;
    }
    if (updatedTask.assigneeIds && !updatedTask.assignees) {
      updatedTask.assignees = updatedTask.assigneeIds;
    }

    // Invalidate cache for project task counts and facility stats
    cacheService.invalidateProjectTasksCount(updatedTask.projectId);
    cacheService.invalidateProjectTasks(updatedTask.projectId); // CRITICAL: Invalidate cached tasks too!
    
    // If projectId changed, also invalidate the old project's cache
    if (oldProjectId && oldProjectId !== updatedTask.projectId) {
      console.log(`Task moved from project ${oldProjectId} to ${updatedTask.projectId}, invalidating both caches`);
      cacheService.invalidateProjectTasksCount(oldProjectId);
      cacheService.invalidateProjectTasks(oldProjectId);
    }
    
    const project = await Project.findById(updatedTask.projectId);
    if (project) {
      cacheService.invalidateFacilityStats(project.facilityId);
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    
    // Handle specific error types
    if (error.message && error.message.includes('index')) {
      return res.status(400).json({ 
        message: 'Database index is being created. Please try again in a few minutes.',
        error: 'INDEX_CREATING'
      });
    }
    
    if (error.message && error.message.includes('Access denied')) {
      return res.status(403).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: 'Server error updating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Check if task exists and user has access
    let task, project, facilityId;
    try {
      const accessResult = await checkTaskAccess(taskId, req.userId);
      task = accessResult.task;
      project = accessResult.project;
      facilityId = accessResult.facilityId;
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }


    // Delete all related data in parallel for better performance
    const deletePromises = [
      // Delete task comments
      TaskComment.findByTask(taskId).then(comments => {
        if (comments && comments.length > 0) {
          return Promise.all(comments.map(comment => TaskComment.delete(comment.id)));
        }
        return [];
      }),
      
      // Delete task attachments
      TaskAttachment.findByTask(taskId).then(attachments => {
        if (attachments && attachments.length > 0) {
          return Promise.all(attachments.map(attachment => TaskAttachment.delete(attachment.id)));
        }
        return [];
      }),
      
      // Delete task dependencies
      TaskDependency.findByTask(taskId).then(dependencies => {
        if (dependencies && dependencies.length > 0) {
          return Promise.all(dependencies.map(dependency => TaskDependency.delete(dependency.id)));
        }
        return [];
      }),
      
      // Delete task subtasks
      TaskSubtask.findByTask(taskId).then(subtasks => {
        if (subtasks && subtasks.length > 0) {
          return Promise.all(subtasks.map(subtask => TaskSubtask.delete(subtask.id)));
        }
        return [];
      }),
      
      // Delete task time logs
      TaskTimeLog.findByTask(taskId).then(timeLogs => {
        if (timeLogs && timeLogs.length > 0) {
          return Promise.all(timeLogs.map(timeLog => TaskTimeLog.delete(timeLog.id)));
        }
        return [];
      }),
      
      // Delete task activity logs
      TaskActivityLog.findByTask(taskId).then(activityLogs => {
        if (activityLogs && activityLogs.length > 0) {
          return Promise.all(activityLogs.map(activityLog => TaskActivityLog.delete(activityLog.id)));
        }
        return [];
      })
    ];

    // Wait for all related data to be deleted
    await Promise.all(deletePromises);

    // Finally delete the task itself
    const deleted = await Task.delete(taskId);
    if (!deleted) {
      return res.status(404).json({ message: 'Task not found' });
    }

    
    // Invalidate cache for project task counts and facility stats
    cacheService.invalidateProjectTasksCount(task.projectId);
    cacheService.invalidateFacilityStats(facilityId);
    
    res.json({ message: 'Task and all related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

// Bulk update task statuses
exports.bulkUpdateTaskStatus = async (req, res) => {
  try {
    const { taskIds, status } = req.body;
    
    // Validate input
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'taskIds must be a non-empty array' });
    }
    
    const validStatuses = ['todo', 'in-progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Check access for all tasks
    const tasks = [];
    const projectIds = new Set();
    
    for (const taskId of taskIds) {
      try {
        const accessResult = await checkTaskAccess(taskId, req.userId);
        tasks.push(accessResult.task);
        projectIds.add(accessResult.task.projectId);
      } catch (accessError) {
        return res.status(403).json({ 
          message: `Access denied to task ${taskId}: ${accessError.message}` 
        });
      }
    }
    
    // Update all tasks
    const updatePromises = taskIds.map(taskId => 
      Task.update(taskId, { status })
    );
    
    const updatedTasks = await Promise.all(updatePromises);
    
    // Log activity for each task
    const activityPromises = taskIds.map(taskId => 
      ActivityLoggerService.logTaskUpdated(taskId, req.userId, { status })
    );
    await Promise.all(activityPromises);
    
    // Invalidate cache for all affected projects
    for (const projectId of projectIds) {
      cacheService.invalidateProjectTasksCount(projectId);
    }
    
    // Get facility IDs for cache invalidation
    const facilityPromises = Array.from(projectIds).map(async (projectId) => {
      const project = await Project.findById(projectId);
      return project ? project.facilityId : null;
    });
    const facilityIds = await Promise.all(facilityPromises);
    
    // Invalidate facility stats cache
    for (const facilityId of facilityIds) {
      if (facilityId) {
        cacheService.invalidateFacilityStats(facilityId);
      }
    }
    
    res.json({ 
      message: `Successfully updated ${updatedTasks.length} tasks to ${status}`,
      updatedCount: updatedTasks.length,
      status 
    });
    
  } catch (error) {
    console.error('Error bulk updating task statuses:', error);
    res.status(500).json({ message: 'Server error bulk updating task statuses' });
  }
};