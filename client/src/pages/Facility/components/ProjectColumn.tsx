import React, { useState, useEffect, useRef } from 'react';
import {
  LucidePlus,
  LucideMoreHorizontal,
  LucideArchive,
  LucideTrash2,
  LucideChevronDown,
} from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { Column, Task } from '../types';
import TaskCard from './TaskCard';
import { RoleGuard, usePermissions } from '../../../components/RoleGuard';

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
  handleUpdateProjectStatus: (projectId: string, status: string) => void;
  handleOpenTaskDetail: (taskId: string) => void;
  onTaskMove?: (taskId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  facilityId?: string;
  selectedProjectId?: string | null;
  availableAssignees?: Array<{id: string, name: string, email?: string, profilePicture?: string}>;
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
  handleUpdateProjectStatus,
  handleOpenTaskDetail,
  onTaskMove,
  facilityId,
  selectedProjectId,
  availableAssignees,
}) => {
  const { hasPermission } = usePermissions();
  // State for status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // State for highlight effect
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Local state for project status (for instant updates)
  const [currentProjectStatus, setCurrentProjectStatus] = useState<string | null>(null);
  const [lastClientUpdate, setLastClientUpdate] = useState<number | null>(null);

  // Effect to handle project selection highlight
  useEffect(() => {
    if (selectedProjectId === column.id) {
      setIsHighlighted(true);
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setIsHighlighted(false);
    }
  }, [selectedProjectId, column.id]);

  // Reset local status when server data updates (similar to TaskCard pattern)
  useEffect(() => {
    // If the column's temporary status is cleared and we have project status, it means the server has updated
    if (!(column as any)._status && (column as any)._projectStatus && currentProjectStatus && lastClientUpdate) {
      // Check if enough time has passed since our client update
      const timeSinceClientUpdate = Date.now() - lastClientUpdate;
      if (timeSinceClientUpdate > 2000) { // 2 seconds
        setCurrentProjectStatus(null);
        setLastClientUpdate(null);
      }
    }
  }, [column, currentProjectStatus, lastClientUpdate]);

  // Project status colors
  const statusColors = {
    'planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    'critical': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  // Calculate project status based on tasks
  const calculateProjectStatus = () => {
    if (column.tasks.length === 0) return 'planning';
    
    const completedTasks = column.tasks.filter(task => task.status === 'done').length;
    const totalTasks = column.tasks.length;
    
    if (completedTasks === totalTasks) return 'completed';
    if (completedTasks > 0) return 'in-progress';
    return 'planning';
  };

  const currentStatus = currentProjectStatus || (column as any)._status || (column as any)._projectStatus || (column as any).status || calculateProjectStatus();
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      } ${
        isHighlighted ? 'ring-4 ring-green-500 ring-opacity-75 shadow-lg shadow-green-500/25' : ''
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
          {/* Project Status Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${statusColors[currentStatus]}`}
              title="Change project status"
            >
              <span className="capitalize">{currentStatus.replace('-', ' ')}</span>
              <LucideChevronDown className="w-3 h-3" />
            </button>
            
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                {Object.keys(statusColors).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      // Update local state immediately for instant UI feedback
                      setCurrentProjectStatus(status);
                      setLastClientUpdate(Date.now());
                      setShowStatusDropdown(false);
                      // Then call the handler
                      handleUpdateProjectStatus(column.id, status);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md ${statusColors[status]}`}
                  >
                    {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* More Options Button */}
          <RoleGuard requiredPermission="projects.delete" facilityId={facilityId}>
            <div className="relative">
              <button
                onClick={() => setOpenDropdownId(openDropdownId === column.id ? null : column.id)}
                className="flex items-center justify-center p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <LucideMoreHorizontal className="w-4 h-4" />
              </button>
            {openDropdownId === column.id && (
              <div className={`absolute right-0 mt-1 w-32 rounded-md shadow-lg z-10 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <RoleGuard requiredPermission="projects.archive" facilityId={facilityId}>
                  <button
                    onClick={() => handleArchiveProject(column.id, column.title)}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    <LucideArchive className="w-4 h-4 inline mr-2" />
                    Archive
                  </button>
                </RoleGuard>
                <RoleGuard requiredPermission="projects.delete" facilityId={facilityId}>
                  <button
                    onClick={() => handleDeleteProject(column.id, column.title)}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400`}
                  >
                    <LucideTrash2 className="w-4 h-4 inline mr-2" />
                    Delete
                  </button>
                </RoleGuard>
              </div>
            )}
            </div>
          </RoleGuard>
        </div>
      </div>

      {/* Add Task Button */}
      <RoleGuard requiredPermission="tasks.create" facilityId={facilityId}>
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
      </RoleGuard>

      {/* Tasks - Scrollable */}
      <div className="overflow-y-auto project-column-scroll">
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
                key={`${task.id}-${(task as any)._clientUpdatedAt || task.updatedAt || task.createdAt}`}
                task={task}
                columnId={column.id}
                isDarkMode={isDarkMode}
                handleDeleteTask={handleDeleteTask}
                handleOpenTaskDetail={handleOpenTaskDetail}
                onTaskMove={onTaskMove}
                facilityId={facilityId}
                availableAssignees={availableAssignees}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectColumn;
