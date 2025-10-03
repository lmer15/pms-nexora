import React, { useState, useMemo, useEffect } from 'react';
import { Column, Task } from '../types';
import { RoleGuard, usePermissions } from '../../../components/RoleGuard';

interface CalendarViewProps {
  columns: Column[];
  isDarkMode: boolean;
  facilityId?: string;
  onTaskClick: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string, taskTitle: string, columnId: string) => void;
}

type CalendarView = 'month' | 'week' | 'day';

interface CalendarTask extends Task {
  projectId: string;
  projectName: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  columns,
  isDarkMode,
  facilityId,
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const { hasPermission } = usePermissions(facilityId);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [colorBy, setColorBy] = useState<'status' | 'project' | 'priority'>('status');
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

  // Flatten all tasks with project information
  const allTasks = useMemo(() => {
    const tasks: CalendarTask[] = [];
    localColumns.forEach(column => {
      column.tasks.forEach(task => {
        tasks.push({
          ...task,
          projectId: column.id,
          projectName: column.title,
        });
      });
    });
    return tasks;
  }, [localColumns]);

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Get tasks for a date range
  const getTasksForDateRange = (startDate: Date, endDate: Date) => {
    return allTasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate <= endDate;
    });
  };

  // Get color for task based on colorBy setting
  const getTaskColor = (task: CalendarTask) => {
    switch (colorBy) {
      case 'status':
        switch (task.status) {
          case 'done': return 'bg-emerald-500';
          case 'in-progress': return 'bg-blue-500';
          case 'review': return 'bg-amber-500';
          default: return 'bg-gray-500';
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

  // Generate calendar days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Generate week days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date for display
  const formatDate = (date: Date) => {
    switch (view) {
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week':
        const startOfWeek = getWeekDays()[0];
        const endOfWeek = getWeekDays()[6];
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'day':
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // Render month view
  const renderMonthView = () => {
    const days = getMonthDays();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    return (
      <div className="bg-white dark:bg-gray-900 w-full">
        {/* Day Headers - matching the picture */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
            <div key={day} className={`p-3 text-center text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid - Fixed height cells */}
        <div className="grid grid-cols-7 w-full">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const tasks = getTasksForDate(day);
            
            return (
              <div
                key={index}
                className={`h-24 p-2 border-r border-b border-gray-200 dark:border-gray-700 relative group hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                } ${!isCurrentMonth ? (isDarkMode ? 'text-gray-600' : 'text-gray-400') : ''} ${
                  isToday ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 ring-2 ring-green-200 dark:ring-green-700' : ''
                }`}
              >
                {/* Date number with enhanced styling */}
                <div className={`text-sm font-medium mb-1 ${
                  isToday 
                    ? 'text-green-600 dark:text-green-400' 
                    : isCurrentMonth 
                    ? (isDarkMode ? 'text-white' : 'text-gray-900')
                    : (isDarkMode ? 'text-gray-600' : 'text-gray-400')
                }`}>
                  {isToday ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full text-xs font-bold shadow-lg ring-2 ring-green-200 dark:ring-green-700">
                      {day.getDate()}
                    </span>
                  ) : (
                    <span className="group-hover:scale-110 transition-transform duration-200">
                      {day.getDate()}
                    </span>
                  )}
                </div>
                
                {/* Tasks - Fixed positioning with scroll and better visual */}
                <div className="absolute top-8 left-1 right-1 bottom-1 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {tasks.length > 0 ? (
                    tasks.map(task => (
                      <RoleGuard 
                        key={`${task.id}-${(task as any)._clientUpdatedAt || task.updatedAt || task.createdAt}`}
                        facilityId={facilityId}
                        requiredPermission="tasks.view_all" 
                        fallback={
                          <div
                            className={`text-xs p-1.5 rounded-lg text-white shadow-lg ${getTaskColor(task)} backdrop-blur-sm opacity-75`}
                            title="No permission to view task details"
                          >
                            <div className="flex items-center space-x-1 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm flex-shrink-0"></div>
                              <span className="truncate min-w-0 font-medium">{task.title}</span>
                            </div>
                          </div>
                        }
                      >
                        <div
                          onClick={() => onTaskClick(task.id)}
                          className={`text-xs p-1.5 rounded-lg cursor-pointer text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 ${getTaskColor(task)} hover:opacity-90 backdrop-blur-sm`}
                          title={task.title}
                        >
                          <div className="flex items-center space-x-1 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm flex-shrink-0"></div>
                            <span className="truncate min-w-0 font-medium">{task.title}</span>
                          </div>
                        </div>
                      </RoleGuard>
                    ))
                  ) : (
                    <div className={`text-xs text-center py-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const days = getWeekDays();
    const tasks = getTasksForDateRange(days[0], days[6]);

    return (
      <div className="bg-white dark:bg-gray-900 w-full">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {days.map((day, index) => (
            <div key={index} className={`p-3 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
              </div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week Grid - Fixed height */}
        <div className="grid grid-cols-7 w-full">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayTasks = getTasksForDate(day);
            
            return (
              <div
                key={index}
                className={`h-96 p-3 border-r border-b border-gray-200 dark:border-gray-700 group hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-900' : 'bg-white'
                } ${isToday ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 ring-2 ring-green-200 dark:ring-green-700' : ''}`}
              >
                <div className="space-y-2 overflow-y-auto overflow-x-hidden h-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {dayTasks.length > 0 ? (
                    dayTasks.map(task => (
                      <RoleGuard key={`${task.id}-${(task as any)._clientUpdatedAt || task.updatedAt || task.createdAt}`} requiredPermission="tasks.view_all" facilityId={facilityId} fallback={
                        <div
                          className={`p-3 rounded-xl text-white text-sm shadow-lg ${getTaskColor(task)} backdrop-blur-sm border border-white/20 opacity-75`}
                          title="No permission to view task details"
                        >
                          <div className="flex items-start space-x-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-white/50 mt-1.5 flex-shrink-0 shadow-sm"></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{task.title}</div>
                              <div className="text-xs opacity-90 truncate mt-0.5">{task.projectName}</div>
                            </div>
                          </div>
                        </div>
                      }>
                        <div
                          onClick={() => onTaskClick(task.id)}
                          className={`p-3 rounded-xl cursor-pointer text-white text-sm shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${getTaskColor(task)} hover:opacity-90 backdrop-blur-sm border border-white/20`}
                        >
                          <div className="flex items-start space-x-2 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-white/50 mt-1.5 flex-shrink-0 shadow-sm"></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">{task.title}</div>
                              <div className="text-xs opacity-90 truncate mt-0.5">{task.projectName}</div>
                            </div>
                          </div>
                        </div>
                      </RoleGuard>
                    ))
                  ) : (
                    <div className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const tasks = getTasksForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
      <div className="p-4 w-full">
        <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {isToday && <span className="ml-2 text-blue-600 dark:text-blue-400">(Today)</span>}
          </h2>
        </div>
        
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-lg font-medium">No tasks due on this day</p>
              <p className="text-sm opacity-75">Enjoy your free time!</p>
            </div>
          ) : (
            tasks.map(task => (
              <RoleGuard key={`${task.id}-${task.updatedAt || task.createdAt}`} requiredPermission="tasks.view_all" facilityId={facilityId} fallback={
                <div
                  className={`p-5 rounded-2xl text-white shadow-xl ${getTaskColor(task)} backdrop-blur-sm border border-white/20 opacity-75`}
                  title="No permission to view task details"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-4 h-4 rounded-full bg-white/50 mt-1 flex-shrink-0 shadow-sm"></div>
                      <div>
                        <h3 className="font-bold text-lg">{task.title}</h3>
                        <p className="text-sm opacity-90 mt-1">{task.projectName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold opacity-90 bg-white/20 px-3 py-1 rounded-full">
                        {task.status === 'todo' ? 'To Do' : 
                         task.status === 'in-progress' ? 'In Progress' :
                         task.status === 'review' ? 'Review' : 'Done'}
                      </div>
                      {task.priority && (
                        <div className="text-xs opacity-75 capitalize bg-white/30 px-3 py-1 rounded-full mt-2 font-medium">
                          {task.priority}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              }>
                <div
                  onClick={() => onTaskClick(task.id)}
                  className={`p-5 rounded-2xl cursor-pointer text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${getTaskColor(task)} hover:opacity-90 backdrop-blur-sm border border-white/20`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-4 h-4 rounded-full bg-white/50 mt-1 flex-shrink-0 shadow-sm"></div>
                      <div>
                        <h3 className="font-bold text-lg">{task.title}</h3>
                        <p className="text-sm opacity-90 mt-1">{task.projectName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold opacity-90 bg-white/20 px-3 py-1 rounded-full">
                        {task.status === 'todo' ? 'To Do' : 
                         task.status === 'in-progress' ? 'In Progress' :
                         task.status === 'review' ? 'Review' : 'Done'}
                      </div>
                      {task.priority && (
                        <div className="text-xs opacity-75 capitalize bg-white/30 px-3 py-1 rounded-full mt-2 font-medium">
                          {task.priority}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </RoleGuard>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header with rainbow gradient strip */}
      <div className="h-1 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 via-purple-500 to-pink-500"></div>
      
      {/* Header */}
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
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatDate(currentDate)}
            </h2>
          </div>
          
          {/* Right side - View toggles and color selector */}
          <div className="flex items-center space-x-2">
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
            
            {/* View toggles - matching the picture's segmented control */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded p-0.5">
              {(['month', 'week', 'day'] as CalendarView[]).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-all ${
                    view === viewType
                      ? 'bg-green-600 text-white shadow-sm'
                      : isDarkMode
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default CalendarView;
