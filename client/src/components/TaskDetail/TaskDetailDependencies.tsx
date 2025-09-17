import React, { useState } from 'react';
import { LucideLink, LucideArrowRight, LucideArrowLeft, LucideGitBranch, LucidePlus, LucideX } from 'lucide-react';
import { TaskDependency } from '../../api/taskService';
import { Button } from '../ui/button';

interface TaskDetailDependenciesProps {
  dependencies: TaskDependency[];
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
  onShowConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
}

const TaskDetailDependencies: React.FC<TaskDetailDependenciesProps> = ({ dependencies, isDarkMode }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newDependency, setNewDependency] = useState({ taskId: '', type: 'blocks', description: '' });

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleAddDependency = async () => {
    if (!newDependency.taskId.trim()) return;

    try {
      // TODO: Implement dependency creation
      console.log('Adding dependency:', newDependency);
      setNewDependency({ taskId: '', type: 'blocks', description: '' });
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add dependency:', error);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      // TODO: Implement dependency removal
      console.log('Removing dependency:', dependencyId);
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucideGitBranch className="w-4 h-4" />
          <span>Dependencies</span>
          {dependencies.length > 0 && (
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {dependencies.length}
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
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Task ID
                </label>
                <input
                  type="text"
                  value={newDependency.taskId}
                  onChange={(e) => setNewDependency({ ...newDependency, taskId: e.target.value })}
                  placeholder="Enter task ID..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Relationship
                </label>
                <select
                  value={newDependency.type}
                  onChange={(e) => setNewDependency({ ...newDependency, type: e.target.value })}
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
                disabled={!newDependency.taskId.trim()}
                size="sm"
              >
                Add Dependency
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewDependency({ taskId: '', type: 'blocks', description: '' });
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dependencies List */}
      <div className="space-y-3">
        {dependencies.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideGitBranch className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No dependencies defined yet.</p>
          </div>
        ) : (
          dependencies.map((dependency) => (
            <div
              key={dependency.id}
              className={`p-3 rounded-lg border transition-all hover:shadow-sm ${getDependencyColor(dependency.dependencyType)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getDependencyIcon(dependency.dependencyType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getDependencyTypeLabel(dependency.dependencyType)}
                    </span>
                    <span className={`text-sm font-mono px-2 py-0.5 rounded ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>
                      #{dependency.dependencyId}
                    </span>
                  </div>
                  {dependency.description && (
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {dependency.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      Added by {dependency.creatorId}
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
