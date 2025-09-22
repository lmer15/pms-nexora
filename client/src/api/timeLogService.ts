import api from './api';

export interface TimeLogEntry {
  id: string;
  taskId: string;
  taskTitle?: string;
  projectId?: string;
  projectName?: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  userId: string;
  userName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLogSummary {
  totalTime: number;
  totalEntries: number;
  todayTime: number;
  todayEntries: number;
  activeTasks: number;
}

export interface CreateTimeLogData {
  taskId: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface UpdateTimeLogData {
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

const timeLogService = {
  // Get all time logs for a user across all tasks
  getAllTimeLogs: async (): Promise<TimeLogEntry[]> => {
    const response = await api.get('/timeLogs');
    return response.data;
  },

  // Get time logs for a specific task
  getTimeLogsByTask: async (taskId: string): Promise<TimeLogEntry[]> => {
    const response = await api.get(`/tasks/${taskId}/timeLogs`);
    return response.data;
  },

  // Get time logs for a specific project
  getTimeLogsByProject: async (projectId: string): Promise<TimeLogEntry[]> => {
    const response = await api.get(`/projects/${projectId}/timeLogs`);
    return response.data;
  },

  // Get time logs for a specific date range
  getTimeLogsByDateRange: async (startDate: string, endDate: string): Promise<TimeLogEntry[]> => {
    const response = await api.get(`/timeLogs/range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get today's time logs
  getTodayTimeLogs: async (): Promise<TimeLogEntry[]> => {
    const today = new Date().toISOString().split('T')[0];
    return timeLogService.getTimeLogsByDateRange(today, today);
  },

  // Get time log summary
  getTimeLogSummary: async (): Promise<TimeLogSummary> => {
    const response = await api.get('/timeLogs/summary');
    return response.data;
  },

  // Create a new time log
  createTimeLog: async (timeLogData: CreateTimeLogData): Promise<TimeLogEntry> => {
    const response = await api.post(`/tasks/${timeLogData.taskId}/timeLogs`, timeLogData);
    return response.data;
  },

  // Update a time log
  updateTimeLog: async (taskId: string, timeLogId: string, timeLogData: UpdateTimeLogData): Promise<TimeLogEntry> => {
    const response = await api.put(`/tasks/${taskId}/timeLogs/${timeLogId}`, timeLogData);
    return response.data;
  },

  // Delete a time log
  deleteTimeLog: async (taskId: string, timeLogId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/timeLogs/${timeLogId}`);
  },

  // Start time tracking (create a running time log)
  startTimeTracking: async (taskId: string, description?: string): Promise<TimeLogEntry> => {
    const response = await api.post(`/tasks/${taskId}/timeLogs/start`, {
      description: description || 'Work session'
    });
    return response.data;
  },

  // Stop time tracking (update the running time log)
  stopTimeTracking: async (taskId: string, timeLogId: string): Promise<TimeLogEntry> => {
    const response = await api.post(`/tasks/${taskId}/timeLogs/${timeLogId}/stop`);
    return response.data;
  },

  // Get currently running time logs
  getRunningTimeLogs: async (): Promise<TimeLogEntry[]> => {
    const response = await api.get('/timeLogs/running');
    return response.data;
  },

  // Format duration helper
  formatDuration: (duration?: number): string => {
    if (!duration) return '0m';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`;
    }
    return `${seconds}s`;
  },

  // Calculate total time from array of time logs
  calculateTotalTime: (timeLogs: TimeLogEntry[]): number => {
    return timeLogs.reduce((total, log) => total + (log.duration || 0), 0);
  }
};

export { timeLogService };
