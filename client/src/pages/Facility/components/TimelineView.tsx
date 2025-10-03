import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Column, Task } from '../types';
import { RoleGuard, usePermissions } from '../../../components/RoleGuard';

interface TimelineViewProps {
  columns: Column[];
  isDarkMode: boolean;
  facilityId?: string;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string, taskTitle: string, columnId: string) => void;
}

type ZoomLevel = 'day' | 'week' | 'month' | 'quarter';

interface ZoomLevelConfig {
  id: ZoomLevel;
  label: string;
  icon: string;
  description: string;
}

interface TimelineTask extends Task {
  projectId: string;
  projectName: string;
  startDate?: string;
  endDate?: string;
  progress?: number;
  dependencies?: string[];
  isMilestone?: boolean;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  columns,
  isDarkMode,
  facilityId,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const { hasPermission } = usePermissions(facilityId);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(true);
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [showMilestones, setShowMilestones] = useState(true);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [colorBy, setColorBy] = useState<'status' | 'project' | 'priority'>('status');
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [localColumns, setLocalColumns] = useState<Column[]>(columns);

  // Zoom level configurations
  const zoomLevels: ZoomLevelConfig[] = [
    { id: 'day', label: 'Day', icon: '🕐', description: 'Hourly view for detailed execution' },
    { id: 'week', label: 'Week', icon: '📅', description: 'Daily view for sprint planning' },
    { id: 'month', label: 'Month', icon: '🗓️', description: 'Weekly view for resource planning' },
    { id: 'quarter', label: 'Quarter', icon: '📊', description: 'Monthly view for strategic overview' }
  ];

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

