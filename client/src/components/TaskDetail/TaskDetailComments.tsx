import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LucideMessageSquare, LucideSend, LucideSmile, LucideMoreVertical, LucideEdit, LucideTrash2, LucideCheck, LucideX } from 'lucide-react';
import { Picker } from 'emoji-mart';
import { TaskComment } from '../../api/taskService';
import { Button } from '../ui/button';
import { ErrorAlert } from '../ui/error-alert';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { taskService } from '../../api/taskService';
import { useRealtimeComments } from '../../hooks/useRealtimeComments';
import { useAuth } from '../../hooks/useAuth';

interface TaskDetailCommentsProps {
  taskId: string;
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
  onCountChange?: (count: number) => void;
}

const TaskDetailComments: React.FC<TaskDetailCommentsProps> = ({ taskId, isDarkMode, onShowWarning, onCountChange }) => {
  const { comments: realtimeComments, loading, error: realtimeError } = useRealtimeComments(taskId);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);


  // Sync local comments with realtime comments
  useEffect(() => {
    setComments(realtimeComments);
  }, [realtimeComments]);

  // Reset active dropdown when comments change
  useEffect(() => {
    setActiveDropdown(null);
  }, [comments]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await taskService.createComment(taskId, { content: newComment.trim() });
      setNewComment('');
      onShowWarning?.('Comment added successfully', 'success');
    } catch (err) {
      console.error('Failed to add comment:', err);
      setSubmitError('Failed to add comment. Please try again.');
      onShowWarning?.('Failed to add comment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
    setActiveDropdown(null);
  };

  const handleSaveEdit = async () => {
    if (!editingContent.trim()) return;

    setIsUpdating(true);
    try {
      const updatedComment = await taskService.updateComment(taskId, editingCommentId!, { content: editingContent.trim() });
      // Optimistic update: update the comment in local state immediately
      setComments(prev => prev.map(comment => comment.id === editingCommentId ? updatedComment : comment));
      setEditingCommentId(null);
      setEditingContent('');
      setActiveDropdown(null);
      onShowWarning?.('Comment updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update comment:', err);
      onShowWarning?.('Failed to update comment. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
    setActiveDropdown(null);
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteCommentId(commentId);
    setShowDeleteConfirm(true);
    setActiveDropdown(null);
  };

  const confirmDelete = async () => {
    if (!deleteCommentId) return;

    try {
      await taskService.deleteComment(taskId, deleteCommentId);
      // Optimistic update: remove the comment from local state immediately
      setComments(prev => prev.filter(comment => comment.id !== deleteCommentId));
      setShowDeleteConfirm(false);
      setDeleteCommentId(null);
      setActiveDropdown(null);
      onShowWarning?.('Comment deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete comment:', err);
      onShowWarning?.('Failed to delete comment. Please try again.', 'error');
    }
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

  const toggleDropdown = useCallback((commentId: string) => {
    setActiveDropdown(prev => prev === commentId ? null : commentId);
  }, []);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucideMessageSquare className="w-5 h-5" />
          <span>Comments</span>
          {comments.length > 0 && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'
            }`}>
              {comments.length}
            </span>
          )}
        </h3>
      </div>

      {/* Comments List */}
      <div className="space-y-4 h-96 overflow-y-auto mb-6 pr-2 scrollbar-none">
        {comments.length === 0 ? (
          <div className={`text-center py-8 rounded-lg border-2 border-dashed ${isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-300'}`}>
            <LucideMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg transition-all ${
                isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-50 hover:bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  {comment.userProfile?.profilePicture ? (
                    <img
                      src={comment.userProfile.profilePicture}
                      alt={`${comment.userProfile.firstName} ${comment.userProfile.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {(comment.userProfile?.firstName?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {comment.userProfile ? `${comment.userProfile.firstName} ${comment.userProfile.lastName}`.trim() : comment.creatorId}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>

                    {user && comment.creatorId && (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(comment.id);
                          }}
                          className={`p-1 rounded-full hover:bg-opacity-20 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                        >
                          <LucideMoreVertical className="w-4 h-4" />
                        </button>

                        {activeDropdown === comment.id && (
                          <div onClick={(e) => e.stopPropagation()} className={`absolute right-0 top-6 z-10 py-1 rounded-md shadow-lg border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}>
                            <button
                              key={`edit-${comment.id}`}
                              onClick={() => handleEditComment(comment.id, comment.content)}
                              className={`flex items-center w-full px-3 py-2 text-sm hover:bg-opacity-20 ${
                                isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <LucideEdit className="w-4 h-4 mr-2" />
                              Edit
                            </button>
                            <button
                              key={`delete-${comment.id}`}
                              onClick={() => handleDeleteComment(comment.id)}
                              className={`flex items-center w-full px-3 py-2 text-sm hover:bg-opacity-20 ${
                                isDarkMode ? 'hover:bg-red-900 text-red-300' : 'hover:bg-red-100 text-red-700'
                              }`}
                            >
                              <LucideTrash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                          isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} disabled={isUpdating || !editingContent.trim()} size="sm">
                          <LucideCheck className="w-4 h-4 mr-1" />
                          {isUpdating ? 'Saving...' : 'Save'}
                        </Button>
                        <Button onClick={handleCancelEdit} variant="ghost" size="sm">
                          <LucideX className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className={`sticky bottom-0 p-4 border-t ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="relative flex items-center gap-2">
              {/* Emoji picker removed due to compatibility issues */}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LucideSend className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
            </Button>
          </div>
        </div>
      </form>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </div>
  );
};

export default TaskDetailComments;