import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Column } from '../types';
import ProjectColumn from './ProjectColumn';
import ProjectCreator from './ProjectCreator';

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
  handleDragEnd: (event: DragEndEvent) => void;
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
  handleDragEnd,
  handleCreateTask,
  handleSaveNewTask,
  handleCancelNewTask,
  handleDeleteTask,
  handleSaveTask,
  handleCancelEdit,
  handleArchiveProject,
  handleDeleteProject,
  handleUpdateProjectName,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="p-2 overflow-x-auto flex-1">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToParentElement]}>
        <div className="flex space-x-2 min-w-max pb-4 h-full min-h-0 items-start">
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
          handleOpenTaskDetail={handleOpenTaskDetail}
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
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
