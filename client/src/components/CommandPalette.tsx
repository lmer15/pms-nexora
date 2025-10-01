import React, { useState, useEffect, useRef } from 'react';
import { LucideSearch, LucideX, LucideGrid3X3, LucideList, LucideCalendar, LucideClock, LucideUser, LucideFlag, LucideTag, LucideBuilding, LucideCheckSquare } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  // Data for search
  tasks?: Array<{
    id: string;
    title: string;
    status?: string;
    priority?: string;
    assigneeName?: string;
    projectTitle?: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    taskCount?: number;
  }>;
  assignees?: Array<{
    id: string;
    name: string;
  }>;
  tags?: string[];
  // Actions
  onTaskClick?: (taskId: string) => void;
  onProjectClick?: (projectId: string) => void;
  onViewChange?: (view: 'kanban' | 'list' | 'calendar' | 'timeline') => void;
  onAssigneeFilter?: (assignee: string) => void;
  onTagFilter?: (tag: string) => void;
  onPriorityFilter?: (priority: string) => void;
}

type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  type: 'task' | 'project' | 'view' | 'filter' | 'action';
  action: () => void;
  keywords: string[];
};

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  tasks = [],
  projects = [],
  assignees = [],
  tags = [],
  onTaskClick,
  onProjectClick,
  onViewChange,
  onAssigneeFilter,
  onTagFilter,
  onPriorityFilter,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Generate command items based on data and query
  const getCommandItems = (): CommandItem[] => {
    const items: CommandItem[] = [];

    // View switching commands
    if (!query || query.toLowerCase().includes('view') || query.toLowerCase().includes('board') || query.toLowerCase().includes('list') || query.toLowerCase().includes('calendar') || query.toLowerCase().includes('timeline')) {
      items.push(
        {
          id: 'view-kanban',
          title: 'Switch to Board View',
          subtitle: 'Grid layout with columns',
          icon: <LucideGrid3X3 className="w-4 h-4" />,
          type: 'view',
          action: () => {
            onViewChange?.('kanban');
            onClose();
          },
          keywords: ['board', 'kanban', 'grid', 'view']
        },
        {
          id: 'view-list',
          title: 'Switch to List View',
          subtitle: 'Table layout',
          icon: <LucideList className="w-4 h-4" />,
          type: 'view',
          action: () => {
            onViewChange?.('list');
            onClose();
          },
          keywords: ['list', 'table', 'view']
        },
        {
          id: 'view-calendar',
          title: 'Switch to Calendar View',
          subtitle: 'Calendar layout',
          icon: <LucideCalendar className="w-4 h-4" />,
          type: 'view',
          action: () => {
            onViewChange?.('calendar');
            onClose();
          },
          keywords: ['calendar', 'view']
        },
        {
          id: 'view-timeline',
          title: 'Switch to Timeline View',
          subtitle: 'Timeline layout',
          icon: <LucideClock className="w-4 h-4" />,
          type: 'view',
          action: () => {
            onViewChange?.('timeline');
            onClose();
          },
          keywords: ['timeline', 'view']
        }
      );
    }

    // Filter commands
    if (!query || query.toLowerCase().includes('filter') || query.toLowerCase().includes('assignee') || query.toLowerCase().includes('priority') || query.toLowerCase().includes('tag')) {
      // Assignee filters
      assignees.forEach(assignee => {
        if (!query || assignee.name.toLowerCase().includes(query.toLowerCase())) {
          items.push({
            id: `filter-assignee-${assignee.id}`,
            title: `Filter by ${assignee.name}`,
            subtitle: 'Filter tasks by assignee',
            icon: <LucideUser className="w-4 h-4" />,
            type: 'filter',
            action: () => {
              onAssigneeFilter?.(assignee.name);
              onClose();
            },
            keywords: ['filter', 'assignee', assignee.name.toLowerCase()]
          });
        }
      });

      // Priority filters
      ['high', 'medium', 'low'].forEach(priority => {
        if (!query || priority.toLowerCase().includes(query.toLowerCase())) {
          items.push({
            id: `filter-priority-${priority}`,
            title: `Filter by ${priority} priority`,
            subtitle: 'Filter tasks by priority',
            icon: <LucideFlag className="w-4 h-4" />,
            type: 'filter',
            action: () => {
              onPriorityFilter?.(priority);
              onClose();
            },
            keywords: ['filter', 'priority', priority.toLowerCase()]
          });
        }
      });

      // Tag filters
      tags.forEach(tag => {
        if (!query || tag.toLowerCase().includes(query.toLowerCase())) {
          items.push({
            id: `filter-tag-${tag}`,
            title: `Filter by ${tag}`,
            subtitle: 'Filter tasks by tag',
            icon: <LucideTag className="w-4 h-4" />,
            type: 'filter',
            action: () => {
              onTagFilter?.(tag);
              onClose();
            },
            keywords: ['filter', 'tag', tag.toLowerCase()]
          });
        }
      });
    }

    // Task search
    tasks.forEach(task => {
      if (!query || 
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.assigneeName?.toLowerCase().includes(query.toLowerCase()) ||
          task.projectTitle?.toLowerCase().includes(query.toLowerCase()) ||
          task.status?.toLowerCase().includes(query.toLowerCase()) ||
          task.priority?.toLowerCase().includes(query.toLowerCase())) {
        items.push({
          id: `task-${task.id}`,
          title: task.title,
          subtitle: `${task.projectTitle || 'No project'} • ${task.assigneeName || 'Unassigned'} • ${task.status || 'No status'}`,
          icon: <LucideCheckSquare className="w-4 h-4" />,
          type: 'task',
          action: () => {
            onTaskClick?.(task.id);
            onClose();
          },
          keywords: [task.title.toLowerCase(), task.assigneeName?.toLowerCase() || '', task.projectTitle?.toLowerCase() || '', task.status?.toLowerCase() || '', task.priority?.toLowerCase() || '']
        });
      }
    });

    // Project search
    projects.forEach(project => {
      if (!query || project.title.toLowerCase().includes(query.toLowerCase())) {
        items.push({
          id: `project-${project.id}`,
          title: project.title,
          subtitle: `Project • ${project.taskCount || 0} tasks`,
          icon: <LucideBuilding className="w-4 h-4" />,
          type: 'project',
          action: () => {
            onProjectClick?.(project.id);
            onClose();
          },
          keywords: [project.title.toLowerCase(), 'project']
        });
      }
    });

    // Filter items based on query
    if (query) {
      const queryLower = query.toLowerCase();
      return items.filter(item => 
        item.title.toLowerCase().includes(queryLower) ||
        item.subtitle?.toLowerCase().includes(queryLower) ||
        item.keywords.some(keyword => keyword.includes(queryLower))
      );
    }

    return items;
  };

  const commandItems = getCommandItems();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, commandItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (commandItems[selectedIndex]) {
            commandItems[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, commandItems, onClose]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className={`relative w-full max-w-2xl mx-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-2xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <LucideSearch className="w-4 h-4 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, projects, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="ml-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <LucideX className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {commandItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          ) : (
            <div ref={listRef} className="py-2">
              {commandItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                >
                  <div className={`mr-3 p-1 rounded ${
                    item.type === 'view' ? 'text-blue-600 dark:text-blue-400' :
                    item.type === 'filter' ? 'text-green-600 dark:text-green-400' :
                    item.type === 'task' ? 'text-purple-600 dark:text-purple-400' :
                    item.type === 'project' ? 'text-orange-600 dark:text-orange-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    {item.type === 'view' && 'View'}
                    {item.type === 'filter' && 'Filter'}
                    {item.type === 'task' && 'Task'}
                    {item.type === 'project' && 'Project'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <span>Ctrl+K to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
