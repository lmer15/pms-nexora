import React from 'react';
import {
  LucideGrid3X3,
  LucideList,
  LucideCalendar,
  LucideClock,
} from 'lucide-react';

interface FloatingViewNavigationProps {
  currentView: 'kanban' | 'list' | 'calendar' | 'timeline';
  onViewChange: (view: 'kanban' | 'list' | 'calendar' | 'timeline') => void;
  isDarkMode: boolean;
}

const FloatingViewNavigation: React.FC<FloatingViewNavigationProps> = ({
  currentView,
  onViewChange,
  isDarkMode,
}) => {
  const views = [
    {
      id: 'kanban' as const,
      icon: LucideGrid3X3,
      label: 'Board',
      title: 'Board View'
    },
    {
      id: 'list' as const,
      icon: LucideList,
      label: 'List',
      title: 'List View'
    },
    {
      id: 'calendar' as const,
      icon: LucideCalendar,
      label: 'Calendar',
      title: 'Calendar View'
    },
    {
      id: 'timeline' as const,
      icon: LucideClock,
      label: 'Timeline',
      title: 'Timeline View'
    }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        flex items-center space-x-1 p-1 rounded-lg shadow-lg
        ${isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
        }
        transition-all duration-200 ease-in-out
      `}>
        {views.map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;
          
          return (
            <button
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={`
                flex items-center justify-center px-4 py-2 rounded-md transition-all duration-200
                ${isActive
                  ? 'bg-brand text-white shadow-sm'
                  : `
                    ${isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }
                  `
                }
              `}
              title={view.title}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingViewNavigation;
