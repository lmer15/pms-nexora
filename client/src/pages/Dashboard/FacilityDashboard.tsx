import React, { useState, useEffect } from 'react';
import {
  LucideTrendingUp,
  LucideTrendingDown,
  LucideBriefcase,
  LucideClock,
  LucideUser,
  LucideBuilding,
  LucidePlus,
  LucideUsers,
  LucideRefreshCw,
  LucideCalendar,
  LucideTarget,
  LucideAlertCircle,
  LucideCheckCircle,
  LucideActivity,
  LucideBarChart3,
  LucidePieChart,
  LucideArrowUpRight,
  LucideArrowDownRight,
  LucideEye,
  LucideFilter,
  LucideSearch,
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
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');

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
          // Don't fail the entire loadData if profiles fail
          setUserProfiles({});
        }
      }
      
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      // Set empty arrays to prevent undefined errors
      setProjects([]);
      setTasks([]);
      setUserProfiles({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facilities && Array.isArray(facilities)) {
      loadData();
    }
  }, [facilities]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!facilities || !Array.isArray(facilities) || facilities.length === 0) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [facilities]);

  // Calculate comprehensive statistics
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const blockedTasks = tasks.filter(task => task.status === 'review').length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate global statistics across all facilities
  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter(f => f.status === 'active').length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalMembers = facilities.reduce((sum, facility) => sum + (facility.memberCount || 0), 0);
  
  // Calculate overdue and upcoming tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== 'done';
  }).length;
  
  const upcomingTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek && task.status !== 'done';
  }).length;

  // Calculate productivity metrics
  const tasksCompletedThisWeek = tasks.filter(task => {
    if (task.status !== 'done' || !task.updatedAt) return false;
    const completedDate = new Date(task.updatedAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return completedDate >= weekAgo;
  }).length;

  const averageTaskCompletionTime = tasks.length > 0 ? 
    tasks.filter(t => t.status === 'done').reduce((sum, task) => {
      if (!task.createdAt || !task.updatedAt) return sum;
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      return sum + (completed.getTime() - created.getTime());
    }, 0) / completedTasks / (1000 * 60 * 60 * 24) : 0; // in days

  // Filter projects based on selected filters
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => {
      // Filter by search term
      const searchMatches = searchTerm === '' || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status
      const statusMatches = filterStatus === 'all' || 
        project.status === filterStatus;
      
      return searchMatches && statusMatches;
    });
  }, [projects, searchTerm, filterStatus]);

  // Enhanced overview data with trends and analytics
  const overviewData = [
    {
      id: 1,
      title: 'Active Projects',
      value: activeProjects.toString(),
      total: totalProjects,
      icon: <LucideBriefcase className="w-6 h-6" />,
      bgColor: 'bg-blue-500',
      trend: activeProjects > 0 ? 'up' : 'neutral',
      trendValue: `${Math.round((activeProjects / totalProjects) * 100)}%`,
      subtitle: 'of total projects',
    },
    {
      id: 2,
      title: 'Task Completion',
      value: `${completionPercentage}%`,
      total: totalTasks,
      icon: <LucideTarget className="w-6 h-6" />,
      bgColor: 'bg-green-500',
      trend: completionPercentage >= 70 ? 'up' : completionPercentage >= 40 ? 'neutral' : 'down',
      trendValue: `${completedTasks}/${totalTasks}`,
      subtitle: 'tasks completed',
    },
    {
      id: 3,
      title: 'Team Productivity',
      value: tasksCompletedThisWeek.toString(),
      total: totalMembers,
      icon: <LucideActivity className="w-6 h-6" />,
      bgColor: 'bg-purple-500',
      trend: tasksCompletedThisWeek > 0 ? 'up' : 'neutral',
      trendValue: 'this week',
      subtitle: 'tasks completed',
    },
    {
      id: 4,
      title: 'Active Facilities',
      value: activeFacilities.toString(),
      total: totalFacilities,
      icon: <LucideBuilding className="w-6 h-6" />,
      bgColor: 'bg-orange-500',
      trend: activeFacilities > 0 ? 'up' : 'neutral',
      trendValue: `${Math.round((activeFacilities / totalFacilities) * 100)}%`,
      subtitle: 'facilities active',
    },
  ];

  const alertData = [
    {
      id: 1,
      type: 'warning',
      title: 'Overdue Tasks',
      value: overdueTasks,
      icon: <LucideAlertCircle className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      id: 2,
      type: 'info',
      title: 'Upcoming Deadlines',
      value: upcomingTasks,
      icon: <LucideCalendar className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      id: 3,
      type: 'success',
      title: 'Completed This Week',
      value: tasksCompletedThisWeek,
      icon: <LucideCheckCircle className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
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
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overview of your projects and team performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm"
          >
            <LucideRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewData.map(({ id, title, value, total, icon, bgColor, trend, trendValue, subtitle }) => (
          <div
            key={id}
            className={`p-6 rounded-xl shadow-sm transition-all hover:shadow-md ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${bgColor} text-white`}>
                {icon}
              </div>
              <div className="flex items-center gap-1">
                {trend === 'up' && <LucideTrendingUp className="w-4 h-4 text-green-500" />}
                {trend === 'down' && <LucideTrendingDown className="w-4 h-4 text-red-500" />}
                <span className={`text-xs font-medium ${
                  trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {trendValue}
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts and Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {alertData.map(({ id, type, title, value, icon, color, bgColor }) => (
          <div
            key={id}
            className={`p-4 rounded-xl border ${bgColor} border-current`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color} ${bgColor}`}>
                {icon}
              </div>
              <div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className={`text-sm font-medium ${color}`}>{title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Summary */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Overview</h3>
                {filteredProjects.length !== projects.length && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {filteredProjects.length} of {projects.length} projects
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <LucideSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-48"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Facility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tasks</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <LucideBriefcase className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {projects.length === 0 ? 'No projects found' : 'No projects match your filters'}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
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
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <LucideBriefcase className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {project.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {userProfiles[project.creatorId] ? 
                                  `${userProfiles[project.creatorId].firstName} ${userProfiles[project.creatorId].lastName}` :
                                  `User ${project.creatorId.slice(0, 8)}`
                                }
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <LucideBuilding className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {projectFacility?.name || 'Unknown Facility'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[project.status] || statusColors['On going']}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  projectProgress === 100
                                    ? 'bg-green-500'
                                    : projectProgress >= 60
                                    ? 'bg-blue-500'
                                    : projectProgress >= 30
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${projectProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {projectProgress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <LucideTarget className="w-4 h-4 text-gray-400 mr-2" />
                            {completedProjectTasks}/{projectTasks.length}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          {/* Task Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Distribution</h3>
              <LucidePieChart className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{completedTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{inProgressTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400 mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">To Do</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{todoTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Review</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{blockedTasks}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{totalTasks}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
              <LucideBarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{completionPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tasks This Week</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{tasksCompletedThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Completion</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {averageTaskCompletionTime > 0 ? `${Math.round(averageTaskCompletionTime)}d` : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors text-sm">
                <LucidePlus className="w-4 h-4" />
                New Project
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                <LucideEye className="w-4 h-4" />
                View All Tasks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <button className="text-sm text-brand hover:text-brand-dark transition-colors">
              View All
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center space-y-3">
                  <LucideActivity className="w-12 h-12 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Start working on tasks to see activity here</p>
                </div>
              </div>
            ) : (
              tasks.slice(0, 6).map((task) => {
                const taskProject = projects.find(p => p.id === task.projectId);
                const taskFacility = facilities.find(f => f.id === taskProject?.facilityId);
                
                return (
                  <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'done' ? 'bg-green-500' :
                      task.status === 'in-progress' ? 'bg-blue-500' :
                      task.status === 'review' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {taskFacility?.name} • {taskProject?.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status] || statusColors['On going']}`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : '--'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;