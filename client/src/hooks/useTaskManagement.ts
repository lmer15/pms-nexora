import { useState } from 'react';
import { taskService } from '../api/taskService';
import { Column } from '../pages/Facility/types';

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
      
      // Update the columns state to remove the deleted task
      setColumns(prev => {
        const updatedColumns = prev.map(col =>
          col.id === columnId
            ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
            : col
        );
        return updatedColumns;
      });
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return false;
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
  };
};
