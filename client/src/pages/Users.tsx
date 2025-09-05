import React, { useState, useEffect } from 'react';
import {
  LucideUser,
  LucideMail,
  LucidePhone,
  LucideMapPin,
} from 'lucide-react';

const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Developer',
    status: 'Active',
    location: 'Main Office',
    phone: '+1 (555) 123-4567',
    joinDate: 'Jan 15, 2023',
  },
  {
    id: 2,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    role: 'Designer',
    status: 'Active',
    location: 'Remote',
    phone: '+1 (555) 234-5678',
    joinDate: 'Mar 22, 2023',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    role: 'Project Manager',
    status: 'Active',
    location: 'Branch A',
    phone: '+1 (555) 345-6789',
    joinDate: 'Feb 10, 2023',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'QA Engineer',
    status: 'Inactive',
    location: 'Main Office',
    phone: '+1 (555) 456-7890',
    joinDate: 'Dec 5, 2022',
  },
];

const statusColors: Record<string, string> = {
  Active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const Users: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

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

  const filteredUsers = users.filter(user => {
    const roleMatch = filterRole === 'All' || user.role === filterRole;
    const statusMatch = filterStatus === 'All' || user.status === filterStatus;
    return roleMatch && statusMatch;
  });

  return (
    <div className="p-4 space-y-4 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand/10">
            <LucideUser className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Total Users</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">4</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-green-100">
            <LucideUser className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Active Users</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">3</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-blue-100">
            <LucideMail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Developers</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-purple-100">
            <LucideMapPin className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Remote Users</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option>Developer</option>
              <option>Designer</option>
              <option>Project Manager</option>
              <option>QA Engineer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Pending</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filteredUsers.map(({ id, name, email, role, status, location, phone, joinDate }) => (
            <div key={id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center">
                  <LucideUser className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{email}</p>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{role}</span>
                    <span>•</span>
                    <span>{location}</span>
                    <span>•</span>
                    <span>Joined {joinDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                  {status}
                </span>
                <button className="text-brand hover:text-brand-dark text-xs">View Profile</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Users;
