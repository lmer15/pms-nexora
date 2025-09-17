import React from 'react';
import { LucidePlus } from 'lucide-react';

interface ProjectCreatorProps {
  isCreatingProject: boolean;
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  isCreatingLoading: boolean;
  createError: string;
  handleStartCreateProject: () => void;
  handleCancelCreateProject: () => void;
  handleCreateProject: () => void;
  isDarkMode: boolean;
}

const ProjectCreator: React.FC<ProjectCreatorProps> = ({
  isCreatingProject,
  newProjectName,
  setNewProjectName,
  isCreatingLoading,
  createError,
  handleStartCreateProject,
  handleCancelCreateProject,
  handleCreateProject,
  isDarkMode,
}) => {
  return (
    <div className="flex-shrink-0 flex items-start justify-start" style={{ width: '16.25rem', minWidth: '16.25rem', maxWidth: '16.25rem' }}>
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
            className={`flex-grow font-semibold text-sm border-none focus:outline-none ${isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'}`}
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
          {isCreatingLoading && (
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
          )}
        </div>
      )}
      {createError && (
        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{createError}</p>
      )}
    </div>
  );
};

export default ProjectCreator;
