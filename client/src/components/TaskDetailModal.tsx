import React, { useEffect, useState } from 'react';
import { TaskDetails, taskService, Task, TaskComment, TaskAttachment, TaskDependency, TaskSubtask, TaskTimeLog, TaskActivityLog } from '../api/taskService';
import { projectService } from '../api/projectService';
import { useAuth } from '../hooks/useAuth';
import { LucideX, LucideMessageSquare, LucidePaperclip, LucideGitBranch, LucideCheckSquare, LucideClock, LucideActivity, LucideFileText, LucideMoreHorizontal } from 'lucide-react';
import LoadingAnimation from './LoadingAnimation';
import { ErrorAlert } from './ui/error-alert';
import { ConfirmationDialog } from './ui/confirmation-dialog';
import Notification from './Notification';

import TaskDetailHeader from './TaskDetail/TaskDetailHeader';
import TaskDetailCoreDetails from './TaskDetail/TaskDetailCoreDetails';
import TaskDetailComments from './TaskDetail/TaskDetailComments';
import TaskDetailAttachments from './TaskDetail/TaskDetailAttachments';
import TaskDetailDependencies from './TaskDetail/TaskDetailDependencies';
import TaskDetailSubtasks from './TaskDetail/TaskDetailSubtasks';
import TaskDetailTimeLogs from './TaskDetail/TaskDetailTimeLogs';
import TaskDetailActivityLogs from './TaskDetail/TaskDetailActivityLogs';

