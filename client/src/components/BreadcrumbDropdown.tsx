import React, { useState, useEffect, useRef } from 'react';
import { LucideChevronDown, LucideBuilding, LucideSearch } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  taskCount?: number;
  isActive?: boolean;
}

interface BreadcrumbDropdownProps {
  currentProject: string;
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
  isDarkMode: boolean;
  className?: string;
}

const BreadcrumbDropdown: React.FC<BreadcrumbDropdownProps> = ({
  currentProject,
  projects,
  onProjectSelect,
  isDarkMode,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleProjectSelect = (projectId: string) => {
    onProjectSelect(projectId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Breadcrumb Button */}
      <button
        onClick={handleToggleDropdown}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'bg-brand text-white shadow-md'
            : isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
        }`}
      >
        <LucideBuilding className="w-4 h-4" />
        <span className="text-sm font-medium truncate max-w-32">
          {currentProject}
        </span>
        <LucideChevronDown className={`w-3 h-3 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`absolute top-full left-0 mt-1 w-80 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg shadow-lg z-[9999]`}
          style={{ position: 'absolute', zIndex: 9999 }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <LucideSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 text-sm border-0 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white placeholder-gray-400' 
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-brand`}
                autoFocus
              />
            </div>
          </div>

          {/* Projects List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                {searchTerm ? 'No projects found' : 'No projects available'}
              </div>
            ) : (
              <div className="py-1">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      project.isActive ? 'bg-brand/10 text-brand dark:text-brand-light' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <LucideBuilding className={`w-4 h-4 flex-shrink-0 ${
                        project.isActive 
                          ? 'text-brand dark:text-brand-light' 
                          : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-medium truncate ${
                          project.isActive 
                            ? 'text-brand dark:text-brand-light' 
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {project.title}
                        </div>
                        {project.taskCount !== undefined && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {project.taskCount} tasks
                          </div>
                        )}
                      </div>
                    </div>
                    {project.isActive && (
                      <div className="ml-2 text-xs text-brand dark:text-brand-light font-medium">
                        Current
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreadcrumbDropdown;
