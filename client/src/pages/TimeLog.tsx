import React, { useState, useEffect } from 'react';
import {
  LucideClock,
  LucidePlay,
  LucidePause,
  LucideSquare,
} from 'lucide-react';

const timeEntries = [
  {
    id: 1,
    task: 'Frontend Development',
    project: 'Nelsa Web App',
    startTime: '09:00 AM',
    endTime: '11:30 AM',
    duration: '2h 30m',
    status: 'Completed',
  },
  {
    id: 2,
    task: 'Backend API',
    project: 'Datascale AI',
    startTime: '01:00 PM',
    endTime: '03:45 PM',
    duration: '2h 45m',
    status: 'Completed',
  },
  {
    id: 3,
    task: 'UI Design',
    project: 'Media Channel',
    startTime: '04:00 PM',
    endTime: null,
    duration: '1h 15m',
    status: 'Running',
  },
];

const statusColors: Record<string, string> = {
  Completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const TimeLog: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 space-y-4 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Current Time Display */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {currentTime.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button className="flex items-center justify-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-3 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs">
          <LucidePlay className="w-4 h-4" />
          <span>Start New Task</span>
        </button>
        <button className="flex items-center justify-center space-x-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors text-xs">
          <LucidePause className="w-4 h-4" />
          <span>Pause Current</span>
        </button>
        <button className="flex items-center justify-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-3 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs">
          <LucideSquare className="w-4 h-4" />
          <span>Stop Timer</span>
        </button>
      </div>

      {/* Time Entries */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Today's Time Entries</h3>

        <div className="space-y-3">
          {timeEntries.map(({ id, task, project, startTime, endTime, duration, status }) => (
            <div key={id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{task}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{project}</p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Start: {startTime}</span>
                  {endTime && <span>End: {endTime}</span>}
                  <span>Duration: {duration}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                  {status}
                </span>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <LucideClock className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">6h 30m</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">3</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Tasks Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">1</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active Tasks</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeLog;
