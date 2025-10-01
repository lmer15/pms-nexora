import React, { useState, useMemo } from 'react';
import { Column, Task } from '../types';

interface ListViewProps {
  columns: Column[];
  isDarkMode: boolean;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string, taskTitle: string, columnId: string) => void;
  onTaskMove: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
}

interface FlattenedTask extends Task {
  projectId: string;
  projectName: string;
  level: number; // 0 for main tasks, 1+ for subtasks
  parentId?: string;
}

const ListView: React.FC<ListViewProps> = ({
  columns,
  isDarkMode,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onTaskMove,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [sortBy, setSortBy] = useState<keyof FlattenedTask>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState<'project' | 'status' | 'assignee' | 'priority' | 'none'>('project');

  // Flatten all tasks with project information
  const flattenedTasks = useMemo(() => {
    const tasks: FlattenedTask[] = [];
    
    columns.forEach(column => {
      column.tasks.forEach(task => {
        tasks.push({
          ...task,
          projectId: column.id,
          projectName: column.title,
          level: 0,
        });
      });
    });
    
    return tasks;
  }, [columns]);

  // Group and sort tasks
  const processedTasks = useMemo(() => {
    let sorted = [...flattenedTasks].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    if (groupBy === 'none') {
      return { groups: [{ name: 'All Tasks', tasks: sorted }] };
    }

    const groups: { [key: string]: FlattenedTask[] } = {};
    
    sorted.forEach(task => {
      let groupKey = '';
      switch (groupBy) {
        case 'project':
          groupKey = task.projectName;
          break;
        case 'status':
          groupKey = task.status;
          break;
        case 'assignee':
          groupKey = task.assigneeName || 'Unassigned';
          break;
        case 'priority':
          groupKey = task.priority || 'No Priority';
          break;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return {
      groups: Object.entries(groups).map(([name, tasks]) => ({ name, tasks }))
    };
  }, [flattenedTasks, sortBy, sortOrder, groupBy]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === flattenedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(flattenedTasks.map(t => t.id)));
    }
  };

  const handleBulkAction = (action: 'delete' | 'move' | 'update-status') => {
    if (selectedTasks.size === 0) return;
    
    // Implement bulk actions
    console.log(`Bulk ${action} for tasks:`, Array.from(selectedTasks));
  };

  const startEditing = (taskId: string, field: string, currentValue: string) => {
    setEditingTaskId(taskId);
    setEditingField(field);
    setEditingValue(currentValue);
  };

  const saveEdit = () => {
    if (editingTaskId && editingField) {
      onTaskUpdate(editingTaskId, { [editingField]: editingValue });
    }
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue('');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditingField(null);
    setEditingValue('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'review': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  return (
    <div className={`flex-1 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header Controls */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Group by:
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className={`px-3 py-1 rounded-md text-sm border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="project">Project</option>
                <option value="status">Status</option>
                <option value="assignee">Assignee</option>
                <option value="priority">Priority</option>
                <option value="none">None</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof FlattenedTask)}
                className={`px-3 py-1 rounded-md text-sm border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {selectedTasks.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {selectedTasks.size} selected
              </span>
              <button
                onClick={() => handleBulkAction('update-status')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Update Status
              </button>
              <button
                onClick={() => handleBulkAction('move')}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Move
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="list-view-table w-full">
          <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === flattenedTasks.length && flattenedTasks.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className={`p-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Task
              </th>
              <th className={`p-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </th>
              <th className={`p-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Assignee
              </th>
              <th className={`p-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Priority
              </th>
              <th className={`p-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Due Date
              </th>
              <th className={`p-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Project
              </th>
              <th className={`p-3 text-left text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {processedTasks.groups.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupBy !== 'none' && (
                  <tr className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <td colSpan={8} className={`p-3 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {group.name} ({group.tasks.length})
                    </td>
                  </tr>
                )}
                {group.tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-b hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => handleSelectTask(task.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => onTaskClick(task.id)}
                        >
                          {editingTaskId === task.id && editingField === 'title' ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              className={`w-full px-2 py-1 rounded border ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                              onDoubleClick={() => startEditing(task.id, 'title', task.title)}
                            >
                              {task.title}
                            </span>
                          )}
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {task.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/20 dark:text-blue-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full dark:bg-gray-700 dark:text-gray-400">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {editingTaskId === task.id && editingField === 'status' ? (
                        <select
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEdit}
                          className={`px-2 py-1 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          autoFocus
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${getStatusColor(task.status)}`}
                          onDoubleClick={() => startEditing(task.id, 'status', task.status)}
                        >
                          {task.status === 'todo' ? 'To Do' : 
                           task.status === 'in-progress' ? 'In Progress' :
                           task.status === 'review' ? 'Review' : 'Done'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingTaskId === task.id && editingField === 'assignee' ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className={`w-full px-2 py-1 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}
                          onDoubleClick={() => startEditing(task.id, 'assignee', task.assigneeName || '')}
                        >
                          {task.assigneeName || 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingTaskId === task.id && editingField === 'priority' ? (
                        <select
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEdit}
                          className={`px-2 py-1 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          autoFocus
                        >
                          <option value="">No Priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${getPriorityColor(task.priority)}`}
                          onDoubleClick={() => startEditing(task.id, 'priority', task.priority || '')}
                        >
                          {task.priority || 'No Priority'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingTaskId === task.id && editingField === 'dueDate' ? (
                        <input
                          type="date"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEdit}
                          className={`px-2 py-1 rounded border ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} cursor-pointer ${
                            isOverdue(task.dueDate) ? 'text-red-500 font-semibold' :
                            isDueSoon(task.dueDate) ? 'text-yellow-500 font-semibold' : ''
                          }`}
                          onDoubleClick={() => startEditing(task.id, 'dueDate', task.dueDate || '')}
                        >
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {task.projectName}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onTaskClick(task.id)}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => onTaskDelete(task.id, task.title, task.projectId)}
                          className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
