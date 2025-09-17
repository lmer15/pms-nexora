import React, { useEffect } from 'react';
import { LucideCheckCircle, LucideXCircle } from 'lucide-react';

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number; // in milliseconds
  type?: 'success' | 'error'; // notification type
}

const Notification: React.FC<NotificationProps> = ({ message, onClose, duration = 3000, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
  const textColor = 'text-white';
  const icon = isSuccess ? <LucideCheckCircle className="w-6 h-6 text-white animate-pulse" /> : <LucideXCircle className="w-6 h-6 text-white animate-pulse" />;

  return (
    <div className={`fixed bottom-5 right-5 z-[1000] max-w-xs w-full ${bgColor} rounded-md shadow-lg flex items-center space-x-3 p-4`}>
      {icon}
      <span className={`${textColor} font-medium`}>{message}</span>
    </div>
  );
};

export default Notification;
