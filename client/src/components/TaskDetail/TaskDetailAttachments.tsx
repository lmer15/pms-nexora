import React, { useState } from 'react';
import { LucidePaperclip, LucideDownload, LucideFile, LucideImage, LucideFileText, LucideUpload, LucideX } from 'lucide-react';
import { TaskAttachment, taskService } from '../../api/taskService';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { SERVER_BASE_URL } from '../../config/api';

interface TaskDetailAttachmentsProps {
  taskId: string;
  attachments: TaskAttachment[];
  isDarkMode: boolean;
  onRefresh?: () => void;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
  onShowConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
}

const TaskDetailAttachments: React.FC<TaskDetailAttachmentsProps> = ({ taskId, attachments, isDarkMode, onRefresh, onShowWarning, onShowConfirmation }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { user } = useAuth();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <LucideImage className="w-4 h-4 text-blue-500" />;
    } else if (fileType.includes('pdf') || fileType.includes('document')) {
      return <LucideFileText className="w-4 h-4 text-red-500" />;
    } else {
      return <LucideFile className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateInput: any) => {
    let date: Date;
    if (!dateInput) return 'Unknown';
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (dateInput && typeof dateInput === 'object' && dateInput.toDate) {
      // Firestore Timestamp
      date = dateInput.toDate();
    } else if (dateInput && typeof dateInput === 'object' && dateInput._seconds) {
      // Serialized Firestore Timestamp
      date = new Date(dateInput._seconds * 1000 + (dateInput._nanoseconds || 0) / 1000000);
    } else {
      return 'Unknown';
    }
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      await taskService.uploadAttachment(taskId, files);
      onRefresh?.();
      onShowWarning?.('Files uploaded successfully', 'success');
    } catch (error) {
      console.error('Failed to upload files:', error);
      onShowWarning?.('Failed to upload files', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (attachmentId: string) => {
    if (!onShowConfirmation) return;
    onShowConfirmation(
      'Delete Attachment',
      'Are you sure you want to delete this attachment?',
      async () => {
        try {
          await taskService.deleteAttachment(taskId, attachmentId);
          onRefresh?.();
          onShowWarning?.('Attachment deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete attachment:', error);
          onShowWarning?.('Failed to delete attachment', 'error');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucidePaperclip className="w-4 h-4" />
          <span>Attachments</span>
          {attachments.length > 0 && (
            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {attachments.length}
            </span>
          )}
        </h3>
      </div>

      {/* Upload Area */}
      <div
        className={`mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragOver
            ? 'border-brand bg-brand/5'
            : isDarkMode
            ? 'border-gray-600 hover:border-gray-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <LucideUpload className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Drag and drop files here, or click to browse
        </p>
        <Button
          variant="secondary"
          size="sm"
          disabled={isUploading}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
            input.click();
          }}
        >
          <LucideUpload className="w-3 h-3 mr-2" />
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      </div>

      {/* Attachments List */}
      <div className="space-y-3">
        {attachments.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucidePaperclip className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No attachments yet. Upload files to get started!</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {attachment.fileName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(attachment.fileSize)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(attachment.uploadedAt || attachment.createdAt)}</span>
                    <span>•</span>
                    <span>by {attachment.uploaderName || attachment.uploaderId}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => window.open(`${SERVER_BASE_URL}${attachment.fileUrl}`, '_blank')}
                    title="Download"
                    className={`p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LucideDownload className="w-4 h-4" />
                  </button>
                  {user && (
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      title="Delete"
                      className={`p-2 rounded-md transition-colors hover:bg-red-100 dark:hover:bg-red-700 ${
                        isDarkMode ? 'text-red-400 hover:text-white' : 'text-red-600 hover:text-red-900'
                      }`}
                    >
                      <LucideX className="w-4 h-4" />
                    </button>
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

export default TaskDetailAttachments;
