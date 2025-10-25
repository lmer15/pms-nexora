import { useState, useEffect, useCallback } from 'react';
import { realtimeDb } from '../config/firebase';
import { ref, onValue, off, push, set, get } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { useFacility } from '../context/FacilityContext';
import notificationService, { Notification } from '../api/notificationService';

interface RealtimeNotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  priority: string;
  category: string;
  sourceId?: string;
  sourceType?: string;
  facilityId?: string;
  projectId?: string;
  taskId?: string;
  actionUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  timestamp: number;
}

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const { currentFacility } = useFacility();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial notifications
  const loadInitialNotifications = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      
      const response = await notificationService.getNotifications({
        limit: 20,
        facilityId: currentFacility?.id
      });
      
      setNotifications(response.notifications);

      const count = await notificationService.getUnreadCount(currentFacility?.id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading initial notifications:', err);
      setError('Failed to load notifications');
      // Don't set loading to false on error, let it retry
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentFacility?.id]);

  // Set up real-time listeners
  useEffect(() => {
    if (!user?.uid) {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    const userId = user.uid;
    
    const notificationsRef = ref(realtimeDb, `userNotifications/${userId}`);
    const countRef = ref(realtimeDb, `userNotificationCounts/${userId}`);
    

    const handleNotificationChange = (snapshot: any) => {
      try {
        const data = snapshot.val();
        if (data) {
          const newNotifications: Notification[] = Object.values(data).map((notification: any) => ({
            id: notification.id,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            read: notification.read,
            priority: notification.priority,
            category: notification.category,
            sourceId: notification.sourceId,
            sourceType: notification.sourceType,
            facilityId: notification.facilityId,
            projectId: notification.projectId,
            taskId: notification.taskId,
            actionUrl: notification.actionUrl,
            expiresAt: notification.expiresAt,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt
          }));

          // Sort by creation date (newest first)
          newNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          setNotifications(newNotifications);
        } else {
          // Don't clear notifications if Firebase returns null - keep the ones from REST API
        }
      } catch (err) {
        console.error('Error processing notification data:', err);
        setError('Failed to process notifications');
      }
    };

    const handleCountChange = (snapshot: any) => {
      const count = snapshot.val();
      setUnreadCount(count || 0);
    };

    // Set up listeners with error handling - make Firebase optional
    onValue(notificationsRef, handleNotificationChange, (error) => {
      if (error) {
        console.warn('Firebase listener error (using REST API fallback):', error);
        // Don't set error state, just use REST API
      }
    });
    onValue(countRef, handleCountChange, (error) => {
      if (error) {
        console.warn('Firebase count listener error (using REST API fallback):', error);
        // Don't set error state, just use REST API
      }
    });

    // Load initial data
    loadInitialNotifications();

    // Set up periodic refresh as fallback (every 30 seconds)
    const refreshInterval = setInterval(() => {
      loadInitialNotifications();
    }, 30000);

    // Set up retry mechanism for failed loads
    const retryInterval = setInterval(() => {
      if (notifications.length === 0 && !loading) {
        loadInitialNotifications();
      }
    }, 10000); // Check every 10 seconds

    // Cleanup listeners
    return () => {
      clearInterval(refreshInterval);
      clearInterval(retryInterval);
      off(notificationsRef, 'value', handleNotificationChange);
      off(countRef, 'value', handleCountChange);
    };
  }, [user?.uid, loadInitialNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead(currentFacility?.id);
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [currentFacility?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if notification was unread
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  }, [notifications]);


  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    loadInitialNotifications();
  }, [loadInitialNotifications]);


  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };
};

export default useRealtimeNotifications;
