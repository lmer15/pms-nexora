import React, { useState } from 'react';
import { LucideCheckSquare, LucideSquare, LucidePlus, LucideTrash2 } from 'lucide-react';
import { TaskSubtask } from '../../api/taskService';
import { Button } from '../ui/button';

interface TaskDetailSubtasksProps {
  subtasks: TaskSubtask[];
  taskId: string;
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
  onShowConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
}

const TaskDetailSubtasks: React.FC<TaskDetailSubtasksProps> = ({ subtasks, taskId, isDarkMode }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    setIsAdding(true);
    try {
      // TODO: Implement subtask creation
      // await taskService.createSubtask(taskId, { title: newSubtask.trim() });
      console.log('Adding subtask:', newSubtask.trim());
      setNewSubtask('');
      // Refresh subtasks would be needed here
    } catch (error) {
      console.error('Failed to add subtask:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      // TODO: Implement subtask update
      // await taskService.updateSubtask(taskId, subtaskId, { completed: !completed });
      console.log('Toggling subtask:', subtaskId, !completed);
      // Refresh subtasks would be needed here
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      // TODO: Implement subtask deletion
      // await taskService.deleteSubtask(taskId, subtaskId);
      console.log('Deleting subtask:', subtaskId);
      // Refresh subtasks would be needed here
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const completedCount = subtasks.filter(subtask => subtask.completed).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucideCheckSquare className="w-4 h-4" />
          <span>Subtasks</span>
          {totalCount > 0 && (
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {completedCount}/{totalCount}
            </span>
          )}
        </h3>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Progress
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2`}>
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Subtask */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Add a subtask..."
            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
          />
          <Button
            onClick={handleAddSubtask}
            disabled={isAdding || !newSubtask.trim()}
            size="sm"
            className="flex items-center gap-2"
          >
            <LucidePlus className="w-3 h-3" />
            <span>{isAdding ? 'Adding...' : 'Add'}</span>
          </Button>
        </div>
      </div>

      {/* Subtasks List */}
      <div className="space-y-2">
        {subtasks.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideCheckSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No subtasks yet. Add one above!</p>
          </div>
        ) : (
          subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              } ${subtask.completed ? 'opacity-75' : ''}`}
            >
              <button
                onClick={() => handleToggleSubtask(subtask.id, subtask.completed)}
                className={`flex-shrink-0 transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {subtask.completed ? (
                  <LucideCheckSquare className="w-4 h-4 text-green-500" />
                ) : (
                  <LucideSquare className="w-4 h-4" />
                )}
              </button>
              <span
                className={`flex-1 text-sm ${subtask.completed ? 'line-through' : ''} ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {subtask.title}
              </span>
              <button
                onClick={() => handleDeleteSubtask(subtask.id)}
                className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                  isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                }`}
                title="Delete subtask"
              >
                <LucideTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskDetailSubtasks;
