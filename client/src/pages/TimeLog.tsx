import React, { useState, useEffect } from 'react';
import {
  LucideClock,
  LucidePlay,
  LucidePause,
  LucideSquare,
  LucidePlus,
  LucideEdit,
  LucideTrash2,
  LucideRefreshCw,
  LucideTrendingUp,
  LucideTarget,
  LucideCalendar,
  LucideBarChart3,
  LucideTimer,
  LucideActivity,
  LucideZap,
  LucideCheckCircle,
  LucideAlertCircle,
  LucideX,
} from 'lucide-react';
import { timeLogService, TimeLogEntry, TimeLogSummary } from '../api/timeLogService';
import { taskService } from '../api/taskService';
import { projectService } from '../api/projectService';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ConfirmationDialog } from '../components/ui/confirmation-dialog';

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
  const [timeLogs, setTimeLogs] = useState<TimeLogEntry[]>([]);
  const [summary, setSummary] = useState<TimeLogSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningTimeLogs, setRunningTimeLogs] = useState<TimeLogEntry[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [newLogDescription, setNewLogDescription] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualLog, setManualLog] = useState({
    taskId: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [userProfiles, setUserProfiles] = useState<Record<string, { firstName: string; lastName: string; profilePicture?: string }>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ isOpen: boolean; timeLogId: string; taskId: string }>({
    isOpen: false,
    timeLogId: '',
    taskId: ''
  });
  const [isStartingTracking, setIsStartingTracking] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Array<{id: string, title: string, projectName?: string}>>([]);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [productivityScore, setProductivityScore] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(40); // 40 hours per week
  const [allTimeLogs, setAllTimeLogs] = useState<TimeLogEntry[]>([]);

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

  const loadTimeLogs = async () => {
    try {
      setIsLoading(true);
      const [allLogs, summaryData, runningLogs] = await Promise.all([
        timeLogService.getAllTimeLogs(),
        timeLogService.getTimeLogSummary(),
        timeLogService.getRunningTimeLogs(),
      ]);
      setAllTimeLogs(allLogs);
      setSummary(summaryData);
      setRunningTimeLogs(runningLogs);
      
      // Filter logs based on selected time range
      filterTimeLogsByRange(allLogs);
    } catch (error) {
      console.error('Failed to load time logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTimeLogsByRange = (logs: TimeLogEntry[]) => {
    const now = new Date();
    let filteredLogs: TimeLogEntry[] = [];

    switch (selectedTimeRange) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filteredLogs = logs.filter(log => {
          const logDate = new Date(log.startTime);
          return logDate >= today;
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(log => {
          const logDate = new Date(log.startTime);
          return logDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredLogs = logs.filter(log => {
          const logDate = new Date(log.startTime);
          return logDate >= monthAgo;
        });
        break;
      case 'all':
        filteredLogs = logs;
        break;
      default:
        filteredLogs = logs;
    }

    setTimeLogs(filteredLogs);
  };

  // Update filtered logs when time range changes
  useEffect(() => {
    if (allTimeLogs.length > 0) {
      filterTimeLogsByRange(allTimeLogs);
    }
  }, [selectedTimeRange, allTimeLogs]);

  useEffect(() => {
    loadTimeLogs();
    loadAvailableTasks();
  }, []);

  const loadAvailableTasks = async () => {
    try {
      // Get tasks from the current facility or user's tasks
      const tasks = await taskService.getAll();
      setAvailableTasks(tasks.map(task => ({
        id: task.id,
        title: task.title,
        projectName: undefined // Will be populated later if needed
      })));
    } catch (error) {
      console.error('Failed to load available tasks:', error);
    }
  };

  // Fetch user profiles for time log users
  useEffect(() => {
    const fetchUserProfiles = async () => {
      if (timeLogs.length === 0) return;
      
      const userIds = [...new Set(timeLogs.map(log => log.userId))];
      try {
        const profiles = await taskService.fetchUserProfilesByIds(userIds);
        setUserProfiles(profiles);
      } catch (error) {
        console.error('Failed to fetch user profiles:', error);
      }
    };

    fetchUserProfiles();
  }, [timeLogs]);

  const startTimeTracking = async (taskId: string, description?: string) => {
    try {
      setIsStartingTracking(true);
      await timeLogService.startTimeTracking(taskId, description || 'Work session');
      setNewLogDescription('');
      setSelectedTask('');
      setShowTaskSelector(false);
      await loadTimeLogs();
    } catch (error) {
      console.error('Failed to start time tracking:', error);
    } finally {
      setIsStartingTracking(false);
    }
  };

  const stopTimeTracking = async (timeLogId: string, taskId: string) => {
    try {
      await timeLogService.stopTimeTracking(taskId, timeLogId);
      await loadTimeLogs();
    } catch (error) {
      console.error('Failed to stop time tracking:', error);
    }
  };

  const addManualTimeLog = async () => {
    if (!manualLog.taskId || !manualLog.description || !manualLog.startTime || !manualLog.endTime) return;

    try {
      const startTime = new Date(manualLog.startTime);
      const endTime = new Date(manualLog.endTime);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      await timeLogService.createTimeLog({
        taskId: manualLog.taskId,
        description: manualLog.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration
      });

      setManualLog({ taskId: '', description: '', startTime: '', endTime: '' });
      setIsAddingManual(false);
      await loadTimeLogs();
    } catch (error) {
      console.error('Failed to add manual time log:', error);
    }
  };

  const deleteTimeLog = (timeLogId: string, taskId: string) => {
    setShowDeleteConfirm({
      isOpen: true,
      timeLogId,
      taskId
    });
  };

  const confirmDeleteTimeLog = async () => {
    const { timeLogId, taskId } = showDeleteConfirm;
    try {
      await timeLogService.deleteTimeLog(taskId, timeLogId);
      await loadTimeLogs();
    } catch (error) {
      console.error('Failed to delete time log:', error);
    } finally {
      setShowDeleteConfirm({ isOpen: false, timeLogId: '', taskId: '' });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatus = (timeLog: TimeLogEntry) => {
    if (!timeLog.endTime) return 'Running';
    return 'Completed';
  };

  const calculateProductivityScore = () => {
    if (!summary) return 0;
    const todayHours = summary.todayTime / 3600;
    const targetHours = 8; // 8 hours per day
    const score = Math.min((todayHours / targetHours) * 100, 100);
    setProductivityScore(Math.round(score));
  };

  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProductivityIcon = (score: number) => {
    if (score >= 80) return <LucideZap className="w-5 h-5" />;
    if (score >= 60) return <LucideActivity className="w-5 h-5" />;
    return <LucideAlertCircle className="w-5 h-5" />;
  };

  useEffect(() => {
    calculateProductivityScore();
  }, [summary]);

  return (
    <>
      <style>{`
        select {
          direction: ltr !important;
        }
        select option {
          direction: ltr !important;
        }
      `}</style>
      <div className="p-4 space-y-4 bg-neutral-light dark:bg-gray-900 min-h-full">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand/10">
            <LucideClock className="w-4 h-4 text-brand" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Today's Time</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {summary ? timeLogService.formatDuration(summary.todayTime) : '0m'}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand-light/10">
            <LucideTarget className="w-4 h-4 text-brand-light" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sessions Today</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {summary ? summary.todayEntries : 0}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-brand-dark/10">
            <LucideActivity className="w-4 h-4 text-brand-dark" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Active Sessions</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{runningTimeLogs.length}</p>
          </div>
        </div>

        <div className={`p-4 rounded-lg shadow-sm flex items-center space-x-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-2 rounded-full bg-green-100">
            <LucideTrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Productivity</p>
            <p className={`text-lg font-bold ${getProductivityColor(productivityScore)}`}>
              {productivityScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Minimal Left Side */}
      <div className="flex items-center space-x-3 mb-6">
        <Button
          onClick={() => setShowTaskSelector(true)}
          disabled={isStartingTracking}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50"
        >
          <LucidePlay className="w-4 h-4" />
          <span>Start</span>
        </Button>
        <Button
          onClick={() => setIsAddingManual(true)}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-brand-light text-white rounded-lg hover:bg-brand transition-colors"
        >
          <LucidePlus className="w-4 h-4" />
          <span>Manual</span>
        </Button>
        <Button
          onClick={loadTimeLogs}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-brand-dark text-white rounded-lg hover:bg-brand transition-colors disabled:opacity-50"
        >
          <LucideRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Start Time Tracking Modal */}
      {showTaskSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className={`w-full max-w-md mx-4 p-6 rounded-lg shadow-xl relative z-[61] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start Time Tracking</h3>
              <button
                onClick={() => {
                  setShowTaskSelector(false);
                  setSelectedTask('');
                  setNewLogDescription('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <LucideX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Task
                </label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent`}
                >
                  <option value="">
                    {availableTasks.length === 0 
                      ? "No tasks available (must be owner/manager of facility)" 
                      : "Choose a task..."
                    }
                  </option>
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} {task.projectName && `(${task.projectName})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newLogDescription}
                  onChange={(e) => setNewLogDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand focus:border-transparent`}
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={() => startTimeTracking(selectedTask, newLogDescription)}
                  disabled={!selectedTask || isStartingTracking}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingTracking ? 'Starting...' : 'Start Tracking'}
                </Button>
                <Button
                  onClick={() => {
                    setShowTaskSelector(false);
                    setSelectedTask('');
                    setNewLogDescription('');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Time Log Modal */}
      {isAddingManual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className={`w-full max-w-lg mx-4 p-6 rounded-lg shadow-xl relative z-[61] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Manual Time Log</h3>
              <button
                onClick={() => {
                  setIsAddingManual(false);
                  setManualLog({ taskId: '', description: '', startTime: '', endTime: '' });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <LucideX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={manualLog.description}
                  onChange={(e) => setManualLog({ ...manualLog, description: e.target.value })}
                  placeholder="What did you work on?"
                  className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-light focus:border-transparent`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Task
                </label>
                <select
                  value={manualLog.taskId}
                  onChange={(e) => setManualLog({ ...manualLog, taskId: e.target.value })}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-transparent`}
                >
                  <option value="">
                    {availableTasks.length === 0 
                      ? "No tasks available (must be owner/manager of facility)" 
                      : "Choose a task..."
                    }
                  </option>
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} {task.projectName && `(${task.projectName})`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={manualLog.startTime}
                    onChange={(e) => setManualLog({ ...manualLog, startTime: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={manualLog.endTime}
                    onChange={(e) => setManualLog({ ...manualLog, endTime: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-transparent`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={addManualTimeLog}
                  disabled={!manualLog.description || !manualLog.taskId || !manualLog.startTime || !manualLog.endTime}
                  className="flex-1 px-4 py-2 bg-brand-light text-white rounded-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Time Log
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingManual(false);
                    setManualLog({ taskId: '', description: '', startTime: '', endTime: '' });
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Entries */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Time Entries
            {timeLogs.length > 0 && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({timeLogs.length} entries)
              </span>
            )}
          </h3>
          
          {/* Time Range Filter */}
          <div className="flex items-center space-x-2">
            <LucideCalendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as 'today' | 'week' | 'month' | 'all')}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <LucideRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading time logs...</p>
            </div>
          ) : timeLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <LucideClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {selectedTimeRange === 'today' && 'No time logs recorded today.'}
                {selectedTimeRange === 'week' && 'No time logs recorded this week.'}
                {selectedTimeRange === 'month' && 'No time logs recorded this month.'}
                {selectedTimeRange === 'all' && 'No time logs recorded yet.'}
              </p>
            </div>
          ) : (
            timeLogs.map((timeLog) => {
              const status = getStatus(timeLog);
              return (
                <div key={timeLog.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {timeLog.description || 'Time tracking session'}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Task: {timeLog.taskTitle || timeLog.taskId}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Date: {new Date(timeLog.startTime).toLocaleDateString()}</span>
                      <span>Start: {formatTime(timeLog.startTime)}</span>
                      {timeLog.endTime && <span>End: {formatTime(timeLog.endTime)}</span>}
                      <span>Duration: {timeLogService.formatDuration(timeLog.duration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                      {status}
                    </span>
                    {status === 'Running' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => stopTimeTracking(timeLog.id, timeLog.taskId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <LucideSquare className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTimeLog(timeLog.id, timeLog.taskId)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <LucideTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary */}
      <div className={`p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today's Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {summary ? timeLogService.formatDuration(summary.todayTime) : '0m'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Today's Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {summary ? summary.todayEntries : 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Entries Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {runningTimeLogs.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active Tasks</div>
          </div>
        </div>
        {summary && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {timeLogService.formatDuration(summary.totalTime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {summary.totalEntries}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Entries</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm.isOpen}
        title="Delete Time Log"
        message="Are you sure you want to delete this time log? This action cannot be undone."
        onConfirm={confirmDeleteTimeLog}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, timeLogId: '', taskId: '' })}
        confirmText="Delete"
        cancelText="Cancel"
      />
      </div>
    </>
  );
};

export default TimeLog;
