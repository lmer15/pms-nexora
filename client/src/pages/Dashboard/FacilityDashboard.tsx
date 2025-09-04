import React, { useState, useEffect } from 'react';
import {
  LucideDollarSign,
  LucideBriefcase,
  LucideClock,
  LucideUser,
} from 'lucide-react';

const overviewData = [
  {
    id: 1,
    title: 'Total revenue',
    value: '$53,00989',
    icon: <LucideDollarSign className="w-6 h-6 text-brand" />,
    bgColor: 'bg-brand/10',
    progress: '12% increase from last month',
    progressColor: 'text-green-600',
  },
  {
    id: 2,
    title: 'Projects',
    value: '95 /100',
    icon: <LucideBriefcase className="w-6 h-6 text-brand-light" />,
    bgColor: 'bg-brand-light/10',
    progress: '10% decrease from last month',
    progressColor: 'text-red-600',
  },
  {
    id: 3,
    title: 'Time spent',
    value: '1022 /1300 Hrs',
    icon: <LucideClock className="w-6 h-6 text-brand-dark" />,
    bgColor: 'bg-brand-dark/10',
    progress: '8% increase from last month',
    progressColor: 'text-green-600',
  },
  {
    id: 4,
    title: 'Resources',
    value: '101 /120',
    icon: <LucideUser className="w-6 h-6 text-brand" />,
    bgColor: 'bg-brand/10',
    progress: '2% increase from last month',
    progressColor: 'text-green-600',
  },
];

const projects = [
  {
    name: 'Nelsa web development',
    manager: 'Om prakash sao',
    dueDate: 'May 25, 2023',
    status: 'Completed',
    progress: 100,
  },
  {
    name: 'Datascale AI app',
    manager: 'Neilsan mando',
    dueDate: 'Jun 20, 2023',
    status: 'Delayed',
    progress: 30,
  },
  {
    name: 'Media channel branding',
    manager: 'Tirvelly priya',
    dueDate: 'July 13, 2023',
    status: 'At risk',
    progress: 60,
  },
  {
    name: 'Corlax iOS app development',
    manager: 'Matte hannery',
    dueDate: 'Dec 20, 2023',
    status: 'Completed',
    progress: 100,
  },
  {
    name: 'Website builder development',
    manager: 'Sukumar rao',
    dueDate: 'Mar 15, 2024',
    status: 'On going',
    progress: 50,
  },
];

const statusColors: Record<string, string> = {
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Delayed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'At risk': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'On going': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const todayTasks = [
  {
    id: 1,
    title: 'Create a user flow of social application design',
    status: 'Approved',
    completed: true,
  },
  {
    id: 2,
    title: 'Create a user flow of social application design',
    status: 'In review',
    completed: true,
  },
  {
    id: 3,
    title: 'Landing page design for Fintech project of singapore',
    status: 'In review',
    completed: false,
  },
  {
    id: 4,
    title: 'Interactive prototype for app screens of deltamie project',
    status: 'On going',
    completed: false,
  },
  {
    id: 5,
    title: 'Interactive prototype for app screens of deltamie project',
    status: 'Approved',
    completed: true,
  },
];

const FacilityDashboard: React.FC = () => {
  const [filterProject, setFilterProject] = useState('Project');
  const [filterManager, setFilterManager] = useState('Project manager');
  const [filterStatus, setFilterStatus] = useState('Status');

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

  return (
    <div className="p-6 space-y-6 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewData.map(({ id, title, value, icon, bgColor, progress, progressColor }) => (
          <div
            key={id}
            className={`p-6 rounded-lg shadow-sm flex items-center space-x-4 cursor-pointer transition-all hover:shadow-md ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } ${bgColor}`}
          >
            <div className={`p-3 rounded-full`}>{icon}</div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className={`text-xs ${progressColor}`}>{progress}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Project Summary and Overall Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Summary */}
        <div className="col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Summary</h3>
            <div className="flex space-x-2">
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>Project</option>
                <option>Project A</option>
                <option>Project B</option>
              </select>
              <select
                value={filterManager}
                onChange={(e) => setFilterManager(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>Project manager</option>
                <option>Manager A</option>
                <option>Manager B</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option>Status</option>
                <option>Completed</option>
                <option>Delayed</option>
                <option>At risk</option>
                <option>On going</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Project manager</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Due date</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th className="pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(({ name, manager, dueDate, status, progress }) => (
                  <tr key={name} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-4 text-sm text-gray-900 dark:text-white">{name}</td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{manager}</td>
                    <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{dueDate}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            progress === 100
                              ? 'bg-green-500'
                              : progress >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                        {progress}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
            Overall Progress
          </h3>
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-8 border-gray-200 dark:border-gray-700">
                <div className="w-full h-full rounded-full border-8 border-brand" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)' }}></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">72%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              <span className="text-sm font-semibold text-green-600">26</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Delayed</span>
              <span className="text-sm font-semibold text-yellow-600">35</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">On going</span>
              <span className="text-sm font-semibold text-red-600">34</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              95 Total projects
            </p>
          </div>
        </div>
      </div>

      {/* Today Task and Projects Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today Task */}
        <div className="col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Today's Tasks</h3>
          
          <div className="space-y-4">
            {todayTasks.map(({ id, title, status, completed }) => (
              <div key={id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={completed}
                    readOnly
                    className="w-5 h-5 text-brand rounded border-gray-300 focus:ring-brand"
                  />
                  <span className={`text-sm ${completed ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {title}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects Workload */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Projects Workload</h3>
            <select className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option>Last 3 months</option>
              <option>Last 6 months</option>
              <option>Last 12 months</option>
            </select>
          </div>
          
          <div className="h-48 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
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