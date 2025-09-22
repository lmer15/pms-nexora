import React, { useState, useEffect, useRef } from 'react';
import { LucideLink, LucideArrowRight, LucideArrowLeft, LucideGitBranch, LucidePlus, LucideX, LucideSearch, LucideCheckCircle, LucideClock, LucideCircle } from 'lucide-react';
import { TaskDependency, taskService } from '../../api/taskService';
import { Button } from '../ui/button';

interface TaskDetailDependenciesProps {
  taskId: string;
  dependencies: TaskDependency[];
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
  onShowConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  onRefresh?: () => void;
}

const TaskDetailDependencies: React.FC<TaskDetailDependenciesProps> = ({ 
  taskId, 
  dependencies, 
  isDarkMode, 
  onShowWarning, 
  onShowConfirmation, 
  onRefresh 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDependency, setNewDependency] = useState<{ dependencyId: string; dependencyType: 'blocks' | 'blocked-by' | 'related'; description: string }>({ 
    dependencyId: '', 
    dependencyType: 'blocks', 
    description: '' 
  });
  const [localDependencies, setLocalDependencies] = useState<TaskDependency[]>(dependencies);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; status: string; projectId: string }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalDependencies(dependencies);
  }, [dependencies]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const results = await taskService.searchTasksForDependency(taskId, searchQuery);
          setSearchResults(results);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Error searching tasks:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, taskId]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchInputRef.current && !searchInputRef.current.contains(target)) {
        // Check if the click is not on a dropdown item
        const dropdown = document.querySelector('[data-search-dropdown]');
        if (!dropdown || !dropdown.contains(target)) {
          setShowSearchResults(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <LucideCheckCircle className="w-3 h-3 text-green-500" />;
      case 'in-progress':
        return <LucideClock className="w-3 h-3 text-blue-500" />;
      case 'review':
        return <LucideClock className="w-3 h-3 text-yellow-500" />;
      default:
        return <LucideCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'review':
        return 'In Review';
      default:
        return 'Not Started';
    }
  };

  const getDependencyIcon = (type: string) => {
    switch (type) {
      case 'blocks':
        return <LucideArrowRight className="w-4 h-4 text-red-500" />;
      case 'blocked-by':
        return <LucideArrowLeft className="w-4 h-4 text-orange-500" />;
      case 'related':
        return <LucideGitBranch className="w-4 h-4 text-blue-500" />;
      default:
        return <LucideLink className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDependencyColor = (type: string) => {
    switch (type) {
      case 'blocks':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'blocked-by':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'related':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case 'blocks':
        return 'Blocks';
      case 'blocked-by':
        return 'Blocked by';
      case 'related':
        return 'Related to';
      default:
        return 'Linked to';
    }
  };

  const handleSearchSelect = (task: { id: string; title: string; status: string; projectId: string }) => {
    setNewDependency(prev => ({ ...prev, dependencyId: task.id }));
    setSearchQuery(task.title);
    setShowSearchResults(false);
  };

  const formatTimeAgo = (dateString: any) => {
    if (!dateString) return 'Unknown';
    
    let date: Date;
    try {
      // Handle different date formats
      if (dateString && typeof dateString === 'object' && typeof dateString.toDate === 'function') {
        // Handle Firestore Timestamp object with toDate method
        date = dateString.toDate();
      } else if (dateString && typeof dateString === 'object' && dateString._seconds) {
        // Handle Firestore Timestamp object with _seconds property
        date = new Date(dateString._seconds * 1000);
      } else if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        return 'Unknown';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
      return 'Error';
    }
  };

  const handleAddDependency = async () => {
    if (!newDependency.dependencyId.trim()) return;

    setIsSubmitting(true);
    try {
      const dependency = await taskService.createDependency(taskId, {
        dependencyId: newDependency.dependencyId.trim(),
        dependencyType: newDependency.dependencyType,
        description: newDependency.description.trim()
      });

      // Update local state
      setLocalDependencies(prev => [...prev, dependency]);
      
      // Reset form
      setNewDependency({ dependencyId: '', dependencyType: 'blocks', description: '' });
      setIsAdding(false);
      
      // Refresh parent component
      onRefresh?.();
      
      onShowWarning?.('Dependency added successfully', 'success');
    } catch (error: any) {
      console.error('Failed to add dependency:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add dependency';
      onShowWarning?.(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    onShowConfirmation?.(
      'Remove Dependency',
      'Are you sure you want to remove this dependency? This action cannot be undone.',
      async () => {
        try {
          await taskService.deleteDependency(taskId, dependencyId);
          
          // Update local state
          setLocalDependencies(prev => prev.filter(dep => dep.id !== dependencyId));
          
          // Refresh parent component
          onRefresh?.();
          
          onShowWarning?.('Dependency removed successfully', 'success');
        } catch (error: any) {
          console.error('Failed to remove dependency:', error);
          const errorMessage = error.response?.data?.message || 'Failed to remove dependency';
          onShowWarning?.(errorMessage, 'error');
        }
      },
      'Remove',
      'Cancel'
    );
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucideGitBranch className="w-4 h-4" />
          <span>Dependencies</span>
          {localDependencies.length > 0 && (
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {localDependencies.length}
            </span>
          )}
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2"
        >
          <LucidePlus className="w-3 h-3" />
          Add Dependency
        </Button>
      </div>

      {/* Add Dependency Form */}
      {isAdding && (
        <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Search Task
                </label>
                <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Only tasks from the same project can be linked as dependencies
                </p>
                <div className="relative">
                  <LucideSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setNewDependency(prev => ({ ...prev, dependencyId: '' }));
                    }}
                    placeholder="Search tasks in this project..."
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {isSearching && (
                    <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div 
                    data-search-dropdown
                    className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {searchResults.map((task) => (
                      <button
                        key={task.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSearchSelect(task);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors cursor-pointer ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}
                        type="button"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{task.title}</div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              #{task.id} • {getStatusLabel(task.status)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.trim().length >= 2 && (
                  <div 
                    data-search-dropdown
                    className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <div className="text-sm">
                      No tasks found matching "{searchQuery}"
                    </div>
                    <div className="text-xs mt-1 opacity-75">
                      Only tasks from the same project can be linked as dependencies
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Relationship
                </label>
                <select
                  value={newDependency.dependencyType}
                  onChange={(e) => setNewDependency({ ...newDependency, dependencyType: e.target.value as 'blocks' | 'blocked-by' | 'related' })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="blocks">Blocks</option>
                  <option value="blocked-by">Blocked by</option>
                  <option value="related">Related to</option>
                </select>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Description (optional)
              </label>
              <input
                type="text"
                value={newDependency.description}
                onChange={(e) => setNewDependency({ ...newDependency, description: e.target.value })}
                placeholder="Describe the relationship..."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleAddDependency}
                disabled={!newDependency.dependencyId.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? 'Adding...' : 'Add Dependency'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewDependency({ dependencyId: '', dependencyType: 'blocks', description: '' });
                }}
                size="sm"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dependencies List */}
      <div className="space-y-3">
        {localDependencies.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideGitBranch className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No dependencies defined yet.</p>
          </div>
        ) : (
          localDependencies.map((dependency) => (
            <div
              key={dependency.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-sm ${getDependencyColor(dependency.dependencyType)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getDependencyIcon(dependency.dependencyType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getDependencyTypeLabel(dependency.dependencyType)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      #{dependency.dependencyId}
                    </span>
                  </div>
                  
                  {/* Task Title and Status */}
                  {dependency.dependentTask ? (
                    <div className="mb-2">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {dependency.dependentTask.title}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(dependency.dependentTask.status)}
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {getStatusLabel(dependency.dependentTask.status)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Task not found or deleted
                    </div>
                  )}
                  
                  {dependency.description && (
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {dependency.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      Added by {dependency.creatorProfile ? 
                        `${dependency.creatorProfile.firstName} ${dependency.creatorProfile.lastName}` : 
                        dependency.creatorId
                      }
                    </span>
                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {formatTimeAgo(dependency.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDependency(dependency.id)}
                  className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                    isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                  }`}
                  title="Remove dependency"
                >
                  <LucideX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskDetailDependencies;
