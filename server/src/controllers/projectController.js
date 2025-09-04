const Project = require('../models/Project');

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
    const project = await Project.createProject(req.body);
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
