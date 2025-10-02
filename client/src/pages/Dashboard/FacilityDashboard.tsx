import React, { useState, useEffect } from 'react';
import {
  LucideDollarSign,
  LucideBriefcase,
  LucideClock,
  LucideUser,
  LucideBuilding,
  LucidePlus,
  LucideUsers,
  LucideRefreshCw,
} from 'lucide-react';
import { useFacility } from '../../context/FacilityContext';
import { projectService, Project } from '../../api/projectService';
import { taskService, Task } from '../../api/taskService';

// This will be replaced with real data in the component

// This will be replaced with real data in the component

const statusColors: Record<string, string> = {
  done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  // Project statuses
  planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  // Legacy statuses for backward compatibility
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Delayed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'At risk': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'On going': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

// This will be replaced with real data in the component

const FacilityDashboard: React.FC = () => {
  const { facilities, currentFacility, loading: facilityLoading } = useFacility();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [filterProject, setFilterProject] = useState('all');
  const [filterManager, setFilterManager] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userProfiles, setUserProfiles] = useState<Record<string, { firstName: string; lastName: string; profilePicture?: string }>>({});

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Load all projects and tasks across all facilities the user has access to
  const loadData = async () => {
    if (facilities.length === 0) {
      setProjects([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load projects from ALL facilities the user has access to
      const allProjects: Project[] = [];
      const allTasks: Task[] = [];

      for (const facility of facilities) {
        try {
          // Load projects for each facility
          const facilityProjects = await projectService.getByFacility(facility.id);
          allProjects.push(...facilityProjects);

          // Load recent tasks from each project (limit to reduce reads)
          for (const project of facilityProjects) {
            try {
              const projectTasks = await taskService.getByProject(project.id, {
                limit: 5, // Load more tasks for global dashboard
                page: 1
              });
              const tasksArray = Array.isArray(projectTasks) ? projectTasks : projectTasks.tasks || [];
              allTasks.push(...tasksArray);
            } catch (taskError) {
              console.error(`Error loading tasks for project ${project.id}:`, taskError);
            }
          }
        } catch (facilityError) {
          console.error(`Error loading data for facility ${facility.id}:`, facilityError);
        }
      }

      setProjects(allProjects);
      setTasks(allTasks);
      
      // Fetch user profiles for project owners
      const ownerIds = Array.from(new Set(allProjects.map(p => p.creatorId)));
      if (ownerIds.length > 0) {
        try {
          const profiles = await taskService.fetchUserProfilesByIds(ownerIds);
          setUserProfiles(profiles);
        } catch (profileError) {
          console.error('Error loading user profiles:', profileError);
        }
      }
      
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [facilities]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (facilities.length === 0) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [facilities]);

  // Calculate real statistics
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate global statistics across all facilities
  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter(f => f.status === 'active').length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const totalMembers = facilities.reduce((sum, facility) => sum + (facility.memberCount || 0), 0);
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== 'done';
  }).length;

  // Filter projects based on selected filters
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => {
      // Filter by project name
      const projectMatches = filterProject === 'all' || 
        project.name.toLowerCase().includes(filterProject.toLowerCase());
      
      // Filter by owner (creator)
      const ownerMatches = filterManager === 'all' || 
        project.creatorId === filterManager;
      
      // Filter by status
      const statusMatches = filterStatus === 'all' || 
        project.status === filterStatus;
      
      return projectMatches && ownerMatches && statusMatches;
    });
  }, [projects, filterProject, filterManager, filterStatus]);

  const realOverviewData = [
    {
      id: 1,
      title: 'Total Facilities',
      value: totalFacilities.toString(),
      icon: <LucideBuilding className="w-6 h-6 text-brand" />,
      bgColor: 'bg-brand/10',
      progress: `${activeFacilities} active facilities`,
      progressColor: 'text-green-600',
    },
    {
      id: 2,
      title: 'Total Projects',
      value: totalProjects.toString(),
      icon: <LucideBriefcase className="w-6 h-6 text-brand-light" />,
      bgColor: 'bg-brand-light/10',
      progress: `${activeProjects} in-progress projects`,
      progressColor: 'text-blue-600',
    },
    {
      id: 3,
      title: 'Total Tasks',
      value: `${completedTasks}/${totalTasks}`,
      icon: <LucideClock className="w-6 h-6 text-brand-dark" />,
      bgColor: 'bg-brand-dark/10',
      progress: `${completionPercentage}% completion rate`,
      progressColor: completionPercentage >= 70 ? 'text-green-600' : completionPercentage >= 40 ? 'text-yellow-600' : 'text-red-600',
    },
    {
      id: 4,
      title: 'Team Members',
      value: totalMembers.toString(),
      icon: <LucideUsers className="w-6 h-6 text-brand" />,
      bgColor: 'bg-brand/10',
      progress: `${overdueTasks} overdue tasks`,
      progressColor: overdueTasks > 0 ? 'text-red-600' : 'text-green-600',
    },
  ];

  if (facilityLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-full">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="p-4 space-y-4 bg-neutral-light dark:bg-gray-900 min-h-full">

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={loadData}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {realOverviewData.map(({ id, title, value, icon, bgColor, progress, progressColor }) => (
          <div
            key={id}
            className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 cursor-pointer transition-all hover:shadow-md ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } ${bgColor}`}
          >
            <div className={`p-2 rounded-full`}>{icon}</div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className={`text-xs ${progressColor}`}>{progress}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project Summary and Overall Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project Summary */}
        <div className="col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Summary</h3>
              {filteredProjects.length !== projects.length && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredProjects.length} of {projects.length} projects
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>
              <select
                value={filterManager}
                onChange={(e) => setFilterManager(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Owners</option>
                {Array.from(new Set(projects.map(p => p.creatorId))).map(ownerId => {
                  const profile = userProfiles[ownerId];
                  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : `User ${ownerId.slice(0, 8)}`;
                  return (
                    <option key={ownerId} value={ownerId}>{displayName}</option>
                  );
                })}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Facility</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Owner</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Due date</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center space-y-3">
                        <LucideBriefcase className="w-8 h-8 text-gray-400" />
                        <p>{projects.length === 0 ? 'No projects found' : 'No projects match your filters'}</p>
                        <p className="text-sm">
                          {projects.length === 0 ? 'Create your first project to get started' : 'Try adjusting your filter criteria'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => {
                    const projectTasks = tasks.filter(task => task.projectId === project.id);
                    const completedProjectTasks = projectTasks.filter(task => task.status === 'done').length;
                    const projectProgress = projectTasks.length > 0 ? Math.round((completedProjectTasks / projectTasks.length) * 100) : 0;
                    
                    // Find the facility this project belongs to
                    const projectFacility = facilities.find(f => f.id === project.facilityId);
                    
                    return (
                      <tr key={project.id} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{project.name}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {projectFacility?.name || 'Unknown Facility'}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            {userProfiles[project.creatorId]?.profilePicture ? (
                              <img
                                src={userProfiles[project.creatorId].profilePicture}
                                alt="Owner"
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center">
                                <span className="text-xs font-medium text-brand">
                                  {userProfiles[project.creatorId] ? 
                                    `${userProfiles[project.creatorId].firstName[0]}${userProfiles[project.creatorId].lastName[0]}` :
                                    '?'
                                  }
                                </span>
                              </div>
                            )}
                            <span>
                              {userProfiles[project.creatorId] ? 
                                `${userProfiles[project.creatorId].firstName} ${userProfiles[project.creatorId].lastName}` :
                                `User ${project.creatorId.slice(0, 8)}`
                              }
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || statusColors['On going']}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                projectProgress === 100
                                  ? 'bg-green-500'
                                  : projectProgress >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${projectProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                            {projectProgress}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
            Overall Progress
          </h3>
          
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-gray-200 dark:border-gray-700">
                {currentFacility && (
                  <div 
                    className="w-full h-full rounded-full border-8 border-brand" 
                    style={{ 
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + (completionPercentage * 0.36)}% 0%, ${50 + (completionPercentage * 0.36)}% 100%, 0% 100%, 0% 0%, 50% 0%)` 
                    }}
                  ></div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentFacility ? `${completionPercentage}%` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              <span className="text-sm font-semibold text-green-600">
                {completedTasks}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
              <span className="text-sm font-semibold text-yellow-600">
                {inProgressTasks}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">To Do</span>
              <span className="text-sm font-semibold text-red-600">
                {todoTasks}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {totalTasks} Total tasks across all facilities
            </p>
          </div>
        </div>
      </div>

      {/* Today Task and Projects Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today Task */}
        <div className="col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Tasks</h3>
          
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center space-y-3">
                  <LucideClock className="w-8 h-8 text-gray-400" />
                  <p className="text-sm">No tasks found</p>
                  <p className="text-xs">Create your first task to get started</p>
                </div>
              </div>
            ) : (
              tasks.slice(0, 5).map((task) => {
                // Find the project and facility for this task
                const taskProject = projects.find(p => p.id === task.projectId);
                const taskFacility = facilities.find(f => f.id === taskProject?.facilityId);
                
                return (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      readOnly
                      className="w-5 h-5 text-brand rounded border-gray-300 focus:ring-brand"
                    />
                    <div className="flex flex-col">
                      <span className={`text-sm ${task.status === 'done' ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {taskFacility?.name} • {taskProject?.name}
                      </span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status] || statusColors['On going']}`}>
                    {task.status}
                  </span>
                </div>
                );
              })
            )}
          </div>
        </div>

        {/* Projects Workload */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Projects Workload</h3>
            <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Last 3 months</option>
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
          
          <div className="h-40 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <LucideBriefcase className="w-8 h-8 text-brand" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Workload chart</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;