  const timelineTasks = useMemo(() => {
    const tasks: TimelineTask[] = [];
    
    localColumns.forEach(column => {
      column.tasks.forEach((task, index) => {
        let startDate = (task as any).startDate; 
        let endDate = task.dueDate;
        
        if (!startDate) {
          // Use createdAt as start date if available
          if (task.createdAt) {
            const createdAtDate = new Date(task.createdAt);
            if (!isNaN(createdAtDate.getTime())) {
              startDate = createdAtDate.toISOString().split('T')[0];
            } else {
              // Invalid createdAt, fallback to today
              const today = new Date();
              startDate = today.toISOString().split('T')[0];
            }
          } else if (endDate) {
            // If no createdAt, calculate from end date
            const dueDateObj = new Date(endDate);
            if (!isNaN(dueDateObj.getTime())) {
              const startDateObj = new Date(dueDateObj.getTime() - 3 * 24 * 60 * 60 * 1000);
              startDate = startDateObj.toISOString().split('T')[0];
            } else {
              // Invalid endDate, fallback to today
              const today = new Date();
              startDate = today.toISOString().split('T')[0];
            }
          } else {
            // Fallback to today
            const today = new Date();
            startDate = today.toISOString().split('T')[0];
            const endDateObj = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
            endDate = endDateObj.toISOString().split('T')[0];
          }
        }
        
        // If no end date, use start date + 3 days
        if (!endDate) {
          const startDateObj = new Date(startDate);
          if (!isNaN(startDateObj.getTime())) {
            const endDateObj = new Date(startDateObj.getTime() + 3 * 24 * 60 * 60 * 1000);
            endDate = endDateObj.toISOString().split('T')[0];
          } else {
            // Invalid startDate, use today + 3 days
            const today = new Date();
            const endDateObj = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
            endDate = endDateObj.toISOString().split('T')[0];
          }
        }
        
        // Create mock dependencies for demonstration
        const mockDependencies: string[] = [];
        
        // Create specific dependencies based on task names
        if (task.title.toLowerCase().includes('scope')) {
          // Scope depends on Environment Variables
          const envVarTask = column.tasks.find(t => t.title.toLowerCase().includes('environment'));
          if (envVarTask) {
            mockDependencies.push(envVarTask.id);
          }
        } else if (task.title.toLowerCase().includes('user')) {
          // User depends on Scope
          const scopeTask = column.tasks.find(t => t.title.toLowerCase().includes('scope'));
          if (scopeTask) {
            mockDependencies.push(scopeTask.id);
          }
        } else if (index > 0 && index % 3 === 0) {
          // Every 3rd task depends on the previous one (fallback)
          const previousTask = column.tasks[index - 1];
          if (previousTask) {
            mockDependencies.push(previousTask.id);
          }
        }
        
        // Determine if task is a milestone (short duration, high priority, or specific keywords)
        const isMilestone = task.title.toLowerCase().includes('milestone') || 
                           task.title.toLowerCase().includes('release') ||
                           task.title.toLowerCase().includes('launch') ||
                           task.priority === 'urgent' ||
                           (startDate && endDate && new Date(endDate).getTime() - new Date(startDate).getTime() <= 24 * 60 * 60 * 1000); // 1 day or less
        
        tasks.push({
          ...task,
          projectId: column.id,
          projectName: column.title,
          startDate,
          endDate,
          progress: task.status === 'done' ? 100 : 
                   task.status === 'in-progress' ? 50 :
                   task.status === 'review' ? 75 : 0,
          dependencies: mockDependencies,
          isMilestone,
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

  // Generate timeline dates for Gantt chart (infinite horizontal scrolling)
  const timelineDates = useMemo(() => {
    const dates: Date[] = [];
    
    // Generate 90 days (3 months) for infinite scrolling effect
    const start = new Date(currentDate);
    start.setDate(start.getDate() - 30); // Start 30 days ago
    
    const end = new Date(currentDate);
    end.setDate(end.getDate() + 60); // End 60 days from now
    
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
          current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [currentDate]);

  // Calculate task position and width
  const getTaskPosition = (task: TimelineTask) => {
    // Use the calculated startDate from timelineTasks, or fallback to createdAt
    const startDate = new Date(task.startDate || task.createdAt || new Date());
    const endDate = new Date(task.endDate || task.dueDate || new Date());
    
    // Find the column indices for start and end dates
    const startIndex = timelineDates.findIndex(date => 
      date.toDateString() === startDate.toDateString()
    );
    const endIndex = timelineDates.findIndex(date => 
      date.toDateString() === endDate.toDateString()
    );
    
    // If dates not found in timeline, use fallback positioning
    if (startIndex === -1 || endIndex === -1) {
      // Calculate approximate position based on timeline range
    const timelineStart = timelineDates[0]?.getTime() || startDate.getTime();
    const timelineEnd = timelineDates[timelineDates.length - 1]?.getTime() || endDate.getTime();
    const timelineWidth = timelineEnd - timelineStart;
    
    if (timelineWidth === 0) {
        return { left: 0, width: 96 }; // Default to one column width
      }
      
      const leftPercent = ((startDate.getTime() - timelineStart) / timelineWidth) * 100;
      const widthPercent = ((endDate.getTime() - startDate.getTime()) / timelineWidth) * 100;
      
      return { 
        left: Math.max(0, Math.min(leftPercent, 100)), 
        width: Math.max(1, Math.min(widthPercent, 100 - Math.max(0, Math.min(leftPercent, 100)))) 
      };
    }
    
    // Calculate pixel-based positioning
    const columnWidth = 96; // w-24 = 96px
    const left = startIndex * columnWidth;
    const width = Math.max(columnWidth, (endIndex - startIndex + 1) * columnWidth);
    
    return { left, width };
  };

  // Get task color based on colorBy setting
  const getTaskColor = (task: TimelineTask) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
    const isAtRisk = task.dueDate && new Date(task.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) && task.status !== 'done';
    
    // Override colors for overdue/at-risk tasks regardless of colorBy setting
    if (isOverdue) return 'bg-red-500';
    if (isAtRisk) return 'bg-orange-500';
    
    switch (colorBy) {
      case 'status':
        switch (task.status) {
          case 'done': return 'bg-emerald-500';
          case 'in-progress': return 'bg-blue-500';
          case 'review': return 'bg-amber-500';
          case 'todo': return 'bg-gray-500';
          default: return 'bg-gray-400';
        }
      case 'project':
        // Generate consistent color based on project name
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
        const index = task.projectName.charCodeAt(0) % colors.length;
        return colors[index];
      case 'priority':
        switch (task.priority) {
          case 'urgent': return 'bg-red-500';
          case 'high': return 'bg-orange-500';
          case 'medium': return 'bg-yellow-500';
          case 'low': return 'bg-green-500';
          default: return 'bg-gray-500';
        }
      default:
        return 'bg-blue-500';
    }
  };

  // Get task status indicator (professional icons)
  const getTaskStatusIndicator = (task: TimelineTask) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
    const isAtRisk = task.dueDate && new Date(task.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) && task.status !== 'done';
    
    if (isOverdue) {
      return (
        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    if (isAtRisk) {
      return (
        <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    switch (task.status) {
      case 'done':
        return (
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'review':
        return (
          <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        );
      case 'todo':
        return (
          <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Format date for timeline header with enhanced enterprise display
  const formatTimelineDate = (date: Date) => {
    switch (zoomLevel) {
      case 'day':
        // Show hours for day view (8 AM - 8 PM)
        const hour = date.getHours();
        if (hour >= 8 && hour <= 20) {
          return `${hour}:00`;
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'week':
        // Show individual days in week view for better granularity
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'quarter':
        return `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get today line position (pixel-based)
  const getTodayLinePosition = () => {
    const today = new Date(); // Always use actual today for the today line
    const todayIndex = timelineDates.findIndex(date => 
      date.toDateString() === today.toDateString()
    );
    
    if (todayIndex === -1) {
      // Fallback to percentage-based calculation
      const timelineStart = timelineDates[0]?.getTime() || today.getTime();
      const timelineEnd = timelineDates[timelineDates.length - 1]?.getTime() || today.getTime();
      const timelineWidth = timelineEnd - timelineStart;
      
      if (timelineWidth === 0) return 0;
      
      const position = ((today.getTime() - timelineStart) / timelineWidth) * 100;
      return Math.max(0, Math.min(position, 100));
    }
    
    // Return pixel position
    const columnWidth = 96; // w-24 = 96px
    return todayIndex * columnWidth + columnWidth / 2; // Center of the column
  };

  // Handle task drag
  const handleTaskDrag = (taskId: string, newStartDate: Date, newEndDate: Date) => {
    const task = timelineTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Validate the newEndDate before using it
    if (!isNaN(newEndDate.getTime())) {
      onTaskUpdate(taskId, {
        dueDate: newEndDate.toISOString().split('T')[0],
      });
    } else {
      console.warn('Invalid end date provided to handleTaskDrag:', newEndDate);
    }
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
    
    // Scroll to today's position in the timeline
    setTimeout(() => {
      const today = new Date();
      const todayIndex = timelineDates.findIndex(date => 
        date.toDateString() === today.toDateString()
      );
      
      if (todayIndex !== -1 && timelineContainerRef.current) {
        const columnWidth = 96; // w-24 = 96px
        const todayPosition = todayIndex * columnWidth;
        const container = timelineContainerRef.current;
        container.scrollLeft = todayPosition - container.clientWidth / 2;
      }
    }, 100);
  };

  // Toggle project collapse
  const toggleProjectCollapse = (projectName: string) => {
    setCollapsedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectName)) {
        newSet.delete(projectName);
      } else {
        newSet.add(projectName);
      }
      return newSet;
    });
  };

  // Scroll synchronization functions
  const handleSidebarScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timelineContainerRef.current && e.currentTarget.scrollTop !== timelineContainerRef.current.scrollTop) {
      timelineContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (sidebarRef.current && e.currentTarget.scrollTop !== sidebarRef.current.scrollTop) {
      sidebarRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Mouse wheel scroll handling
  const handleMouseWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    // Check if Shift key is held for horizontal scrolling
    if (e.shiftKey) {
      // Horizontal scrolling (timeline navigation)
      const deltaX = e.deltaY; // Use deltaY for horizontal when shift is held
      const scrollAmount = Math.abs(deltaX) > 100 ? 200 : 100; // Adjust horizontal scroll sensitivity
      
      if (timelineContainerRef.current) {
        if (deltaX > 0) {
          // Scroll right (next dates)
          timelineContainerRef.current.scrollLeft += scrollAmount;
        } else {
          // Scroll left (previous dates)
          timelineContainerRef.current.scrollLeft -= scrollAmount;
        }
      }
    } else {
      // Vertical scrolling (task list)
      const deltaY = e.deltaY;
      const scrollAmount = Math.abs(deltaY) > 100 ? 50 : 20; // Adjust scroll sensitivity
      
      if (deltaY > 0) {
        // Scroll down
        if (timelineContainerRef.current) {
          timelineContainerRef.current.scrollTop += scrollAmount;
        }
        if (sidebarRef.current) {
          sidebarRef.current.scrollTop += scrollAmount;
        }
      } else {
        // Scroll up
        if (timelineContainerRef.current) {
          timelineContainerRef.current.scrollTop -= scrollAmount;
        }
        if (sidebarRef.current) {
          sidebarRef.current.scrollTop -= scrollAmount;
        }
      }
    }
  };

  // Mouse wheel event listener with proper passive: false option
  useEffect(() => {
    const timelineContainer = timelineContainerRef.current;
    if (timelineContainer) {
      timelineContainer.addEventListener('wheel', handleMouseWheel, { passive: false });
      return () => {
        timelineContainer.removeEventListener('wheel', handleMouseWheel);
      };
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when timeline is focused or no input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case ' ':
          event.preventDefault();
          goToToday();
          break;
        case '+':
        case '=':
          event.preventDefault();
          const currentIndex = zoomLevels.findIndex(z => z.id === zoomLevel);
          if (currentIndex < zoomLevels.length - 1) {
            setZoomLevel(zoomLevels[currentIndex + 1].id);
          }
          break;
        case '-':
          event.preventDefault();
          const currentIndexMinus = zoomLevels.findIndex(z => z.id === zoomLevel);
          if (currentIndexMinus > 0) {
            setZoomLevel(zoomLevels[currentIndexMinus - 1].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel]);

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Gantt Chart Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-2">
              <button
                onClick={goToPrevious}
              className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
              className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 rounded text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              Today
            </button>
            </div>
          
          {/* Center - Month/Year */}
          <div className="text-center">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          
          {/* Right side - Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <label className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Color:
              </label>
              <select
                value={colorBy}
                onChange={(e) => setColorBy(e.target.value as any)}
                className={`px-2 py-1 rounded text-xs border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="status">Status</option>
                <option value="project">Project</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            <div className="flex items-center space-x-1">
              <input
                type="checkbox"
                id="showDependencies"
                checked={showDependencies}
                onChange={(e) => setShowDependencies(e.target.checked)}
                className="w-3 h-3 rounded text-blue-600"
              />
              <label htmlFor="showDependencies" className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Dependencies
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Sidebar - Tasks */}
          <div 
            ref={sidebarRef}
            className={`w-64 border-r ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} overflow-y-auto flex-shrink-0`} 
            style={{ maxHeight: 'calc(100vh - 200px)', height: 'calc(100vh - 200px)' }}
            onScroll={handleSidebarScroll}
          >
            <div className="p-3">
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Tasks
              </h3>
              
              {/* Collapsible Task Groups */}
              {Object.entries(groupedTasks).map(([projectName, tasks], projectIndex) => (
                <div key={projectName} className="mb-2">
                  {/* Project Group Header */}
                  <div 
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    onClick={() => toggleProjectCollapse(projectName)}
                  >
                    <div className="flex items-center space-x-2">
                      <svg 
                        className={`w-4 h-4 transition-transform ${collapsedProjects.has(projectName) ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium">{projectName}</span>
                    </div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {tasks.length}
                    </span>
                  </div>
                  
                  {/* Project Tasks */}
                  {!collapsedProjects.has(projectName) && (
                    <div className="ml-4 space-y-1">
                      {tasks.map((task) => (
                        <RoleGuard key={task.id} requiredPermission="tasks.view_all" facilityId={facilityId} fallback={
                          <div
                            className={`flex items-center space-x-2 p-2 rounded opacity-75 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}
                            title="No permission to view task details"
                          >
                            <div className={`w-3 h-3 rounded-full ${getTaskColor(task)}`} />
                            <span className="text-sm truncate">{task.title}</span>
                          </div>
                        }>
                          <div
                            className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}
                            onClick={() => onTaskClick(task.id)}
                          >
                            <div className={`w-3 h-3 rounded-full ${getTaskColor(task)}`} />
                            <span className="text-sm truncate">{task.title}</span>
                          </div>
                        </RoleGuard>
                      ))}
                    </div>
                  )}
                </div>
              ))}
                  </div>
                </div>
                
          {/* Right Side - Timeline */}
          <div 
            className="flex-1 overflow-auto timeline-container" 
            ref={timelineContainerRef} 
            style={{ maxHeight: 'calc(100vh - 200px)', height: 'calc(100vh - 200px)' }}
            onScroll={handleTimelineScroll}
          >
            <div className="min-w-max">
              {/* Timeline Header */}
              <div className={`sticky top-0 z-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex">
                  {timelineDates.map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                    <div
                      key={index}
                        className={`w-24 p-2 text-center text-xs border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} relative ${
                          isToday ? 'bg-green-500 text-white' : isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                        style={{ minWidth: '96px', maxWidth: '96px' }}
                      >
                        {isToday && (
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                        <div className={`font-medium ${isToday ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {date.getDate()}
                        </div>
                        <div className={`text-xs ${isToday ? 'text-green-100' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                        {isToday && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-green-500"></div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Timeline Body */}
            <div className="relative min-h-full">
            {Object.entries(groupedTasks).map(([projectName, tasks], projectIndex) => (
              <div key={projectName}>
                {/* Project Header Row - Always show */}
                <div className={`h-10 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} relative`}>
                  <div className="flex h-full">
                    {timelineDates.map((date, index) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      return (
                        <div
                          key={index}
                          className={`w-24 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} relative ${
                            isToday ? 'bg-green-50 dark:bg-green-900/20' : ''
                          }`}
                          style={{ minWidth: '96px', maxWidth: '96px' }}
                        >
                          {isToday && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Project summary bar */}
                  <div className="absolute top-1 left-0 h-8 bg-blue-100 dark:bg-blue-900/30 rounded mx-1 flex items-center justify-center" 
                       style={{ width: `${timelineDates.length * 96}px` }}>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {projectName} • {tasks.length} tasks • {tasks.filter(t => t.status === 'done').length} completed
                    </span>
                  </div>
                </div>

                {/* Task Rows - Only show when expanded */}
                {!collapsedProjects.has(projectName) && tasks.map((task, taskIndex) => {
                  const position = getTaskPosition(task);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  
                  return (
                    <div
                      key={`${task.id}-${(task as any)._clientUpdatedAt || task.updatedAt || task.createdAt}`}
                      className={`h-10 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} relative`}
                    >
                      <div className="flex h-full">
                        {timelineDates.map((date, index) => {
                          const isToday = date.toDateString() === new Date().toDateString();
                          return (
                            <div
                              key={index}
                              className={`w-24 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} relative ${
                                isToday ? 'bg-green-50 dark:bg-green-900/20' : ''
                              }`}
                              style={{ minWidth: '96px', maxWidth: '96px' }}
                            >
                              {isToday && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Task Bar */}
                      <RoleGuard requiredPermission="tasks.view_all" facilityId={facilityId} fallback={
                        <div
                          className={`absolute top-1 h-8 rounded opacity-75 ${getTaskColor(task)} transition-all duration-200 shadow-sm ${
                            isOverdue ? 'ring-2 ring-red-500' : ''
                          }`}
                          style={{
                            left: `${position.left}px`,
                            width: `${position.width}px`,
                          }}
                          title="No permission to view task details"
                        >
                          <div className="absolute inset-0 flex items-center justify-center px-2">
                            <span className="text-xs font-medium text-white truncate">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      }>
                        <div
                          className={`absolute top-1 h-8 rounded cursor-pointer ${getTaskColor(task)} hover:opacity-90 transition-all duration-200 shadow-sm ${
                            isOverdue ? 'ring-2 ring-red-500' : ''
                          }`}
                          style={{
                            left: `${position.left}px`,
                            width: `${position.width}px`,
                          }}
                          onClick={() => onTaskClick(task.id)}
                          title={`${task.title} - ${task.startDate ? new Date(task.startDate).toLocaleDateString() : 'No start date'} to ${task.endDate ? new Date(task.endDate).toLocaleDateString() : 'No end date'}`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center px-2">
                            <span className="text-xs font-medium text-white truncate">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      </RoleGuard>
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
