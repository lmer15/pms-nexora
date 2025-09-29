import React from 'react';
import {
  LucidePlus,
  LucideMoreHorizontal,
  LucideArchive,
  LucideTrash2,
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
}) => {
  // Drop zone functionality
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      columnId: column.id,
    },
  });
  return (
    <div
      ref={setNodeRef}
      className={`group flex-shrink-0 flex flex-col min-h-0 max-h-full rounded-lg project-column drag-transition ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
      } p-3 ${
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
              className="font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer flex items-center min-w-0"
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
        <div className="relative">
          <button
            onClick={() => setOpenDropdownId(openDropdownId === column.id ? null : column.id)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
      <div className="flex-1 overflow-y-auto scrollbar-hide">
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectColumn;
