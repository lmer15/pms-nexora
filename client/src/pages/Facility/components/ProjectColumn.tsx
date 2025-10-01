import React, { useState } from 'react';
import {
  LucidePlus,
  LucideMoreHorizontal,
  LucideArchive,
  LucideTrash2,
  LucideEye,
  LucideEyeOff,
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { Column, Task } from '../types';
import TaskCard from './TaskCard';

interface ProjectColumnProps {
  column: Column;
  isDarkMode: boolean;
  editingTaskId: string | null;
  editingTaskTitle: string;
  setEditingTaskTitle: (title: string) => void;
  setEditingTaskId: (id: string | null) => void;
  addingTaskColumnId: string | null;
  setAddingTaskColumnId: (id: string | null) => void;
  openTaskDropdownId: string | null;
  setOpenTaskDropdownId: (id: string | null) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  editingProjectId: string | null;
  editingProjectName: string;
  setEditingProjectId: (id: string | null) => void;
  setEditingProjectName: (name: string) => void;
  handleCreateTask: (columnId: string) => void;
  handleSaveNewTask: (columnId: string) => void;
  handleCancelNewTask: () => void;
  handleDeleteTask: (taskId: string, taskTitle: string, columnId: string) => void;
  handleSaveTask: (taskId: string, columnId: string) => void;
  handleCancelEdit: (taskId: string, columnId: string) => void;
  handleArchiveProject: (projectId: string, projectName: string) => void;
  handleDeleteProject: (projectId: string, projectName: string) => void;
  handleUpdateProjectName: (projectId: string, name: string) => void;
  handleOpenTaskDetail: (taskId: string) => void;
  onTaskMove?: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  facilityId?: string;
}

const ProjectColumn: React.FC<ProjectColumnProps> = ({
  column,
  isDarkMode,
  editingTaskId,
  editingTaskTitle,
  setEditingTaskTitle,
  setEditingTaskId,
  addingTaskColumnId,
  setAddingTaskColumnId,
  openTaskDropdownId,
  setOpenTaskDropdownId,
  openDropdownId,
  setOpenDropdownId,
  editingProjectId,
  editingProjectName,
  setEditingProjectId,
  setEditingProjectName,
  handleCreateTask,
  handleSaveNewTask,
  handleCancelNewTask,
  handleDeleteTask,
  handleSaveTask,
  handleCancelEdit,
  handleArchiveProject,
  handleDeleteProject,
  handleUpdateProjectName,
  handleOpenTaskDetail,
  onTaskMove,
  facilityId,
}) => {
  // State for scrollbar visibility
  const [showScrollbar, setShowScrollbar] = useState(false);

  // Drop zone functionality
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  // Simple color generation based on column title
  const getColumnColor = (title: string, isDark: boolean) => {
    const colors = [
      'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',
      'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
      'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-700',
      'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700',
      'bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-700',
    ];
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getColumnTextColor = (title: string, isDark: boolean) => {
    const colors = [
      'text-blue-800 dark:text-blue-300',
      'text-green-800 dark:text-green-300',
      'text-purple-800 dark:text-purple-300',
      'text-orange-800 dark:text-orange-300',
      'text-pink-800 dark:text-pink-300',
    ];
    const hash = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const columnColorClasses = getColumnColor(column.title, isDarkMode);
  const textColorClasses = getColumnTextColor(column.title, isDarkMode);

  return (
    <div
      ref={setNodeRef}
      data-column-id={column.id}
      className={`group flex-shrink-0 flex flex-col max-h-[calc(100vh-160px)] rounded-lg project-column drag-transition ${columnColorClasses} p-3 ${
        isOver ? 'drop-zone-active' : ''
      }`}
      style={{ width: '16.25rem', minWidth: '16.25rem', maxWidth: '16.25rem' }}
      onMouseLeave={() => setOpenDropdownId(null)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0 overflow-hidden">
          {editingProjectId === column.id ? (
            <input
              type="text"
              value={editingProjectName}
              onChange={(e) => setEditingProjectName(e.target.value)}
              className={`w-full font-semibold text-sm mb-2 px-3 py-2 rounded-lg focus:outline-none border-none ${
                isDarkMode
                  ? 'bg-gray-600 text-white placeholder-gray-400'
                  : 'bg-white text-gray-900 placeholder-gray-500'
              }`}
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (editingProjectName.trim()) {
                    await handleUpdateProjectName(column.id, editingProjectName.trim());
                  }
                  setEditingProjectId(null);
                  setEditingProjectName('');
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setEditingProjectId(null);
                  setEditingProjectName('');
                }
              }}
              onBlur={async () => {
                if (editingProjectName.trim()) {
                  await handleUpdateProjectName(column.id, editingProjectName.trim());
                }
                setEditingProjectId(null);
                setEditingProjectName('');
              }}
            />
          ) : (
            <h3
              className={`font-semibold ${textColorClasses} text-sm cursor-pointer flex items-center min-w-0`}
              onClick={() => {
                setEditingProjectId(column.id);
                setEditingProjectName(column.title);
              }}
            >
              <span className="flex-shrink-0">{column.tasks.length} •</span>
              <span className="truncate whitespace-nowrap min-w-0 ml-1">{column.title}</span>
            </h3>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {/* Scrollbar Toggle Button */}
          <button
            onClick={() => setShowScrollbar(!showScrollbar)}
            className="flex items-center justify-center p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={showScrollbar ? "Hide scrollbar" : "Show scrollbar"}
          >
            {showScrollbar ? <LucideEyeOff className="w-4 h-4" /> : <LucideEye className="w-4 h-4" />}
          </button>
          
          {/* More Options Button */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdownId(openDropdownId === column.id ? null : column.id)}
              className="flex items-center justify-center p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LucideMoreHorizontal className="w-4 h-4" />
            </button>
          {openDropdownId === column.id && (
            <div className={`absolute right-0 mt-1 w-32 rounded-md shadow-lg z-10 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <button
                onClick={() => handleArchiveProject(column.id, column.title)}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                <LucideArchive className="w-4 h-4 inline mr-2" />
                Archive
              </button>
              <button
                onClick={() => handleDeleteProject(column.id, column.title)}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400`}
              >
                <LucideTrash2 className="w-4 h-4 inline mr-2" />
                Delete
              </button>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Add Task Button */}
      <button
        onClick={() => handleCreateTask(column.id)}
        className={`w-full mb-3 p-1.5 rounded-md text-sm flex items-center space-x-2 transition-colors ${
          isDarkMode
            ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }`}
      >
        <LucidePlus className="w-4 h-4" />
        <span>Add task</span>
      </button>

      {/* Tasks - Scrollable */}
      <div className={`overflow-y-auto project-column-scroll ${showScrollbar ? 'show-scrollbar' : ''}`}>
        <div className="space-y-2">
          {addingTaskColumnId === column.id ? (
            <input
              type="text"
              value={editingTaskTitle}
              onChange={(e) => setEditingTaskTitle(e.target.value)}
              placeholder="Task title..."
              className={`w-full font-semibold text-sm mb-2 px-3 py-2 rounded-lg focus:outline-none ${
                isDarkMode
                  ? 'bg-gray-600 text-white border-gray-500 placeholder-gray-400'
                  : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveNewTask(column.id);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelNewTask();
                }
              }}
              onBlur={() => handleSaveNewTask(column.id)}
            />
          ) : null}
          {column.tasks.length === 0 ? (
            // Empty state placeholder
            <div className={`min-h-[100px] rounded-lg border-2 border-dashed ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            } flex items-center justify-center`}>
              <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No tasks yet
              </span>
            </div>
          ) : (
            column.tasks
              .sort((a, b) => {
                // Sort pinned tasks to the top
                const aPinned = (a as any).pinned || false;
                const bPinned = (b as any).pinned || false;
                if (aPinned && !bPinned) return -1;
                if (!aPinned && bPinned) return 1;
                return 0;
              })
              .map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                isDarkMode={isDarkMode}
                handleDeleteTask={handleDeleteTask}
                handleOpenTaskDetail={handleOpenTaskDetail}
                onTaskMove={onTaskMove}
                facilityId={facilityId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectColumn;