interface TaskDetailModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'comments' | 'attachments' | 'dependencies' | 'subtasks' | 'timelogs' | 'activity';

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, onClose }) => {
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [titleSaving, setTitleSaving] = useState(false);
  const [facilityId, setFacilityId] = useState<string>('');
  const [projectOwnerId, setProjectOwnerId] = useState<string>('');

  // UI State
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [warningToast, setWarningToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'error' | 'success';
  }>({
    isVisible: false,
    message: '',
    type: 'error',
  });

  const [commentCount, setCommentCount] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768); // md breakpoint
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTaskDetails();
      setActiveTab('overview'); // Reset to overview when opening
    }
  }, [isOpen, taskId]);

  useEffect(() => {
    if (taskDetails?.comments) {
      setCommentCount(taskDetails.comments.length);
    }
  }, [taskDetails?.comments]);

  const loadTaskDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const details = await taskService.getTaskDetails(taskId);
      setTaskDetails(details);

      // Fetch project to get facilityId and owner
      if (details.task.projectId) {
        const project = await projectService.getById(details.task.projectId);
        setFacilityId(project.facilityId);
        if (project.creatorId) setProjectOwnerId(project.creatorId);
      }
    } catch (err) {
      setError('Failed to load task details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Field change handler for local state updates
  const handleFieldChange = (field: keyof Task, value: any) => {
    setEditedTask((prev) => ({ ...prev, [field]: value }));
  };

  const handleFieldChangeAndSave = async (field: keyof Task, value: any) => {
    if (!taskDetails) return;
    try {
      // Update local state immediately for UI responsiveness
      setEditedTask((prev) => ({ ...prev, [field]: value }));
      
      // Save to database
      const updatedTask = await taskService.update(taskDetails.task.id, { [field]: value });
      
      // Update the task details state with the response from the server
      setTaskDetails(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          task: {
            ...prev.task,
            [field]: value,
            updatedAt: updatedTask.updatedAt
          }
        };
      });
      
      setWarningToast({ isVisible: true, message: 'Task updated successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to save field change:', err);
      setWarningToast({ isVisible: true, message: 'Failed to save changes', type: 'error' });
    }
  };


  const handleSaveTitle = async (title: string) => {
    if (!taskDetails) return;
    setTitleSaving(true);
    try {
      await taskService.update(taskDetails.task.id, { title });
      await loadTaskDetails();
      setWarningToast({ isVisible: true, message: 'Title updated', type: 'success' });
    } catch (err) {
      console.error('Failed to update title:', err);
      setWarningToast({ isVisible: true, message: 'Failed to update title', type: 'error' });
    } finally {
      setTitleSaving(false);
    }
  };

  const handleStatusChange = async (status: Task['status']) => {
    if (!taskDetails) return;
    try {
      await taskService.update(taskDetails.task.id, { status });
      await loadTaskDetails();
      setWarningToast({ isVisible: true, message: 'Status updated', type: 'success' });
    } catch (err) {
      console.error('Failed to update status:', err);
      setWarningToast({ isVisible: true, message: 'Failed to update status', type: 'error' });
    }
  };

  // UI helpers
  const showConfirmation = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    cancelText?: string
  ) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  const showWarning = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    const mappedType: 'error' | 'success' = type === 'success' ? 'success' : 'error';
    setWarningToast({ isVisible: true, message, type: mappedType });
  };

  const closeModal = () => {
    setEditedTask({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
      <div
        className={`relative z-10 w-full max-w-6xl h-[90vh] max-h-[800px] rounded-lg overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {loading ? (
          <div className="flex items-center justify-center p-10">
            <LoadingAnimation />
          </div>
        ) : error ? (
          <div className="p-4">
            <ErrorAlert title="Error" message={error} />
          </div>
        ) : taskDetails ? (
          <>
            <TaskDetailHeader
              task={taskDetails.task}
              onClose={closeModal}
              isDarkMode={isDarkMode}
              editedTask={editedTask}
              onFieldChange={handleFieldChange}
              onSaveTitle={handleSaveTitle}
              onStatusChange={handleStatusChange}
            />

            {/* Tabs */}
            <div className={`sticky top-[64px] z-30 px-4 sm:px-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900/95 backdrop-blur' : 'border-gray-200 bg-white/95 backdrop-blur'}`}>
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md whitespace-nowrap ${
                    activeTab === 'overview'
                      ? 'bg-brand text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  <LucideFileText className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Overview</span>
                </button>
                <button
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md whitespace-nowrap ${
                    activeTab === 'comments'
                      ? 'bg-green-600 text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('comments')}
                >
                  <LucideMessageSquare className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span>Comments</span>
                  {commentCount > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === 'comments'
                        ? 'bg-green-500 text-white'
                        : isDarkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>{commentCount}</span>
                  )}
                </button>
                <button
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md whitespace-nowrap ${
                    activeTab === 'attachments'
                      ? 'bg-brand text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('attachments')}
                >
                  <LucidePaperclip className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Attachments</span>
                  <span className="sm:hidden">Files</span>
                  {taskDetails.attachments?.length > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>{taskDetails.attachments.length}</span>
                  )}
                </button>
                <button
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md whitespace-nowrap ${
                    activeTab === 'dependencies'
                      ? 'bg-brand text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('dependencies')}
                >
                  <LucideGitBranch className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Dependencies</span>
                  <span className="sm:hidden">Deps</span>
                  {taskDetails.dependencies?.length > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>{taskDetails.dependencies.length}</span>
                  )}
                </button>
                <button
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md whitespace-nowrap ${
                    activeTab === 'subtasks'
                      ? 'bg-brand text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('subtasks')}
                >
                  <LucideCheckSquare className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Subtasks</span>
                  <span className="sm:hidden">Tasks</span>
                  {taskDetails.subtasks?.length > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>{taskDetails.subtasks.length}</span>
                  )}
                </button>
                <button
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md whitespace-nowrap ${
                    activeTab === 'timelogs'
                      ? 'bg-brand text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('timelogs')}
                >
                  <LucideClock className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Time Logs</span>
                  <span className="sm:hidden">Time</span>
                  {taskDetails.timeLogs?.length > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>{taskDetails.timeLogs.length}</span>
                  )}
                </button>
                <button
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-md whitespace-nowrap ${
                    activeTab === 'activity'
                      ? 'bg-brand text-white'
                      : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab('activity')}
                >
                  <LucideActivity className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Activity</span>
                  <span className="sm:hidden">Log</span>
                  {taskDetails.activityLogs?.length > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}>{taskDetails.activityLogs.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'overview' && (
            <TaskDetailCoreDetails
              task={taskDetails.task}
              isDarkMode={isDarkMode}
              editedTask={editedTask}
              onFieldChange={handleFieldChange}
              onFieldChangeAndSave={handleFieldChangeAndSave}
              comments={taskDetails.comments}
              activityLogs={taskDetails.activityLogs}
              onSwitchToComments={() => setActiveTab('comments')}
              subtasks={taskDetails.subtasks}
              facilityId={facilityId}
              excludeUserId={projectOwnerId}
              dependencies={taskDetails.dependencies}
              onSwitchToDependencies={() => setActiveTab('dependencies')}
              onSwitchToSubtasks={() => setActiveTab('subtasks')}
            />
              )}
              {activeTab === 'comments' && (
                <TaskDetailComments
                  taskId={taskDetails.task.id}
                  isDarkMode={isDarkMode}
                  onShowWarning={showWarning}
                  onCountChange={(count) => setCommentCount(count)}
                />
              )}
              {activeTab === 'attachments' && (
                <TaskDetailAttachments
                  taskId={taskDetails.task.id}
                  attachments={taskDetails.attachments}
                  isDarkMode={isDarkMode}
                  onRefresh={loadTaskDetails}
                  onShowWarning={showWarning}
                  onShowConfirmation={(title, message, onConfirm, confirmText, cancelText) =>
                    showConfirmation(title, message, onConfirm, confirmText, cancelText)
                  }
                />
              )}
              {activeTab === 'dependencies' && (
                <TaskDetailDependencies
                  taskId={taskDetails.task.id}
                  dependencies={taskDetails.dependencies}
                  isDarkMode={isDarkMode}
                  onShowWarning={showWarning}
                  onShowConfirmation={(title, message, onConfirm, confirmText, cancelText) =>
                    showConfirmation(title, message, onConfirm, confirmText, cancelText)
                  }
                  onRefresh={loadTaskDetails}
                />
              )}
              {activeTab === 'subtasks' && (
                <TaskDetailSubtasks
                  subtasks={taskDetails.subtasks}
                  taskId={taskDetails.task.id}
                  isDarkMode={isDarkMode}
                  onShowWarning={showWarning}
                  onShowConfirmation={(title, message, onConfirm, confirmText, cancelText) =>
                    showConfirmation(title, message, onConfirm, confirmText, cancelText)
                  }
                  onRefresh={loadTaskDetails}
                />
              )}
              {activeTab === 'timelogs' && (
                <TaskDetailTimeLogs
                  timeLogs={taskDetails.timeLogs}
                  isDarkMode={isDarkMode}
                  taskId={taskDetails.task.id}
                  onShowWarning={showWarning}
                  onTimeLogsUpdate={loadTaskDetails}
                  onShowConfirmation={showConfirmation}
                />
              )}
              {activeTab === 'activity' && (
                <TaskDetailActivityLogs
                  activityLogs={taskDetails.activityLogs}
                  isDarkMode={isDarkMode}
                  onShowWarning={showWarning}
                />
              )}
            </div>
          </>
        ) : null}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmationDialog.isOpen}
          title={confirmationDialog.title}
          message={confirmationDialog.message}
          confirmText={confirmationDialog.confirmText}
          cancelText={confirmationDialog.cancelText}
          onConfirm={() => {
            confirmationDialog.onConfirm?.();
            setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Notification */}
        {warningToast.isVisible && (
          <Notification
            message={warningToast.message}
            onClose={() => setWarningToast((prev) => ({ ...prev, isVisible: false }))}
            type={warningToast.type === 'success' ? 'success' : 'error'}
          />
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;