const Project = require('../models/Project');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const TaskAttachment = require('../models/TaskAttachment');
const TaskDependency = require('../models/TaskDependency');
const TaskSubtask = require('../models/TaskSubtask');
const TaskTimeLog = require('../models/TaskTimeLog');
const TaskActivityLog = require('../models/TaskActivityLog');


exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

exports.getProjectsByFacility = async (req, res) => {
  try {
    const projects = await Project.findByFacility(req.params.facilityId);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects by facility:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { facilityId, ...projectData } = req.body;
    const creatorId = req.userId; // Get authenticated user ID from middleware
    const project = await Project.createProject(projectData, facilityId, creatorId);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const updatedProject = await Project.update(req.params.id, req.body);
    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Starting cascading delete for project: ${projectId}`);

    // Get all tasks in this project
    const tasks = await Task.findByProject(projectId);
    console.log(`Found ${tasks.length} tasks in project ${projectId}`);

    // Delete all tasks and their related data
    const taskDeletePromises = tasks.map(async (task) => {
      console.log(`Deleting task ${task.id} and all related data`);
      
      // Delete all task-related data in parallel
      const taskRelatedDeletePromises = [
        // Delete task comments
        TaskComment.findByTask(task.id).then(comments => {
          if (comments && comments.length > 0) {
            console.log(`Deleting ${comments.length} comments for task ${task.id}`);
            return Promise.all(comments.map(comment => TaskComment.delete(comment.id)));
          }
          return [];
        }),
        
        // Delete task attachments
        TaskAttachment.findByTask(task.id).then(attachments => {
          if (attachments && attachments.length > 0) {
            console.log(`Deleting ${attachments.length} attachments for task ${task.id}`);
            return Promise.all(attachments.map(attachment => TaskAttachment.delete(attachment.id)));
          }
          return [];
        }),
        
        // Delete task dependencies
        TaskDependency.findByTask(task.id).then(dependencies => {
          if (dependencies && dependencies.length > 0) {
            console.log(`Deleting ${dependencies.length} dependencies for task ${task.id}`);
            return Promise.all(dependencies.map(dependency => TaskDependency.delete(dependency.id)));
          }
          return [];
        }),
        
        // Delete task subtasks
        TaskSubtask.findByTask(task.id).then(subtasks => {
          if (subtasks && subtasks.length > 0) {
            console.log(`Deleting ${subtasks.length} subtasks for task ${task.id}`);
            return Promise.all(subtasks.map(subtask => TaskSubtask.delete(subtask.id)));
          }
          return [];
        }),
        
        // Delete task time logs
        TaskTimeLog.findByTask(task.id).then(timeLogs => {
          if (timeLogs && timeLogs.length > 0) {
            console.log(`Deleting ${timeLogs.length} time logs for task ${task.id}`);
            return Promise.all(timeLogs.map(timeLog => TaskTimeLog.delete(timeLog.id)));
          }
          return [];
        }),
        
        // Delete task activity logs
        TaskActivityLog.findByTask(task.id).then(activityLogs => {
          if (activityLogs && activityLogs.length > 0) {
            console.log(`Deleting ${activityLogs.length} activity logs for task ${task.id}`);
            return Promise.all(activityLogs.map(activityLog => TaskActivityLog.delete(activityLog.id)));
          }
          return [];
        })
      ];

      // Wait for all task-related data to be deleted
      await Promise.all(taskRelatedDeletePromises);
      
      // Delete the task itself
      return Task.delete(task.id);
    });

    // Wait for all tasks to be deleted
    await Promise.all(taskDeletePromises);
    console.log(`All tasks and related data deleted for project ${projectId}`);

    // Finally delete the project itself
    const deleted = await Project.delete(projectId);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log(`Project ${projectId} deleted successfully`);
    res.json({ message: 'Project and all related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
};


exports.archiveProject = async (req, res) => {
  try {
    const archivedProject = await Project.archiveProject(req.params.id);
    if (!archivedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project archived successfully', project: archivedProject });
  } catch (error) {
    console.error('Error archiving project:', error);
    res.status(500).json({ message: 'Server error archiving project' });
  }
};
