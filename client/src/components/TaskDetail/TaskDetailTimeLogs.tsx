import React, { useState, useEffect } from 'react';
import { LucideClock, LucidePlay, LucideSquare, LucidePlus, LucidePause } from 'lucide-react';
import { TaskTimeLog } from '../../api/taskService';
import { Button } from '../ui/button';

interface TaskDetailTimeLogsProps {
  timeLogs: TaskTimeLog[];
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
}

const TaskDetailTimeLogs: React.FC<TaskDetailTimeLogsProps> = ({ timeLogs, isDarkMode }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ startTime: Date; description: string } | null>(null);
  const [newLogDescription, setNewLogDescription] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualLog, setManualLog] = useState({
    description: '',
    startTime: '',
    endTime: '',
    duration: 0
  });

  const formatDuration = (duration?: number) => {
    if (!duration) return '0m';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds > 0 ? `${seconds}s` : ''}`;
    }
    return `${seconds}s`;
  };

  const calculateTotalTime = () => {
    return timeLogs.reduce((total, log) => total + (log.duration || 0), 0);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const startTimeTracking = () => {
    setCurrentSession({
      startTime: new Date(),
      description: newLogDescription || 'Work session'
    });
    setIsTracking(true);
    setNewLogDescription('');
  };

  const stopTimeTracking = async () => {
    if (!currentSession) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);

    try {
      // TODO: Implement time log creation
      console.log('Saving time log:', {
        description: currentSession.description,
        startTime: currentSession.startTime,
        endTime,
        duration
      });
      
      setIsTracking(false);
      setCurrentSession(null);
    } catch (error) {
      console.error('Failed to save time log:', error);
    }
  };

  const addManualTimeLog = async () => {
    if (!manualLog.description || !manualLog.startTime || !manualLog.endTime) return;

    const startTime = new Date(manualLog.startTime);
    const endTime = new Date(manualLog.endTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    try {
      // TODO: Implement manual time log creation
      console.log('Adding manual time log:', {
        ...manualLog,
        duration
      });
      
      setManualLog({ description: '', startTime: '', endTime: '', duration: 0 });
      setIsAddingManual(false);
    } catch (error) {
      console.error('Failed to add manual time log:', error);
    }
  };

  const totalTime = calculateTotalTime();

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucideClock className="w-4 h-4" />
          <span>Time Logs</span>
          {timeLogs.length > 0 && (
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {timeLogs.length}
            </span>
          )}
        </h3>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsAddingManual(!isAddingManual)}
          className="flex items-center gap-2"
        >
          <LucidePlus className="w-3 h-3" />
          Add Manual
        </Button>
      </div>

      {/* Time Tracker */}
      <div className={`mb-6 p-4 rounded-lg border ${
        isTracking 
          ? isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
          : isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Time Tracker
          </h4>
          {isTracking && currentSession && (
            <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              Started {formatTimeAgo(currentSession.startTime.toISOString())}
            </span>
          )}
        </div>
        
        {!isTracking ? (
          <div className="space-y-3">
            <input
              type="text"
              value={newLogDescription}
              onChange={(e) => setNewLogDescription(e.target.value)}
              placeholder="What are you working on?"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <Button
              onClick={startTimeTracking}
              className="flex items-center gap-2"
              size="sm"
            >
              <LucidePlay className="w-3 h-3" />
              Start Timer
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentSession?.description}
              </p>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Started at {currentSession?.startTime.toLocaleTimeString()}
              </p>
            </div>
            <Button
              onClick={stopTimeTracking}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <LucideSquare className="w-3 h-3" />
              Stop
            </Button>
          </div>
        )}
      </div>

      {/* Manual Time Log Form */}
      {isAddingManual && (
        <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Add Manual Time Log
          </h4>
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
                disabled={!manualLog.description || !manualLog.startTime || !manualLog.endTime}
                size="sm"
              >
                Add Time Log
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddingManual(false);
                  setManualLog({ description: '', startTime: '', endTime: '', duration: 0 });
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Total Time Summary */}
      {timeLogs.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <LucideClock className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Total Time: {formatDuration(totalTime)}
            </span>
          </div>
        </div>
      )}

      {/* Time Logs List */}
      <div className="space-y-3">
        {timeLogs.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideClock className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No time logs recorded yet.</p>
          </div>
        ) : (
          timeLogs.map((timeLog) => (
            <div
              key={timeLog.id}
              className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {timeLog.endTime ? (
                    <LucideSquare className="w-4 h-4 text-gray-500" />
                  ) : (
                    <LucidePlay className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {timeLog.description || 'Time tracking session'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Started:
                      </span>
                      <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(timeLog.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Duration:
                      </span>
                      <span className={`ml-1 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatDuration(timeLog.duration)}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        By:
                      </span>
                      <span className={`ml-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {timeLog.userId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskDetailTimeLogs;
