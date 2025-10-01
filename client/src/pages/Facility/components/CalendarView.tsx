import React, { useState, useMemo } from 'react';
import { Column, Task } from '../types';

interface CalendarViewProps {
  columns: Column[];
  isDarkMode: boolean;
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
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [colorBy, setColorBy] = useState<'status' | 'project' | 'priority'>('status');

  // Flatten all tasks with project information
  const allTasks = useMemo(() => {
    const tasks: CalendarTask[] = [];
    columns.forEach(column => {
      column.tasks.forEach(task => {
        tasks.push({
          ...task,
          projectId: column.id,
          projectName: column.title,
        });
      });
    });
    return tasks;
  }, [columns]);

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
      <div className="calendar-grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
        {/* Header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className={`p-2 text-center text-sm font-medium ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const tasks = getTasksForDate(day);
          
          return (
            <div
              key={index}
              className={`min-h-24 p-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} ${
                !isCurrentMonth ? (isDarkMode ? 'text-gray-600' : 'text-gray-400') : ''
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {tasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    className={`calendar-task text-xs p-1 rounded cursor-pointer text-white truncate ${getTaskColor(task)} hover:opacity-80`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {tasks.length > 3 && (
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    +{tasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const days = getWeekDays();
    const tasks = getTasksForDateRange(days[0], days[6]);

    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {/* Header */}
          {days.map((day, index) => (
            <div key={index} className={`p-2 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayTasks = getTasksForDate(day);
            
            return (
              <div
                key={index}
                className={`min-h-96 p-2 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task.id)}
                      className={`p-2 rounded cursor-pointer text-white text-sm ${getTaskColor(task)} hover:opacity-80`}
                    >
                      <div className="font-medium truncate">{task.title}</div>
                      <div className="text-xs opacity-90">{task.projectName}</div>
                    </div>
                  ))}
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
      <div className="flex-1 p-4">
        <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {isToday && <span className="ml-2 text-blue-600 dark:text-blue-400">(Today)</span>}
          </h2>
        </div>
        
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No tasks due on this day
            </div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                className={`p-4 rounded-lg cursor-pointer text-white ${getTaskColor(task)} hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="text-sm opacity-90">{task.projectName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">
                      {task.status === 'todo' ? 'To Do' : 
                       task.status === 'in-progress' ? 'In Progress' :
                       task.status === 'review' ? 'Review' : 'Done'}
                    </div>
                    {task.priority && (
                      <div className="text-xs opacity-75 capitalize">{task.priority}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatDate(currentDate)}
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
                Color by:
              </label>
              <select
                value={colorBy}
                onChange={(e) => setColorBy(e.target.value as any)}
                className={`px-3 py-1 rounded-md text-sm border ${
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
              {(['month', 'week', 'day'] as CalendarView[]).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-3 py-1 rounded text-sm capitalize ${
                    view === viewType
                      ? isDarkMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-200'
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
      <div className="flex-1">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default CalendarView;
