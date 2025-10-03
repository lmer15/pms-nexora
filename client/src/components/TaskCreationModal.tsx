import React, { useState, useEffect, useRef } from 'react';
import { LucideX } from 'lucide-react';

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskName: string) => void;
  isDarkMode: boolean;
  position?: { top: number; left: number };
  placeholder?: string;
}

const TaskCreationModal: React.FC<TaskCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode,
  position = { top: 0, left: 0 },
  placeholder = "Enter task name..."
}) => {
  const [taskName, setTaskName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTaskName('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim()) {
      onSubmit(taskName.trim());
      setTaskName('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Calculate safe positioning to keep modal within viewport
  const getSafePosition = () => {
    const modalWidth = 280; // much smaller width
    const modalHeight = 80; // much smaller height
    const padding = 16; // 16px padding from edges
    
    let safeTop = position.top;
    let safeLeft = position.left;
    
    // Check if modal would go off the right edge
    if (safeLeft + modalWidth > window.innerWidth - padding) {
      safeLeft = window.innerWidth - modalWidth - padding;
    }
    
    // Check if modal would go off the left edge
    if (safeLeft < padding) {
      safeLeft = padding;
    }
    
    // Check if modal would go off the bottom edge
    if (safeTop + modalHeight > window.innerHeight - padding) {
      safeTop = position.top - modalHeight - 10; // Position above the button
    }
    
    // Check if modal would go off the top edge
    if (safeTop < padding) {
      safeTop = padding;
    }
    
    return { top: safeTop, left: safeLeft };
  };

  const safePosition = getSafePosition();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[1000]" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={`fixed z-[1001] p-3 rounded-lg shadow-lg border w-72 ${
          isDarkMode
            ? 'bg-gray-800 border-green-500 text-white'
            : 'bg-white border-green-400 text-gray-900'
        }`}
        style={{
          top: `${safePosition.top}px`,
          left: `${safePosition.left}px`,
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`flex-1 px-3 py-2 rounded-md text-sm border focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-md transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <LucideX className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!taskName.trim()}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                taskName.trim()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : isDarkMode
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default TaskCreationModal;
