import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Column, Task } from '../types';

interface TimelineViewProps {
  columns: Column[];
  isDarkMode: boolean;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string, taskTitle: string, columnId: string) => void;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

interface TimelineTask extends Task {
  projectId: string;
  projectName: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  dependencies?: string[];
}

const TimelineView: React.FC<TimelineViewProps> = ({
  columns,
  isDarkMode,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  // Sync local columns with props
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  // Listen for task updates to refresh task information
  useEffect(() => {
    const handleTaskUpdated = (event: CustomEvent) => {
      const updatedTask = event.detail;
      setLocalColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          )
        }))
      );
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      setLocalColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          tasks: column.tasks.filter(task => task.id !== taskId)
        }))
      );
    };

    window.addEventListener('taskUpdated', handleTaskUpdated as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeleted as EventListener);

    return () => {
      window.removeEventListener('taskUpdated', handleTaskUpdated as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeleted as EventListener);
    };
  }, []);

  // Flatten all tasks with timeline information
  const timelineTasks = useMemo(() => {
    const tasks: TimelineTask[] = [];
    
    localColumns.forEach(column => {
      column.tasks.forEach(task => {
        // Use dueDate as endDate, calculate startDate if not provided
        const endDate = task.dueDate;
        const startDate = task.dueDate ? 
          new Date(new Date(task.dueDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0];
        
        tasks.push({
          ...task,
          projectId: column.id,
          projectName: column.title,
          startDate,
          endDate,
          progress: task.status === 'done' ? 100 : 
                   task.status === 'in-progress' ? 50 :
                   task.status === 'review' ? 75 : 0,
        });
      });
    });
    
    return tasks;
  }, [localColumns]);

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: TimelineTask[] } = {};
    
    timelineTasks.forEach(task => {
      if (!groups[task.projectName]) {
        groups[task.projectName] = [];
      }
      groups[task.projectName].push(task);
    });
    
    return groups;
  }, [timelineTasks]);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (timelineTasks.length === 0) {
      const today = new Date();
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      };
    }
    
    const dates = timelineTasks.flatMap(task => [
      task.startDate ? new Date(task.startDate) : new Date(),
      task.endDate ? new Date(task.endDate) : new Date(),
    ]);
    
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add some padding
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    
    return { start, end };
  }, [timelineTasks]);

  // Generate timeline dates based on zoom level
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(timelineBounds.start);
    const end = new Date(timelineBounds.end);
    
    while (current <= end) {
      dates.push(new Date(current));
      
      switch (zoomLevel) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        case 'quarter':
          current.setMonth(current.getMonth() + 3);
          break;
      }
    }
    
    return dates;
  }, [timelineBounds, zoomLevel]);

  // Calculate task position and width
  const getTaskPosition = (task: TimelineTask) => {
    const startDate = new Date(task.startDate || task.createdAt);
    const endDate = new Date(task.endDate || task.dueDate || new Date());
    const timelineStart = timelineBounds.start.getTime();
    const timelineEnd = timelineBounds.end.getTime();
    const timelineWidth = timelineEnd - timelineStart;
    
    const left = ((startDate.getTime() - timelineStart) / timelineWidth) * 100;
    const width = ((endDate.getTime() - startDate.getTime()) / timelineWidth) * 100;
    
    return { left: Math.max(0, left), width: Math.max(1, width) };
  };

  // Get task color based on status
  const getTaskColor = (task: TimelineTask) => {
    switch (task.status) {
      case 'done': return 'bg-emerald-500';
      case 'in-progress': return 'bg-blue-500';
      case 'review': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  // Format date for timeline header
  const formatTimelineDate = (date: Date) => {
    switch (zoomLevel) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'quarter':
        return `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Handle task drag
  const handleTaskDrag = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    const task = timelineTasks.find(t => t.id === taskId);
    if (!task) return;
    
    onTaskUpdate(taskId, {
      dueDate: newEndDate.toISOString().split('T')[0],
    });
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (zoomLevel) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() - 3);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (zoomLevel) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Timeline View
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
                className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                ←
              </button>
              <button
                onClick={goToToday}
                className={`px-3 py-1 rounded text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
              >
                Today
              </button>
              <button
                onClick={goToNext}
                className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                →
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Zoom:
              </label>
              <select
                value={zoomLevel}
                onChange={(e) => setZoomLevel(e.target.value as ZoomLevel)}
                className={`px-3 py-1 rounded-md text-sm border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showDependencies"
                checked={showDependencies}
                onChange={(e) => setShowDependencies(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showDependencies" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Show Dependencies
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="timeline-container flex-1 overflow-x-auto overflow-y-visible" ref={timelineRef}>
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className={`timeline-header sticky top-0 z-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex">
              {/* Project Names Column */}
              <div className={`w-64 p-4 border-r ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Projects & Tasks
                </div>
              </div>
              
              {/* Timeline Dates */}
              <div className="flex-1 flex">
                {timelineDates.map((date, index) => (
                  <div
                    key={index}
                    className={`flex-1 p-2 text-center text-xs border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${
                      date.toDateString() === new Date().toDateString() ? 'bg-blue-100 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatTimelineDate(date)}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {date.getFullYear()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline Body */}
          <div className="relative">
            {Object.entries(groupedTasks).map(([projectName, tasks], projectIndex) => (
              <div key={projectName}>
                {/* Project Header */}
                <div className={`flex border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}>
                  <div className={`w-64 p-4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {projectName}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tasks.length} tasks
                    </div>
                  </div>
                  <div className="flex-1 relative h-16">
                    {/* Project progress bar */}
                    <div className="absolute inset-0 flex items-center">
                      <div className={`w-full h-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div 
                          className="h-full bg-blue-500 rounded"
                          style={{ 
                            width: `${(tasks.filter(t => t.status === 'done').length / tasks.length) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                {tasks.map((task, taskIndex) => {
                  const position = getTaskPosition(task);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  
                  return (
                    <div
                      key={`${task.id}-${(task as any)._clientUpdatedAt || task.updatedAt || task.createdAt}`}
                      className={`flex border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                    >
                      {/* Task Name */}
                      <div className={`w-64 p-4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getTaskColor(task)}`} />
                          <div
                            className={`cursor-pointer hover:underline ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            onClick={() => onTaskClick(task.id)}
                          >
                            {task.title}
                          </div>
                        </div>
                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.assigneeName || 'Unassigned'}
                        </div>
                      </div>
                      
                      {/* Task Bar */}
                      <div className="flex-1 relative h-12">
                        <div
                          className={`timeline-task-bar absolute top-2 h-8 rounded cursor-pointer ${getTaskColor(task)} hover:opacity-80 transition-opacity ${
                            isOverdue ? 'ring-2 ring-red-500' : ''
                          }`}
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                          }}
                          onClick={() => onTaskClick(task.id)}
                          title={`${task.title} - ${task.startDate} to ${task.endDate}`}
                        >
                          {/* Progress fill */}
                          <div
                            className={`h-full rounded ${isDarkMode ? 'bg-gray-300' : 'bg-white'} opacity-30`}
                            style={{ width: `${100 - (task.progress || 0)}%` }}
                          />
                          
                          {/* Task label */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white truncate px-2">
                              {task.title}
                            </span>
                          </div>
                        </div>
                        
                        {/* Dependencies */}
                        {showDependencies && task.dependencies && task.dependencies.length > 0 && (
                          <div className="absolute top-0 left-0 w-full h-full">
                            {task.dependencies.map((depId, depIndex) => {
                              const depTask = timelineTasks.find(t => t.id === depId);
                              if (!depTask) return null;
                              
                              const depPosition = getTaskPosition(depTask);
                              const startX = depPosition.left + depPosition.width;
                              const endX = position.left;
                              
                              return (
                                <svg
                                  key={depIndex}
                                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                  style={{ zIndex: 1 }}
                                >
                                  <defs>
                                    <marker
                                      id={`arrowhead-${task.id}-${depIndex}`}
                                      markerWidth="10"
                                      markerHeight="7"
                                      refX="9"
                                      refY="3.5"
                                      orient="auto"
                                    >
                                      <polygon
                                        points="0 0, 10 3.5, 0 7"
                                        fill={isDarkMode ? '#6B7280' : '#9CA3AF'}
                                      />
                                    </marker>
                                  </defs>
                                  <line
                                    x1={`${startX}%`}
                                    y1="50%"
                                    x2={`${endX}%`}
                                    y2="50%"
                                    stroke={isDarkMode ? '#6B7280' : '#9CA3AF'}
                                    strokeWidth="2"
                                    markerEnd={`url(#arrowhead-${task.id}-${depIndex})`}
                                  />
                                </svg>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
