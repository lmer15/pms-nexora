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
      const [todayLogs, summaryData, runningLogs] = await Promise.all([
        timeLogService.getTodayTimeLogs(),
        timeLogService.getTimeLogSummary(),
        timeLogService.getRunningTimeLogs(),
      ]);
      setTimeLogs(todayLogs);
      setSummary(summaryData);
      setRunningTimeLogs(runningLogs);
    } catch (error) {
      console.error('Failed to load time logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimeLogs();
  }, []);

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

  const startTimeTracking = async () => {
    if (!selectedTask) return;

    try {
      await timeLogService.startTimeTracking(selectedTask, newLogDescription);
      setNewLogDescription('');
      setSelectedTask('');
      loadTimeLogs();
    } catch (error) {
      console.error('Failed to start time tracking:', error);
    }
  };

  const stopTimeTracking = async (timeLogId: string, taskId: string) => {
    try {
      await timeLogService.stopTimeTracking(taskId, timeLogId);
      loadTimeLogs();
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
      loadTimeLogs();
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
      loadTimeLogs();
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
        <Button
          onClick={() => setIsAddingManual(!isAddingManual)}
          className="flex items-center justify-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
          variant="ghost"
        >
          <LucidePlus className="w-4 h-4" />
          <span>Add Manual Log</span>
        </Button>
        <Button
          onClick={loadTimeLogs}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
          variant="ghost"
        >
          <LucideRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
        <div className="flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-3 rounded-lg text-xs">
          <LucideClock className="w-4 h-4" />
          <span>{runningTimeLogs.length} Active</span>
        </div>
      </div>

      {/* Manual Time Log Form */}
      {isAddingManual && (
        <Card className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Add Manual Time Log</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={manualLog.description}
              onChange={(e) => setManualLog({ ...manualLog, description: e.target.value })}
              placeholder="Description..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <input
              type="text"
              value={manualLog.taskId}
              onChange={(e) => setManualLog({ ...manualLog, taskId: e.target.value })}
              placeholder="Task ID..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={manualLog.startTime}
                  onChange={(e) => setManualLog({ ...manualLog, startTime: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={manualLog.endTime}
                  onChange={(e) => setManualLog({ ...manualLog, endTime: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={addManualTimeLog}
                disabled={!manualLog.description || !manualLog.taskId || !manualLog.startTime || !manualLog.endTime}
                size="sm"
              >
                Add Time Log
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddingManual(false);
                  setManualLog({ taskId: '', description: '', startTime: '', endTime: '' });
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Time Entries */}
      <Card className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Today's Time Entries</h3>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <LucideRefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading time logs...</p>
            </div>
          ) : timeLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <LucideClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No time logs recorded today.</p>
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
      </Card>

      {/* Summary */}
      <Card className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
      </Card>

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
  );
};

export default TimeLog;
