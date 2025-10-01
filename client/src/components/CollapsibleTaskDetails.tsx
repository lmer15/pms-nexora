import React, { useState, useEffect } from 'react';
import { LucideChevronDown, LucideChevronRight, LucideGitBranch, LucideCheckSquare, LucidePlus, LucideX } from 'lucide-react';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface Dependency {
  id: string;
  title: string;
  type: 'blocks' | 'blocked_by';
}

interface CollapsibleTaskDetailsProps {
  taskId: string;
  subtasks?: Subtask[];
  dependencies?: Dependency[];
  isDarkMode: boolean;
  onSubtaskToggle?: (subtaskId: string) => void;
  onSubtaskCreate?: (title: string) => void;
  onDependencyClick?: (dependencyId: string) => void;
  onDependencyCreate?: (title: string, type: 'blocks' | 'blocked_by') => void;
}

const CollapsibleTaskDetails: React.FC<CollapsibleTaskDetailsProps> = ({
  taskId,
  subtasks = [],
  dependencies = [],
  isDarkMode,
  onSubtaskToggle,
  onSubtaskCreate,
  onDependencyClick,
  onDependencyCreate,
}) => {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  const [isDependenciesExpanded, setIsDependenciesExpanded] = useState(false);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [isCreatingDependency, setIsCreatingDependency] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newDependencyTitle, setNewDependencyTitle] = useState('');
  const [newDependencyType, setNewDependencyType] = useState<'blocks' | 'blocked_by'>('blocks');

  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const totalSubtasks = subtasks.length;

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim() && onSubtaskCreate) {
      onSubtaskCreate(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsCreatingSubtask(false);
    }
  };

  const handleDependencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDependencyTitle.trim() && onDependencyCreate) {
      onDependencyCreate(newDependencyTitle.trim(), newDependencyType);
      setNewDependencyTitle('');
      setIsCreatingDependency(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Subtasks Section */}
      {subtasks.length > 0 || onSubtaskCreate ? (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
          <button
            onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
            className="flex items-center space-x-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            {isSubtasksExpanded ? (
              <LucideChevronDown className="w-3 h-3" />
            ) : (
              <LucideChevronRight className="w-3 h-3" />
            )}
            <LucideCheckSquare className="w-3 h-3" />
            <span>Subtasks</span>
            {totalSubtasks > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                ({completedSubtasks}/{totalSubtasks})
              </span>
            )}
          </button>

          {isSubtasksExpanded && (
            <div className="mt-2 space-y-1">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center space-x-2 text-xs"
                >
                  <button
                    onClick={() => onSubtaskToggle?.(subtask.id)}
                    className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                      subtask.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                    }`}
                  >
                    {subtask.completed && <LucideCheckSquare className="w-2 h-2" />}
                  </button>
                  <span className={`flex-1 truncate ${
                    subtask.completed 
                      ? 'line-through text-gray-500 dark:text-gray-500' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {subtask.title}
                  </span>
                </div>
              ))}

              {onSubtaskCreate && (
                <div className="pt-1">
                  {isCreatingSubtask ? (
                    <form onSubmit={handleSubtaskSubmit} className="flex items-center space-x-1">
                      <input
                        type="text"
                        placeholder="Add subtask..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        className={`flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsCreatingSubtask(false);
                            setNewSubtaskTitle('');
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!newSubtaskTitle.trim()}
                        className="px-2 py-1 bg-brand text-white rounded text-xs hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingSubtask(false);
                          setNewSubtaskTitle('');
                        }}
                        className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-xs"
                      >
                        <LucideX className="w-3 h-3" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingSubtask(true)}
                      className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <LucidePlus className="w-3 h-3" />
                      <span>Add subtask</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Dependencies Section */}
      {dependencies.length > 0 || onDependencyCreate ? (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
          <button
            onClick={() => setIsDependenciesExpanded(!isDependenciesExpanded)}
            className="flex items-center space-x-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            {isDependenciesExpanded ? (
              <LucideChevronDown className="w-3 h-3" />
            ) : (
              <LucideChevronRight className="w-3 h-3" />
            )}
            <LucideGitBranch className="w-3 h-3" />
            <span>Dependencies</span>
            {dependencies.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                ({dependencies.length})
              </span>
            )}
          </button>

          {isDependenciesExpanded && (
            <div className="mt-2 space-y-1">
              {dependencies.map((dependency) => (
                <button
                  key={dependency.id}
                  onClick={() => onDependencyClick?.(dependency.id)}
                  className="flex items-center space-x-2 text-xs text-left w-full hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-1 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    dependency.type === 'blocks' 
                      ? 'bg-orange-500' 
                      : 'bg-blue-500'
                  }`} />
                  <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                    {dependency.title}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {dependency.type === 'blocks' ? 'blocks' : 'blocked by'}
                  </span>
                </button>
              ))}

              {onDependencyCreate && (
                <div className="pt-1">
                  {isCreatingDependency ? (
                    <form onSubmit={handleDependencySubmit} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Dependency title..."
                        value={newDependencyTitle}
                        onChange={(e) => setNewDependencyTitle(e.target.value)}
                        className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsCreatingDependency(false);
                            setNewDependencyTitle('');
                          }
                        }}
                      />
                      <select
                        value={newDependencyType}
                        onChange={(e) => setNewDependencyType(e.target.value as 'blocks' | 'blocked_by')}
                        className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="blocks">Blocks</option>
                        <option value="blocked_by">Blocked by</option>
                      </select>
                      <div className="flex space-x-1">
                        <button
                          type="submit"
                          disabled={!newDependencyTitle.trim()}
                          className="flex-1 px-2 py-1 bg-brand text-white rounded text-xs hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingDependency(false);
                            setNewDependencyTitle('');
                          }}
                          className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-xs"
                        >
                          <LucideX className="w-3 h-3" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsCreatingDependency(true)}
                      className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <LucidePlus className="w-3 h-3" />
                      <span>Add dependency</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default CollapsibleTaskDetails;
