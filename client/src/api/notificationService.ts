import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
  private async getAuthHeaders() {
    // Use the JWT token from localStorage instead of Firebase ID token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getNotifications(filters: NotificationFilters = {}): Promise<{ notifications: Notification[]; pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.unreadOnly) params.append('unreadOnly', 'true');
      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.facilityId) params.append('facilityId', filters.facilityId);

      const response = await axios.get(`${API_BASE_URL}/notifications?${params}`, {
        headers: await this.getAuthHeaders()
      });

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

      const response = await axios.get(`${API_BASE_URL}/notifications/stats?${params}`, {
        headers: await this.getAuthHeaders()
      });

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

      const response = await axios.get(`${API_BASE_URL}/notifications/unread-count?${params}`, {
        headers: await this.getAuthHeaders()
      });

      return response.data.count;
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: await this.getAuthHeaders()
      });

      return response.data.notification;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }

  async markAllAsRead(facilityId?: string): Promise<{ updated: number }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/notifications/mark-all-read`, {
        facilityId
      }, {
        headers: await this.getAuthHeaders()
      });

      return { updated: response.data.updated };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: await this.getAuthHeaders()
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete notification');
    }
  }

}

export default new NotificationService();
