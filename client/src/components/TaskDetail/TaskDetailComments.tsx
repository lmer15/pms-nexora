import React, { useState } from 'react';
import { LucideMessageSquare, LucideSend, LucideSmile } from 'lucide-react';
import { TaskComment } from '../../api/taskService';
import { Button } from '../ui/button';
import { ErrorAlert } from '../ui/error-alert';
import { taskService } from '../../api/taskService';
import { useRealtimeComments } from '../../hooks/useRealtimeComments';

interface TaskDetailCommentsProps {
  taskId: string;
  isDarkMode: boolean;
  onShowWarning?: (message: string, type?: 'warning' | 'error' | 'success') => void;
}

const TaskDetailComments: React.FC<TaskDetailCommentsProps> = ({ taskId, isDarkMode, onShowWarning }) => {
  const { comments, loading, error: realtimeError } = useRealtimeComments(taskId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-base font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <LucideMessageSquare className="w-5 h-5" />
          <span>Comments</span>
          {comments.length > 0 && (
            <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {comments.length}
            </span>
          )}
        </h3>
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none transition-all ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
              >
                <LucideSmile className="w-4 h-4" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
              className="flex items-center gap-2"
            >
              <LucideSend className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <LucideMessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-md border shadow-sm transition-all hover:shadow-md ${
                isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
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
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {comment.userProfile ? `${comment.userProfile.firstName} ${comment.userProfile.lastName}`.trim() : comment.creatorId}
                    </span>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskDetailComments;
