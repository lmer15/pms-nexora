import React, { useEffect, useState } from 'react';
import { LucideAlertTriangle, LucideX } from 'lucide-react';
import { Button } from './button';

interface WarningToastProps {
  message: string;
  visible: boolean;
  type?: 'warning' | 'error' | 'success';
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const WarningToast: React.FC<WarningToastProps> = ({
  message,
  visible,
  type = 'warning',
  duration = 5000,
  onClose,
  className = ''
}) => {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const handleClose = () => {
    onClose?.();
  };

  if (!visible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-400',
          title: 'text-green-800',
          message: 'text-green-700',
          button: 'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50'
        };
      default: // warning
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50'
        };
    }
  };

  const styles = getToastStyles();
  const title = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className={`max-w-md w-full ${styles.container} border rounded-lg p-4 shadow-lg z-[1000] ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <LucideAlertTriangle className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${styles.title}`}>
            {title}
          </p>
          <p className={`mt-1 text-sm ${styles.message}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className={`inline-flex p-1.5 ${styles.button}`}
            >
              <span className="sr-only">Dismiss</span>
              <LucideX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { WarningToast };
