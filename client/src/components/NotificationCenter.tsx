import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LucideBell, 
  LucideX, 
  LucideCheck, 
  LucideTrash2, 
  LucideSettings,
  LucideClock,
  LucideAlertCircle,
  LucideInfo,
  LucideCheckCircle,
  LucideMessageSquare,
  LucideFolder,
  LucideBuilding,
  LucideCog
} from 'lucide-react';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import notificationService, { NotificationStats } from '../api/notificationService';
import { useFacility } from '../context/FacilityContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { currentFacility } = useFacility();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useRealtimeNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Load stats when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, currentFacility]);

  const loadStats = async () => {
    try {
      const stats = await notificationService.getNotificationStats(currentFacility?.id);
      setStats(stats);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  // Filter notifications based on active tab and category
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread' && notification.read) return false;
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
    // Only filter by facility if both currentFacility and notification.facilityId are set
    // Allow notifications with null facilityId (system notifications) to show
    if (currentFacility?.id && notification.facilityId && notification.facilityId !== currentFacility.id) return false;
    return true;
  });

  const getNotificationIcon = (category: string, type: string) => {
    switch (category) {
      case 'task':
        return <LucideCheckCircle className="w-4 h-4 text-blue-500" />;
      case 'project':
        return <LucideFolder className="w-4 h-4 text-green-500" />;
      case 'facility':
        return <LucideBuilding className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <LucideCog className="w-4 h-4 text-gray-500" />;
      case 'communication':
        return <LucideMessageSquare className="w-4 h-4 text-orange-500" />;
      default:
        return <LucideBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'low':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTimeAgo = (dateInput: string | any) => {
    let date: Date;
    
    // Handle Firestore Timestamp objects
    if (dateInput && typeof dateInput === 'object' && dateInput.seconds) {
      date = new Date(dateInput.seconds * 1000);
    } else if (dateInput && typeof dateInput === 'object' && dateInput._seconds) {
      // Handle Firestore Timestamp with _seconds property
      date = new Date(dateInput._seconds * 1000);
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      return 'Unknown time';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread (but don't fail if it doesn't work)
    if (!notification.read) {
      markAsRead(notification.id).catch(err => {
        console.warn('Failed to mark notification as read:', err);
        // Continue with navigation even if mark as read fails
      });
    }
    
    // Navigate to the action URL if it exists
    if (notification.actionUrl) {
      // Handle both old and new URL formats
      let targetUrl = notification.actionUrl;
      
      // If it's an old format URL (contains /project/ and /task/), extract just the facility ID
      if (targetUrl.includes('/project/') && targetUrl.includes('/task/')) {
        const facilityMatch = targetUrl.match(/\/facility\/([^\/]+)/);
        if (facilityMatch) {
          targetUrl = `/facility/${facilityMatch[1]}`;
        }
      }
      
      navigate(targetUrl);
      onClose(); // Close the notification center
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <LucideBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <LucideX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'all'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'unread'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Category Filter */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          <option value="task">Tasks</option>
          <option value="project">Projects</option>
          <option value="facility">Facility</option>
          <option value="system">System</option>
          <option value="communication">Communication</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <LucideBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                } ${notification.actionUrl ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.category, notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        !notification.read 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id).catch(err => {
                                console.warn('Failed to mark notification as read:', err);
                              });
                            }}
                            className="text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                            title="Mark as read"
                          >
                            <LucideCheck className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id).catch(err => {
                              console.warn('Failed to delete notification:', err);
                            });
                          }}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <LucideTrash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm mt-1 ${
                      !notification.read 
                        ? 'text-gray-800 dark:text-gray-200' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notification.priority === 'urgent' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : notification.priority === 'high'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <button
          onClick={() => {
            // Navigate to notification settings
            window.location.href = '/settings?tab=notifications';
          }}
          className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
        >
          <LucideSettings className="w-4 h-4" />
          <span>Notification Settings</span>
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;
