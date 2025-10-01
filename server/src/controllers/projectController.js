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
    const { facilityId } = req.params;
    
    // Check if user has access to this facility
    const UserFacility = require('../models/UserFacility');
    const userFacility = await UserFacility.findByUserAndFacility(req.userId, facilityId);
    if (userFacility.length === 0) {
      return res.status(403).json({ message: 'Access denied to this facility' });
    }
    
    const projects = await Project.findByFacility(facilityId);
    
    // Convert timestamps to ISO strings for client
    const projectsWithTimestamps = projects.map(project => {
      const projectData = { ...project };
      
      if (project.createdAt && typeof project.createdAt.toDate === 'function') {
        projectData.createdAt = project.createdAt.toDate().toISOString();
      } else if (project.createdAt instanceof Date) {
        projectData.createdAt = project.createdAt.toISOString();
      }
      
      if (project.updatedAt && typeof project.updatedAt.toDate === 'function') {
        projectData.updatedAt = project.updatedAt.toDate().toISOString();
      } else if (project.updatedAt instanceof Date) {
        projectData.updatedAt = project.updatedAt.toISOString();
      }
      
      return projectData;
    });
    
    res.json(projectsWithTimestamps);
  } catch (error) {
    console.error('Error fetching projects by facility:', error);
    res.status(500).json({ 
      message: 'Server error fetching projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { facilityId, ...projectData } = req.body;
    const creatorId = req.userId; // Get authenticated user ID from middleware
    
    // Check if a project with the same name already exists in this facility
    const existingProjects = await Project.findByFacility(facilityId);
    const duplicateProject = existingProjects.find(p => 
      p.name.toLowerCase().trim() === projectData.name.toLowerCase().trim()
    );
    
    if (duplicateProject) {
      return res.status(409).json({ 
        message: 'A project with this name already exists in this facility' 
      });
    }
    
    const project = await Project.createProject(projectData, facilityId, creatorId);
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    console.log('Project update request:', { id: req.params.id, body: req.body });
    const updatedProject = await Project.update(req.params.id, req.body);
    console.log('Project updated successfully:', updatedProject);
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


    // Get all tasks in this project
    const tasks = await Task.findByProject(projectId);

    // Delete all tasks and their related data
    const taskDeletePromises = tasks.map(async (task) => {
      
      // Delete all task-related data in parallel
      const taskRelatedDeletePromises = [
        // Delete task comments
        TaskComment.findByTask(task.id).then(comments => {
          if (comments && comments.length > 0) {
            return Promise.all(comments.map(comment => TaskComment.delete(comment.id)));
          }
          return [];
        }),
        
        // Delete task attachments
        TaskAttachment.findByTask(task.id).then(attachments => {
          if (attachments && attachments.length > 0) {
            return Promise.all(attachments.map(attachment => TaskAttachment.delete(attachment.id)));
          }
          return [];
        }),
        
        // Delete task dependencies
        TaskDependency.findByTask(task.id).then(dependencies => {
          if (dependencies && dependencies.length > 0) {
            return Promise.all(dependencies.map(dependency => TaskDependency.delete(dependency.id)));
          }
          return [];
        }),
        
        // Delete task subtasks
        TaskSubtask.findByTask(task.id).then(subtasks => {
          if (subtasks && subtasks.length > 0) {
            return Promise.all(subtasks.map(subtask => TaskSubtask.delete(subtask.id)));
          }
          return [];
        }),
        
        // Delete task time logs
        TaskTimeLog.findByTask(task.id).then(timeLogs => {
          if (timeLogs && timeLogs.length > 0) {
            return Promise.all(timeLogs.map(timeLog => TaskTimeLog.delete(timeLog.id)));
          }
          return [];
        }),
        
        // Delete task activity logs
        TaskActivityLog.findByTask(task.id).then(activityLogs => {
          if (activityLogs && activityLogs.length > 0) {
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

    // Finally delete the project itself
    const deleted = await Project.delete(projectId);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }

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
