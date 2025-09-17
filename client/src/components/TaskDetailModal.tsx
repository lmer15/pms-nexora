import React, { useEffect, useState } from 'react';
import { TaskDetails, taskService, Task, TaskComment, TaskAttachment, TaskDependency, TaskSubtask, TaskTimeLog, TaskActivityLog } from '../api/taskService';
import { useAuth } from '../hooks/useAuth';
import { LucideX, LucideMessageSquare, LucidePaperclip, LucideGitBranch, LucideCheckSquare, LucideClock, LucideActivity, LucideFileText } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [titleSaving, setTitleSaving] = useState(false);

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

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTaskDetails();
      setActiveTab('overview'); // Reset to overview when opening
    }
  }, [isOpen, taskId]);

  const loadTaskDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const details = await taskService.getTaskDetails(taskId);
      setTaskDetails(details);
    } catch (err) {
      setError('Failed to load task details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // UI Helper Functions
  const showConfirmation = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  const hideConfirmation = () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
  };

  const showWarning = (message: string, type: 'warning' | 'error' | 'success' = 'error') => {
    const notificationType = type === 'warning' ? 'error' : type;
    setWarningToast({
      isVisible: true,
      message,
      type: notificationType,
    });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setWarningToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const handleRefresh = () => {
    loadTaskDetails();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LucideFileText, count: null },
    { id: 'comments', label: 'Comments', icon: LucideMessageSquare, count: taskDetails?.comments?.length || 0 },
    { id: 'attachments', label: 'Attachments', icon: LucidePaperclip, count: taskDetails?.attachments?.length || 0 },
    { id: 'dependencies', label: 'Dependencies', icon: LucideGitBranch, count: taskDetails?.dependencies?.length || 0 },
    { id: 'subtasks', label: 'Subtasks', icon: LucideCheckSquare, count: taskDetails?.subtasks?.length || 0 },
    { id: 'timelogs', label: 'Time Logs', icon: LucideClock, count: taskDetails?.timeLogs?.length || 0 },
    { id: 'activity', label: 'Activity', icon: LucideActivity, count: taskDetails?.activityLogs?.length || 0 },
  ];

  const renderTabContent = () => {
    if (!taskDetails) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <TaskDetailCoreDetails
            task={taskDetails.task}
            isDarkMode={isDarkMode}
            isEditing={isEditing}
            editedTask={editedTask}
            onFieldChange={handleFieldChange}
            onSave={saveChanges}
            onCancel={cancelEditing}
          />
        );
      case 'comments':
        return (
            <TaskDetailComments
              taskId={taskId}
              isDarkMode={isDarkMode}
              onShowWarning={showWarning}
            />
        );
      case 'attachments':
        return (
          <TaskDetailAttachments
            taskId={taskId}
            attachments={taskDetails.attachments}
            isDarkMode={isDarkMode}
            onRefresh={loadTaskDetails}
            onShowWarning={showWarning}
            onShowConfirmation={showConfirmation}
          />
        );
      case 'dependencies':
        return (
          <TaskDetailDependencies
            dependencies={taskDetails.dependencies}
            isDarkMode={isDarkMode}
            onShowWarning={showWarning}
            onShowConfirmation={showConfirmation}
          />
        );
      case 'subtasks':
        return (
          <TaskDetailSubtasks
            subtasks={taskDetails.subtasks}
            taskId={taskId}
            isDarkMode={isDarkMode}
            onShowWarning={showWarning}
            onShowConfirmation={showConfirmation}
          />
        );
      case 'timelogs':
        return (
          <TaskDetailTimeLogs
            timeLogs={taskDetails.timeLogs}
            isDarkMode={isDarkMode}
            onShowWarning={showWarning}
          />
        );
      case 'activity':
        return <TaskDetailActivityLogs activityLogs={taskDetails.activityLogs} isDarkMode={isDarkMode} />;
      default:
        return <TaskDetailCoreDetails task={taskDetails.task} isDarkMode={isDarkMode} />;
    }
  };

  if (!isOpen) return null;

  // Handler for field changes in editing mode
  function handleFieldChange(field: keyof Task, value: any) {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  }

  // Save changes to backend
  async function saveChanges() {
    if (!taskDetails) return;
    try {
      const updatedTask = { ...taskDetails.task, ...editedTask };
      // Validate date fields to avoid "Invalid Date"
      if (updatedTask.dueDate && isNaN(new Date(updatedTask.dueDate).getTime())) {
        showWarning('Invalid due date format', 'error');
        return;
      }
      if (updatedTask.startDate && isNaN(new Date(updatedTask.startDate).getTime())) {
        showWarning('Invalid start date format', 'error');
        return;
      }
      if (updatedTask.title && updatedTask.title.trim() === '') {
        showWarning('Task title cannot be empty', 'error');
        return;
      }
      setTitleSaving(true);
      const savedTask = await taskService.update(updatedTask.id, editedTask);
      setTaskDetails(prev => prev ? { ...prev, task: savedTask } : prev);
      setIsEditing(false);
      setEditedTask({});
      showWarning('Task updated successfully', 'success');
      // Update task card immediately after saving changes
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('taskUpdated', { detail: savedTask }));
      }
    } catch (error) {
      console.error(error);
      showWarning('Failed to update task', 'error');
    } finally {
      setTitleSaving(false);
    }
  }

  // Save title change only
  async function saveTitle(title: string) {
    if (!taskDetails) return;
    if (title.trim() === '') {
      showWarning('Task title cannot be empty', 'error');
      return;
    }
    try {
      setTitleSaving(true);
      const savedTask = await taskService.update(taskDetails.task.id, { title });
      setTaskDetails(prev => prev ? { ...prev, task: savedTask } : prev);
      setIsEditing(false);
      setEditedTask(prev => ({ ...prev, title: savedTask.title }));
      showWarning('Task title updated successfully', 'success');
      // Update task card immediately after saving title
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('taskUpdated', { detail: savedTask }));
      }
    } catch (error) {
      console.error(error);
      showWarning('Failed to update task title', 'error');
    } finally {
      setTitleSaving(false);
    }
  }

  // Cancel editing and revert changes
  function cancelEditing() {
    setIsEditing(false);
    setEditedTask({});
  }

  // Handle status change
  async function handleStatusChange(status: Task['status']) {
    if (!taskDetails) return;
    try {
      const savedTask = await taskService.update(taskDetails.task.id, { status });
      setTaskDetails(prev => prev ? { ...prev, task: savedTask } : prev);
      showWarning('Task status updated successfully', 'success');
      // Update task card immediately after saving status
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('taskUpdated', { detail: savedTask }));
      }
    } catch (error) {
      console.error(error);
      showWarning('Failed to update task status', 'error');
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingAnimation />
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : taskDetails ? (
            <>
              {/* Sticky Header */}
              <div className="flex-shrink-0">
              <TaskDetailHeader
                task={taskDetails.task}
                onClose={onClose}
                isDarkMode={isDarkMode}
                onEdit={() => setIsEditing(!isEditing)}
                isEditing={isEditing}
                editedTask={editedTask}
                onFieldChange={handleFieldChange}
                onSaveTitle={saveTitle}
                onStatusChange={handleStatusChange}
              />
              </div>

              {/* Tab Navigation */}
              <div className={`flex-shrink-0 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex overflow-x-auto scrollbar-hide px-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`
                          flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 rounded-t-lg mx-0.5
                          ${activeTab === tab.id
                            ? `border-brand text-brand ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`
                            : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                        {tab.count !== null && tab.count > 0 && (
                          <span className={`
                            px-1.5 py-0.5 text-xs rounded-full font-medium min-w-[1.25rem] text-center
                            ${activeTab === tab.id
                              ? 'bg-brand text-white'
                              : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }
                          `}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="animate-in fade-in-0 slide-in-from-right-2 duration-300">
                  {renderTabContent()}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* UI Components */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={hideConfirmation}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
      />

      {warningToast.isVisible && (
        <Notification
          message={warningToast.message}
          type={warningToast.type}
          onClose={() => setWarningToast(prev => ({ ...prev, isVisible: false }))}
        />
      )}
    </>
  );
};

export default TaskDetailModal;