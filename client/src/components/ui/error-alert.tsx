import React from 'react';
import { LucideAlertTriangle, LucideX } from 'lucide-react';
import { Button } from './button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Error',
  message,
  onClose,
  className = ''
}) => {
  return (
    <div className={`p-4 border border-red-200 bg-red-50 rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <LucideAlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {message}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="inline-flex bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50"
              >
                <span className="sr-only">Dismiss</span>
                <LucideX className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ErrorAlert };
