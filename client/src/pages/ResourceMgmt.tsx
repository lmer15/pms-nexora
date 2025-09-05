import React, { useState, useEffect } from 'react';
import {
  LucideUser,
  LucideSettings,
  LucideMonitor,
  LucideMapPin,
} from 'lucide-react';

const resources = [
  {
    id: 1,
    name: 'John Doe',
    type: 'Human',
    role: 'Developer',
    availability: 'Available',
    location: 'Main Office',
    skills: ['React', 'Node.js', 'Python'],
  },
  {
    id: 2,
    name: 'MacBook Pro 16"',
    type: 'Equipment',
    role: 'Laptop',
    availability: 'In Use',
    location: 'Branch A',
    skills: ['High Performance', 'M1 Chip'],
  },
  {
    id: 3,
    name: 'Conference Room A',
    type: 'Facility',
    role: 'Meeting Room',
    availability: 'Available',
    location: 'Main Office',
    skills: ['Video Conference', 'Whiteboard'],
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    type: 'Human',
    role: 'Designer',
    availability: 'Busy',
    location: 'Remote',
    skills: ['UI/UX', 'Figma', 'Adobe XD'],
  },
];

const availabilityColors: Record<string, string> = {
  Available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'In Use': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Busy: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const typeIcons: Record<string, React.ReactNode> = {
  Human: <LucideUser className="w-5 h-5" />,
  Equipment: <LucideMonitor className="w-5 h-5" />,
  Facility: <LucideMapPin className="w-5 h-5" />,
};

const ResourceMgmt: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [filterType, setFilterType] = useState('All');
  const [filterAvailability, setFilterAvailability] = useState('All');

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

  const filteredResources = resources.filter(resource => {
    const typeMatch = filterType === 'All' || resource.type === filterType;
    const availabilityMatch = filterAvailability === 'All' || resource.availability === filterAvailability;
    return typeMatch && availabilityMatch;
  });

  return (
    <div className="p-6 space-y-6 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-lg shadow-sm flex items-center space-x-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-3 rounded-full bg-brand/10">
            <LucideUser className="w-6 h-6 text-brand" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Resources</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">4</p>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-sm flex items-center space-x-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-3 rounded-full bg-green-100">
            <LucideSettings className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">2</p>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-sm flex items-center space-x-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-3 rounded-full bg-blue-100">
            <LucideMonitor className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">In Use</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow-sm flex items-center space-x-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-3 rounded-full bg-red-100">
            <LucideUser className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Busy</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option>Human</option>
              <option>Equipment</option>
              <option>Facility</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</label>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option>All</option>
              <option>Available</option>
              <option>In Use</option>
              <option>Busy</option>
              <option>Maintenance</option>
            </select>
          </div>
        </div>

        {/* Resources List */}
        <div className="space-y-4">
          {filteredResources.map(({ id, name, type, role, availability, location, skills }) => (
            <div key={id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  {typeIcons[type]}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{role} • {location}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-400">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${availabilityColors[availability]}`}>
                  {availability}
                </span>
                <button className="text-brand hover:text-brand-dark text-sm">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourceMgmt;
