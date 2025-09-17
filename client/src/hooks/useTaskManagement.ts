import { useState } from 'react';
import { taskService } from '../api/taskService';
import { Column } from '../pages/Facility/types';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export const useTaskManagement = (
  columns: Column[],
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>,
  onTaskCreate?: () => void
) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [addingTaskColumnId, setAddingTaskColumnId] = useState<string | null>(null);

  const handleCreateTask = (columnId: string) => {
    setAddingTaskColumnId(columnId);
  };

  const handleSaveNewTask = async (columnId: string) => {
    if (!editingTaskTitle.trim()) {
      setAddingTaskColumnId(null);
      setEditingTaskTitle('');
      return;
    }
    try {
      const createdTask = await taskService.create({
        title: editingTaskTitle.trim(),
        projectId: columnId,
        status: 'todo',
      });
      setColumns(prev =>
        prev.map(col =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, createdTask] }
            : col
        )
      );
      onTaskCreate?.();
    } catch (error) {
      console.error('Error creating task:', error);
    }
    setAddingTaskColumnId(null);
    setEditingTaskTitle('');
  };

  const handleCancelNewTask = () => {
    setAddingTaskColumnId(null);
    setEditingTaskTitle('');
  };

  const handleSaveTask = async (taskId: string, columnId: string) => {
    if (!editingTaskTitle.trim()) {
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          : col
      ));
      setEditingTaskId(null);
      setEditingTaskTitle('');
      return;
    }

    try {
      const createdTask = await taskService.create({
        title: editingTaskTitle.trim(),
        projectId: columnId,
        status: 'todo'
      });

      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map(t =>
                t.id === taskId
                  ? { ...createdTask, status: createdTask.status }
                  : t
              )
            }
          : col
      ));
    } catch (error) {
      console.error('Error creating task:', error);
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          : col
      ));
    }

    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleCancelEdit = (taskId: string, columnId: string) => {
    setColumns(prev => prev.map(col =>
      col.id === columnId
        ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
        : col
    ));
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string, columnId: string) => {
    try {
      await taskService.delete(taskId);
      setColumns(prev => prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
          : col
      ));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    let activeColumn: Column | undefined;
    let activeTask: any;
    let activeIndex: number = -1;

    for (const column of columns) {
      const index = column.tasks.findIndex(task => task.id === activeId);
      if (index !== -1) {
        activeColumn = column;
        activeTask = column.tasks[index];
        activeIndex = index;
        break;
      }
    }

    if (!activeTask || !activeColumn) return;
    const overColumn = columns.find(col => col.id === overId);

    if (!overColumn) return;
    if (activeColumn.id === overColumn.id) {
      const newTasks = arrayMove(activeColumn.tasks, activeIndex, activeIndex);
      setColumns(prev => prev.map(col =>
        col.id === activeColumn!.id ? { ...col, tasks: newTasks } : col
      ));
    } else {
      const newActiveTasks = activeColumn.tasks.filter(task => task.id !== activeId);
      const newOverTasks = [...overColumn.tasks, activeTask];

      setColumns(prev => prev.map(col => {
        if (col.id === activeColumn!.id) {
          return { ...col, tasks: newActiveTasks };
        } else if (col.id === overColumn.id) {
          return { ...col, tasks: newOverTasks };
        } else {
          return col;
        }
      }));

      // Update task in API
      try {
        await taskService.update(activeId, { projectId: overColumn.id });
      } catch (error) {
        console.error('Error updating task project:', error);
        // Revert on error
        setColumns(prev => prev.map(col => {
          if (col.id === activeColumn!.id) {
            return { ...col, tasks: [...newActiveTasks.slice(0, activeIndex), activeTask, ...newActiveTasks.slice(activeIndex)] };
          } else if (col.id === overColumn.id) {
            return { ...col, tasks: newOverTasks.filter(t => t.id !== activeId) };
          } else {
            return col;
          }
        }));
      }
    }
  };

  return {
    editingTaskId,
    setEditingTaskId,
    editingTaskTitle,
    setEditingTaskTitle,
    addingTaskColumnId,
    setAddingTaskColumnId,
    handleCreateTask,
    handleSaveNewTask,
    handleCancelNewTask,
    handleSaveTask,
    handleCancelEdit,
    handleDeleteTask,
    handleDragEnd,
  };
};
