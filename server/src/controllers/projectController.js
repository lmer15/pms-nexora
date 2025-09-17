const Project = require('../models/Project');
const Task = require('../models/Task');


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
    // First, delete all tasks associated with the project
    const tasks = await Task.findByProject(req.params.id);
    for (const task of tasks) {
      await Task.delete(task.id);
    }

    // Then delete the project
    const deleted = await Project.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
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
