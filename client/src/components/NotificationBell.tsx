import React, { useState } from 'react';
import { LucideBell } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, loading } = useRealtimeNotifications();

  const handleBellClick = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationCenterClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={handleBellClick}
          className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
          disabled={loading}
        >
          <LucideBell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <NotificationCenter
        isOpen={isOpen}
        onClose={handleNotificationCenterClose}
      />
    </>
  );
};

export default NotificationBell;
