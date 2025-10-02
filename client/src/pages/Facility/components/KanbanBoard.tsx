import React from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { Column } from '../types';
import ProjectColumn from './ProjectColumn';
import ProjectCreator from './ProjectCreator';
import KanbanMiniMap from '../../../components/KanbanMiniMap';
import '../../../components/ui/DragDrop.css';

interface KanbanBoardProps {
  columns: Column[];
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
  isCreatingProject: boolean;
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  isCreatingLoading: boolean;
  createError: string;
  handleStartCreateProject: () => void;
  handleCancelCreateProject: () => void;
  handleCreateProject: () => void;
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
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  isDarkMode,
  editingTaskId,
  editingTaskTitle,
  setEditingTaskTitle,
  setEditingTaskId,
  handleOpenTaskDetail,
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
  isCreatingProject,
  newProjectName,
  setNewProjectName,
  isCreatingLoading,
  createError,
  handleStartCreateProject,
  handleCancelCreateProject,
  handleCreateProject,
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
  onTaskMove,
  facilityId,
  selectedProjectId,
}) => {
  const [activeTask, setActiveTask] = React.useState<any>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !active.data.current) return;

    // Only handle task drops
    if (active.data.current.type !== 'task') return;

    const activeTask = active.data.current.task;
    const activeColumnId = active.data.current.columnId;

    // Check if dropped on a column
    if (over.data.current?.type === 'column') {
      const overColumnId = over.data.current.columnId;
      
      if (activeColumnId === overColumnId) {
        // Same column - just reorder (for now, we'll implement this later)
        return;
      }

      // Different column - move task to new project
      if (onTaskMove) {
        onTaskMove(activeTask.id, activeColumnId, overColumnId, 0);
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-1 overflow-x-auto overflow-y-hidden flex-1 kanban-board h-full">
        <div className="flex space-x-2 min-w-max h-full min-h-0 items-start">
          {columns.map((column) => (
            <ProjectColumn
              key={column.id}
              column={column}
              isDarkMode={isDarkMode}
              editingTaskId={editingTaskId}
              editingTaskTitle={editingTaskTitle}
              setEditingTaskTitle={setEditingTaskTitle}
          setEditingTaskId={setEditingTaskId}
          addingTaskColumnId={addingTaskColumnId}
          setAddingTaskColumnId={setAddingTaskColumnId}
          openTaskDropdownId={openTaskDropdownId}
          setOpenTaskDropdownId={setOpenTaskDropdownId}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
          editingProjectId={editingProjectId}
          editingProjectName={editingProjectName}
          setEditingProjectId={setEditingProjectId}
          setEditingProjectName={setEditingProjectName}
          handleCreateTask={handleCreateTask}
          handleSaveNewTask={handleSaveNewTask}
          handleCancelNewTask={handleCancelNewTask}
          handleDeleteTask={handleDeleteTask}
          handleSaveTask={handleSaveTask}
          handleCancelEdit={handleCancelEdit}
          handleArchiveProject={handleArchiveProject}
          handleDeleteProject={handleDeleteProject}
          handleUpdateProjectName={handleUpdateProjectName}
          handleUpdateProjectStatus={handleUpdateProjectStatus}
          handleOpenTaskDetail={handleOpenTaskDetail}
          onTaskMove={onTaskMove}
          facilityId={facilityId}
          selectedProjectId={selectedProjectId}
        />
          ))}

          <ProjectCreator
            isCreatingProject={isCreatingProject}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            isCreatingLoading={isCreatingLoading}
            createError={createError}
            handleStartCreateProject={handleStartCreateProject}
            handleCancelCreateProject={handleCancelCreateProject}
            handleCreateProject={handleCreateProject}
            isDarkMode={isDarkMode}
        />
        </div>
      </div>

      {/* Mini Map */}
      <KanbanMiniMap
        columns={columns}
        isDarkMode={isDarkMode}
        onColumnClick={(columnId) => {
          const element = document.querySelector(`[data-column-id="${columnId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }}
      />
      
      <DragOverlay className="drag-overlay">
        {activeTask ? (
          <div className="drag-preview rounded-lg overflow-hidden bg-white dark:bg-gray-800 border-2 border-green-500 shadow-2xl" style={{ width: '16rem' }}>
            <div className="p-3">
              {/* Header with Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    activeTask.status === 'done' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                      : activeTask.status === 'in-progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                      : activeTask.status === 'review'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                  }`}>
                    {activeTask.status === 'todo' ? 'To Do' : 
                     activeTask.status === 'in-progress' ? 'In Progress' :
                     activeTask.status === 'review' ? 'Review' : 'Done'}
                  </span>
                </div>
              </div>

              {/* Task Title */}
              <h4 className="font-semibold text-sm leading-tight mb-3 text-gray-900 dark:text-white line-clamp-2">
                {activeTask.title}
              </h4>

              {/* Footer: Assignee and Due Date */}
              <div className="flex items-center justify-between">
                {/* Assignee */}
                <div className="flex items-center">
                  {(activeTask.assignees && activeTask.assignees.length > 0) || activeTask.assignee ? (
                    <div className="flex items-center">
                      {(activeTask.assignees || [activeTask.assignee]).slice(0, 3).map((assignee, index) => {
                        // Handle both string (ID) and object (with name) assignee formats
                        const displayName = typeof assignee === 'string' 
                          ? assignee 
                          : assignee?.name || assignee?.id || '';
                        const initial = displayName?.charAt?.(0)?.toUpperCase() || '?';
                        
                        return (
                          <div 
                            key={index}
                            className="w-6 h-6 rounded-full overflow-hidden bg-green-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white dark:border-gray-800"
                            style={{ marginLeft: index > 0 ? '-8px' : '0', zIndex: 3 - index }}
                          >
                            {initial}
                          </div>
                        );
                      })}
                      {(activeTask.assignees?.length || (activeTask.assignee ? 1 : 0)) > 3 && (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-500 text-white border-2 border-white dark:border-gray-800"
                          style={{ marginLeft: '-8px', zIndex: 0 }}
                        >
                          +{(activeTask.assignees?.length || (activeTask.assignee ? 1 : 0)) - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                      No assignee
                    </span>
                  )}
                </div>

                {/* Due Date */}
                {activeTask.dueDate && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(activeTask.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
