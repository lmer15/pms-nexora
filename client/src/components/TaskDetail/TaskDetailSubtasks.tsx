import React, { useState, useRef, useEffect } from 'react';
import { LucideCheckSquare, LucideSquare, LucidePlus, LucideTrash2, LucideEdit2, LucideCheck, LucideX } from 'lucide-react';
import { TaskSubtask, taskService } from '../../api/taskService';
import { Button } from '../ui/button';

interface TaskDetailSubtasksProps {
  subtasks: TaskSubtask[];
  taskId: string;
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
  onShowConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
  onRefresh?: () => void;
}

const TaskDetailSubtasks: React.FC<TaskDetailSubtasksProps> = ({ 
  subtasks, 
  taskId, 
  isDarkMode, 
  onShowWarning, 
  onShowConfirmation, 
  onRefresh 
}) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [localSubtasks, setLocalSubtasks] = useState<TaskSubtask[]>(subtasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with props
  useEffect(() => {
    setLocalSubtasks(subtasks);
  }, [subtasks]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    setIsAdding(true);
    try {
      const subtask = await taskService.createSubtask(taskId, { title: newSubtask.trim() });
      
      // Update local state
      setLocalSubtasks(prev => [...prev, subtask]);
      setNewSubtask('');
      
      // Refresh parent component
      onRefresh?.();
      
      onShowWarning?.('Subtask added successfully', 'success');
    } catch (error: any) {
      console.error('Failed to add subtask:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add subtask';
      onShowWarning?.(errorMessage, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const updatedSubtask = await taskService.updateSubtask(taskId, subtaskId, { completed: !completed });
      
      // Update local state
      setLocalSubtasks(prev => 
        prev.map(subtask => 
          subtask.id === subtaskId 
            ? { ...subtask, completed: !completed }
            : subtask
        )
      );
      
      // Refresh parent component
      onRefresh?.();
    } catch (error: any) {
      console.error('Failed to update subtask:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update subtask';
      onShowWarning?.(errorMessage, 'error');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const subtask = localSubtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    onShowConfirmation?.(
      'Delete Subtask',
      `Are you sure you want to delete "${subtask.title}"? This action cannot be undone.`,
      async () => {
        try {
          await taskService.deleteSubtask(taskId, subtaskId);
          
          // Update local state
          setLocalSubtasks(prev => prev.filter(s => s.id !== subtaskId));
          
          // Refresh parent component
          onRefresh?.();
          
          onShowWarning?.('Subtask deleted successfully', 'success');
        } catch (error: any) {
          console.error('Failed to delete subtask:', error);
          const errorMessage = error.response?.data?.message || 'Failed to delete subtask';
          onShowWarning?.(errorMessage, 'error');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleStartEdit = (subtask: TaskSubtask) => {
    setEditingId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;

    try {
      const updatedSubtask = await taskService.updateSubtask(taskId, editingId, { title: editingTitle.trim() });
      
      // Update local state
      setLocalSubtasks(prev => 
        prev.map(subtask => 
          subtask.id === editingId 
            ? { ...subtask, title: editingTitle.trim() }
            : subtask
        )
      );
      
      // Refresh parent component
      onRefresh?.();
      
      setEditingId(null);
      setEditingTitle('');
    } catch (error: any) {
      console.error('Failed to update subtask:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update subtask';
      onShowWarning?.(errorMessage, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const completedCount = localSubtasks.filter(subtask => subtask.completed).length;
  const totalCount = localSubtasks.length;
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
        {localSubtasks.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideCheckSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No subtasks yet. Add one above!</p>
          </div>
        ) : (
          localSubtasks.map((subtask) => (
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
              
              {/* Title Display or Edit Input */}
              {editingId === subtask.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 text-green-600 hover:text-green-700 transition-colors"
                    title="Save"
                  >
                    <LucideCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Cancel"
                  >
                    <LucideX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span
                  className={`flex-1 text-sm cursor-pointer ${subtask.completed ? 'line-through' : ''} ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  onClick={() => handleStartEdit(subtask)}
                  title="Click to edit"
                >
                  {subtask.title}
                </span>
              )}
              
              {/* Action Buttons */}
              {editingId !== subtask.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(subtask)}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDarkMode ? 'text-gray-500 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'
                    }`}
                    title="Edit subtask"
                  >
                    <LucideEdit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className={`p-1.5 rounded-md transition-colors ${
                      isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-gray-700' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'
                    }`}
                    title="Delete subtask"
                  >
                    <LucideTrash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskDetailSubtasks;
