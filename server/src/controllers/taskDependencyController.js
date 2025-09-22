const TaskDependency = require('../models/TaskDependency');
const Task = require('../models/Task');
const Project = require('../models/Project');
const UserFacility = require('../models/UserFacility');
const User = require('../models/User');
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
    
    // Enrich dependencies with task details and user profiles
    const enrichedDependencies = await Promise.all(
      dependencies.map(async (dependency) => {
        try {
          const [dependentTask, creatorProfile] = await Promise.all([
            Task.findById(dependency.dependencyId),
            User.findById(dependency.creatorId)
          ]);
          
          return {
            ...dependency,
            dependentTask: dependentTask ? {
              id: dependentTask.id,
              title: dependentTask.title,
              status: dependentTask.status,
              projectId: dependentTask.projectId
            } : null,
            creatorProfile: creatorProfile ? {
              id: creatorProfile.id,
              firstName: creatorProfile.firstName,
              lastName: creatorProfile.lastName,
              email: creatorProfile.email
            } : null
          };
        } catch (error) {
          console.error(`Error fetching dependency data for ${dependency.id}:`, error);
          return {
            ...dependency,
            dependentTask: null,
            creatorProfile: null
          };
        }
      })
    );

    res.json(enrichedDependencies);
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ message: 'Server error fetching dependencies' });
  }
};

exports.createDependency = async (req, res) => {
  try {
    const creatorId = req.userId;
    const { taskId } = req.params;
    const { dependencyId, dependencyType, description } = req.body;

    // Validate input
    if (!dependencyId || !dependencyType) {
      return res.status(400).json({ message: 'dependencyId and dependencyType are required' });
    }

    if (!['blocks', 'blocked-by', 'related'].includes(dependencyType)) {
      return res.status(400).json({ message: 'Invalid dependency type. Must be blocks, blocked-by, or related' });
    }

    // Check user access to the main task
    let mainTaskAccess;
    try {
      mainTaskAccess = await checkTaskAccess(taskId, creatorId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    // Check user access to the dependent task
    let dependentTaskAccess;
    try {
      dependentTaskAccess = await checkTaskAccess(dependencyId, creatorId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    // Ensure both tasks belong to the same project
    if (mainTaskAccess.task.projectId !== dependentTaskAccess.task.projectId) {
      return res.status(400).json({ 
        message: 'Dependencies can only be created between tasks in the same project' 
      });
    }

    // Check if dependency already exists
    const existingDependencies = await TaskDependency.findByTask(taskId);
    const duplicateDependency = existingDependencies.find(dep => 
      dep.dependencyId === dependencyId && dep.dependencyType === dependencyType
    );
    
    if (duplicateDependency) {
      return res.status(400).json({ message: 'This dependency already exists' });
    }

    const dependencyData = {
      dependencyId,
      dependencyType,
      description: description || ''
    };

    const dependency = await TaskDependency.createDependency(dependencyData, taskId, creatorId);

    // Log activity
    await ActivityLoggerService.logDependencyAdded(taskId, creatorId, dependencyType, dependencyId);

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
      dependency.dependencyId
    );

    res.json({ message: 'Dependency deleted successfully' });
  } catch (error) {
    console.error('Error deleting dependency:', error);
    res.status(500).json({ message: 'Server error deleting dependency' });
  }
};

exports.searchTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { taskId } = req.params;
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    // Check user access to the main task to get project context
    try {
      const { task: mainTask } = await checkTaskAccess(taskId, userId);
      
      // Only search for tasks in the same project
      const tasks = await Task.findByProject(mainTask.projectId);
      
      // Filter tasks by query and exclude the current task
      const filteredTasks = tasks
        .filter(task => 
          task.id !== taskId && 
          (task.title.toLowerCase().includes(query.toLowerCase()) ||
           task.id.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, parseInt(limit))
        .map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          projectId: task.projectId
        }));

      res.json(filteredTasks);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ message: 'Server error searching tasks' });
  }
};
