import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_updated' | 'project_updated' | 'facility_invite' | 'comment_mention' | 'due_date_reminder' | 'system_announcement';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'task' | 'project' | 'facility' | 'system' | 'communication' | 'general';
  sourceId?: string;
  sourceType?: string;
  facilityId?: string;
  projectId?: string;
  taskId?: string;
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface NotificationFilters {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  category?: string;
  type?: string;
  facilityId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class NotificationService {

  async getNotifications(filters: NotificationFilters = {}): Promise<{ notifications: Notification[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.unreadOnly) params.append('unreadOnly', 'true');
      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.facilityId) params.append('facilityId', filters.facilityId);

      const response = await api.get(`/notifications?${params}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }

  async getNotificationStats(facilityId?: string): Promise<NotificationStats> {
    try {
      const params = new URLSearchParams();
      if (facilityId) params.append('facilityId', facilityId);

      const response = await api.get(`/notifications/stats?${params}`);
      return response.data.stats;
    } catch (error: any) {
      console.error('Error fetching notification stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch notification stats');
    }
  }

  async getUnreadCount(facilityId?: string): Promise<number> {
    try {
      const params = new URLSearchParams();
      if (facilityId) params.append('facilityId', facilityId);

      const response = await api.get(`/notifications/unread-count?${params}`);
      return response.data.count || 0;
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`, {});
      return response.data.notification;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }

  async markAllAsRead(facilityId?: string): Promise<{ updated: number }> {
    try {
      const response = await api.put(`/notifications/mark-all-read`, {
        facilityId
      });
      return { updated: response.data.updated };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete notification');
    }
  }

  // Refresh notifications (useful for retry functionality)
  async refreshNotifications(filters: NotificationFilters = {}): Promise<{ notifications: Notification[]; pagination: any }> {
    return this.getNotifications(filters);
  }

}

export default new NotificationService();
