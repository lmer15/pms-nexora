import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LucideBuilding,
  LucideUsers,
  LucideClipboardList,
  LucidePlus,
  LucideArrowLeft,
  LucideMapPin,
  LucideCalendar,
  LucideMoreHorizontal,
  LucideEdit,
  LucideTrash2,
  LucideCheckSquare,
  LucideUserPlus,
  LucideSearch,
  LucideFilter,
  LucideArchive,
} from 'lucide-react';
import { facilityService, Facility } from '../../api/facilityService';
import { projectService, Project } from '../../api/projectService';
import { taskService, Task as ApiTask } from '../../api/taskService';
import { useAuth } from '../../context/AuthContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  dueDate?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const FacilityView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (id) {
      loadFacility();
    }
  }, [id]);

  const loadFacility = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await facilityService.getById(id);
      setFacility(data);
    } catch (err) {
      setError('Failed to load facility details');
      console.error('Error loading facility:', err);
    } finally {
      setLoading(false);
    }
  };

  // Remove modal state and handlers
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const loadProjects = async () => {
    if (!id) return;
    try {
      const data = await projectService.getByFacility(id);
      setProjects([]);
      setSelectedProject(null);
      setColumns([]);
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
        await loadColumnsForProject(data);
      } else {
        setColumns([]);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  // Update columns when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      loadColumnsForProject(projects);
    } else {
      setColumns([]);
    }
  }, [selectedProject, projects]);

  useEffect(() => {
    loadProjects();
  }, [id]);

  // New state for inline project creation
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingLoading, setIsCreatingLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleStartCreateProject = () => {
    setIsCreatingProject(true);
    setNewProjectName('');
    setCreateError('');
  };

  const handleCancelCreateProject = () => {
    setIsCreatingProject(false);
    setNewProjectName('');
    setCreateError('');
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setCreateError('Project name is required');
      return;
    }
    setIsCreatingLoading(true);
    setCreateError('');
    try {
      const newProject = await projectService.create({
        name: newProjectName.trim(),
        facilityId: id || '',
        creatorId: user?.uid || '',
        assignees: [], // optionally set assignees
        status: 'planning',
        archived: false,
      });
    // Immediately update projects list to show new project
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setSelectedProject(newProject);
    setIsCreatingProject(false);
    setNewProjectName('');
    // Load columns for all projects including the new one
    await loadColumnsForProject(updatedProjects);
    } catch (err) {
      setCreateError('Failed to create project. Please try again.');
      console.error('Error creating project:', err);
    } finally {
      setIsCreatingLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [columns, setColumns] = useState<Column[]>([]);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');

  const loadColumnsForProject = async (projectsList: Project[]) => {
    const projectColumns: Column[] = await Promise.all(
      projectsList.map(async (project) => {
        try {
          // Load tasks for this project
          const tasks = await taskService.getByProject(project.id);
          return {
            id: project.id,
            title: project.name,
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              assignee: task.assignee,
              dueDate: task.dueDate,
              creatorId: task.creatorId,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt
            }))
          };
        } catch (error) {
          console.error(`Error loading tasks for project ${project.id}:`, error);
          return {
            id: project.id,
            title: project.name,
            tasks: []
          };
        }
      })
    );
    setColumns(projectColumns);
  };

  const handleCreateTask = async (columnId: string) => {
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      title: '',
      description: '',
      status: 'todo',
      creatorId: user?.uid || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setColumns(prev => prev.map(col =>
      col.id === columnId
        ? { ...col, tasks: [...col.tasks, newTask] }
        : col
    ));

    setEditingTaskId(tempId);
    setEditingTaskTitle('');
  };

  const handleSaveTask = async (taskId: string, columnId: string) => {
    if (!editingTaskTitle.trim()) {
      // Remove the task if no title
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          : col
      ));
      setEditingTaskId(null);
      setEditingTaskTitle('');
      return;
    }

    try {
      // Create task via API with default 'todo' status
      const createdTask = await taskService.create({
        title: editingTaskTitle.trim(),
        projectId: columnId,
        status: 'todo'
      });

      // Replace temp task with real task, preserving the status from API response
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map(t =>
                t.id === taskId
                  ? { ...createdTask, status: createdTask.status }
                  : t
              )
            }
          : col
      ));
    } catch (error) {
      console.error('Error creating task:', error);
      // Remove the temp task on error
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          : col
      ));
    }

    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleCancelEdit = (taskId: string, columnId: string) => {
    // Remove the temp task
    setColumns(prev => prev.map(col =>
      col.id === columnId
        ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
        : col
    ));
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-3 text-xs">{error || 'Facility not found'}</p>
          <button
            onClick={() => navigate('/Facilities')}
            className="px-3 py-1.5 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors text-xs"
          >
            Back to Facilities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Header with Facility Details */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/Facilities')}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <LucideArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {facility.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <LucideBuilding className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Facility ID: {facility.id.slice(-8)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <LucideUsers className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">12 Members</span>
                </div>
                <div className="flex items-center space-x-1">
                  <LucideClipboardList className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{projects.length} Projects</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Controls - Moved to right side */}
          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            <div className="relative">
              <LucideSearch className="w-8 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <LucideFilter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Projects</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {facility.description && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">{facility.description}</p>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="p-4 overflow-x-auto">
        <div className="flex space-x-4 min-w-max">
          {columns.map((column, index) => (
            <div
              key={column.id}
              className={`w-72 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-3`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  {column.title} • {column.tasks.length}
                </h3>
                <button className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <LucideMoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {column.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-650 border-gray-600'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        {editingTaskId === task.id ? (
                          <input
                            type="text"
                            value={editingTaskTitle}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                            placeholder="Task title..."
                            className={`w-full font-semibold text-sm mb-2 px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ${
                              isDarkMode
                                ? 'bg-gray-600 text-white border-gray-500 placeholder-gray-400'
                                : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                            }`}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveTask(task.id, column.id);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleCancelEdit(task.id, column.id);
                              }
                            }}
                            onBlur={() => handleSaveTask(task.id, column.id)}
                          />
                        ) : (
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight pr-2">
                              {task.title}
                            </h4>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
                              <LucideMoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {task.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {/* Status Badge */}
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            task.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            task.status === 'review' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {task.status === 'in-progress' ? 'In Progress' :
                             task.status === 'todo' ? 'To Do' :
                             task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>

                          {/* Due Date */}
                          {task.dueDate ? (
                            <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
                              📅 {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-xs font-medium rounded-full">
                              📅 No due date
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            {/* Assignee */}
                            {task.assignee && (
                              <span className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                                <span>👤</span>
                                <span className="font-medium">{task.assignee.slice(-8)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Button */}
              <button
                onClick={() => handleCreateTask(column.id)}
                className={`w-full mt-3 p-2 rounded-md text-sm flex items-center space-x-2 transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                <LucidePlus className="w-4 h-4" />
                <span>Add task</span>
              </button>
            </div>
          ))}

          {/* Add Project Button */}
          <div className="w-72 flex items-start justify-start">
            {!isCreatingProject ? (
              <button
                onClick={handleStartCreateProject}
                className="w-full p-2 rounded-md text-sm flex items-center space-x-2 transition-colors bg-brand text-white hover:bg-brand-dark"
              >
                <LucidePlus className="w-5 h-5" />
                <span>Add Project</span>
              </button>
            ) : (
              <div
                className={`flex items-center p-2 w-full rounded-md transition-all duration-300 ease-in-out shadow-md ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}
                style={{ maxWidth: '18rem' }}
                tabIndex={-1}
                onBlur={(e) => {
                  // Close form if focus leaves the div (click outside)
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    handleCancelCreateProject();
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Enter project name…"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={`flex-grow text-sm border-none focus:outline-none ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateProject();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelCreateProject();
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityView;