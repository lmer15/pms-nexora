import axios from 'axios';
import api from './api';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string; // Keep for backward compatibility
  assignees?: string[]; // New field for multiple assignees
  dueDate?: string;
  projectId: string;
  creatorId: string;
  createdAt: any;
  updatedAt: any;
  startDate?: string;
  estimatedDuration?: number;
  actualCompletionDate?: string;
  progress?: number;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  pinned?: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string; // Keep for backward compatibility
  assignees?: string[]; // New field for multiple assignees
  dueDate?: string;
  projectId: string;
  startDate?: string;
  estimatedDuration?: number;
  actualCompletionDate?: string;
  progress?: number;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  pinned?: boolean;
}

export interface TaskComment {
  id: string;
  content: string;
  creatorId: string;
  parentCommentId?: string; // For replies
  likes: string[]; // Array of user IDs who liked
  dislikes: string[]; // Array of user IDs who disliked
  replies?: TaskComment[]; // Array of reply comments
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  userProfile?: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploaderId: string;
  uploaderName?: string;
  uploadedAt?: any;
  createdAt?: any;
}

export interface TaskDependency {
  id: string;
  dependencyId: string;
  dependencyType: 'blocks' | 'blocked-by' | 'related';
  description?: string;
  creatorId: string;
  createdAt: string;
  dependentTask?: {
    id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    projectId: string;
  };
  creatorProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TaskSubtask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTimeLog {
  id: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivityLog {
  id: string;
  action: string;
  details?: string;
  userId: string;
  timestamp: string;
  metadata?: any;
}

export interface TaskDetails {
  task: Task;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  dependencies: TaskDependency[];
  subtasks: TaskSubtask[];
  timeLogs: TaskTimeLog[];
  activityLogs: TaskActivityLog[];
}

const taskService = {
  create: async (taskData: CreateTaskData): Promise<Task> => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  getByProject: async (projectId: string): Promise<Task[]> => {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  update: async (id: string, taskData: Partial<CreateTaskData>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  pin: async (id: string, pinned: boolean): Promise<Task> => {
    const response = await api.put(`/tasks/${id}/pin`, { pinned });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Task Details methods
  getTaskDetails: async (taskId: string): Promise<TaskDetails> => {
    const [task, comments, attachments, dependencies, subtasks, timeLogs, activityLogs] = await Promise.all([
      api.get(`/tasks/${taskId}`),
      api.get(`/tasks/${taskId}/comments`),
      api.get(`/tasks/${taskId}/attachments`),
      api.get(`/tasks/${taskId}/dependencies`),
      api.get(`/tasks/${taskId}/subtasks`),
      api.get(`/tasks/${taskId}/timeLogs`),
      api.get(`/tasks/${taskId}/activityLogs`),
    ]);

    return {
      task: task.data,
      comments: comments.data,
      attachments: attachments.data,
      dependencies: dependencies.data,
      subtasks: subtasks.data,
      timeLogs: timeLogs.data,
      activityLogs: activityLogs.data,
    };
  },

  // Comments
  getComments: async (taskId: string): Promise<TaskComment[]> => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  createComment: async (taskId: string, commentData: { 
    content: string; 
    parentCommentId?: string; 
    formatting?: { bold?: boolean; italic?: boolean; underline?: boolean; }
  }): Promise<TaskComment> => {
    const response = await api.post(`/tasks/${taskId}/comments`, commentData);
    return response.data;
  },

  updateComment: async (taskId: string, commentId: string, commentData: { 
    content: string; 
    formatting?: { bold?: boolean; italic?: boolean; underline?: boolean; }
  }): Promise<TaskComment> => {
    const response = await api.put(`/tasks/${taskId}/comments/${commentId}`, commentData);
    return response.data;
  },

  deleteComment: async (taskId: string, commentId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  },

  likeComment: async (taskId: string, commentId: string): Promise<{ likes: string[]; dislikes: string[] }> => {
    const response = await api.post(`/tasks/${taskId}/comments/${commentId}/like`);
    return response.data;
  },

  dislikeComment: async (taskId: string, commentId: string): Promise<{ likes: string[]; dislikes: string[] }> => {
    const response = await api.post(`/tasks/${taskId}/comments/${commentId}/dislike`);
    return response.data;
  },

  // Attachments
  getAttachments: async (taskId: string): Promise<TaskAttachment[]> => {
    const response = await api.get(`/tasks/${taskId}/attachments`);
    return response.data;
  },

  uploadAttachment: async (taskId: string, files: FileList): Promise<TaskAttachment[]> => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const response = await api.post(`/tasks/${taskId}/attachments/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.attachments;
  },

  createAttachment: async (taskId: string, attachmentData: { fileName: string; fileUrl: string; fileType: string; fileSize: number }): Promise<TaskAttachment> => {
    const response = await api.post(`/tasks/${taskId}/attachments`, attachmentData);
    return response.data;
  },

  deleteAttachment: async (taskId: string, attachmentId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  },

  // Dependencies
  getDependencies: async (taskId: string): Promise<TaskDependency[]> => {
    const response = await api.get(`/tasks/${taskId}/dependencies`);
    return response.data;
  },

  createDependency: async (taskId: string, dependencyData: { dependencyId: string; dependencyType: 'blocks' | 'blocked-by' | 'related'; description?: string }): Promise<TaskDependency> => {
    const response = await api.post(`/tasks/${taskId}/dependencies`, dependencyData);
    return response.data;
  },

  deleteDependency: async (taskId: string, dependencyId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
  },

  searchTasksForDependency: async (taskId: string, query: string, limit: number = 10): Promise<Array<{ id: string; title: string; status: string; projectId: string }>> => {
    const response = await api.get(`/tasks/${taskId}/dependencies/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Subtasks
  getSubtasks: async (taskId: string): Promise<TaskSubtask[]> => {
    const response = await api.get(`/tasks/${taskId}/subtasks`);
    return response.data;
  },

  createSubtask: async (taskId: string, subtaskData: { title: string; description?: string }): Promise<TaskSubtask> => {
    const response = await api.post(`/tasks/${taskId}/subtasks`, subtaskData);
    return response.data;
  },

  updateSubtask: async (taskId: string, subtaskId: string, subtaskData: { title?: string; description?: string; completed?: boolean }): Promise<TaskSubtask> => {
    const response = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, subtaskData);
    return response.data;
  },

  deleteSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  },

  // Time Logs
  getTimeLogs: async (taskId: string): Promise<TaskTimeLog[]> => {
    const response = await api.get(`/tasks/${taskId}/timeLogs`);
    return response.data;
  },

  createTimeLog: async (taskId: string, timeLogData: { description?: string; startTime: string; endTime?: string; duration?: number }): Promise<TaskTimeLog> => {
    const response = await api.post(`/tasks/${taskId}/timeLogs`, timeLogData);
    return response.data;
  },

  updateTimeLog: async (taskId: string, timeLogId: string, timeLogData: { description?: string; startTime?: string; endTime?: string; duration?: number }): Promise<TaskTimeLog> => {
    const response = await api.put(`/tasks/${taskId}/timeLogs/${timeLogId}`, timeLogData);
    return response.data;
  },

  deleteTimeLog: async (taskId: string, timeLogId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/timeLogs/${timeLogId}`);
  },

  // Activity Logs
  getActivityLogs: async (taskId: string): Promise<TaskActivityLog[]> => {
    const response = await api.get(`/tasks/${taskId}/activityLogs`);
    return response.data;
  },

  createActivityLog: async (taskId: string, activityData: { action: string; details?: string }): Promise<TaskActivityLog> => {
    const response = await api.post(`/tasks/${taskId}/activityLogs`, activityData);
    return response.data;
  },

  // Fetch user profiles by IDs
  fetchUserProfilesByIds: async (userIds: string[]): Promise<Record<string, { firstName: string; lastName: string; profilePicture?: string }>> => {
    if (userIds.length === 0) return {};
    const response = await api.post('/auth/users/profiles', { userIds });
    return response.data;
  },
};

export { taskService };
