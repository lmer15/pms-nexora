import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LucideMessageSquare, LucideSend, LucideSmile, LucideMoreVertical, LucideEdit, LucideTrash2, LucideCheck, LucideX, LucideBold, LucideItalic, LucideUnderline, LucidePaperclip, LucideAtSign, LucideThumbsUp, LucideThumbsDown, LucideReply, LucideChevronDown } from 'lucide-react';
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
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionQuery, setMentionQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);


  // Sync local comments with realtime comments
  useEffect(() => {
    setComments(realtimeComments);
  }, [realtimeComments]);

  // Fetch available users for mentions (task assignees)
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        // Fetch task details to get assignee IDs
        const taskDetails = await taskService.getById(taskId);
        if (taskDetails?.assignees && taskDetails.assignees.length > 0) {
          const userProfiles = await taskService.fetchUserProfilesByIds(taskDetails.assignees);
          // Convert Record to array and filter out the current user
          const filteredUsers = Object.entries(userProfiles)
            .filter(([userId]) => userId !== user?.uid)
            .map(([userId, profile]) => ({ id: userId, ...profile }));
          setAvailableUsers(filteredUsers);
        }
      } catch (error) {
        console.error('Failed to fetch user profiles for mentions:', error);
      }
    };

    fetchAvailableUsers();
  }, [taskId, user?.uid]);

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMentionDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-mention-dropdown]')) {
          setShowMentionDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionDropdown]);

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
    const contentEditable = document.querySelector('[data-placeholder="Add comment..."]') as HTMLElement;
    const content = contentEditable?.innerHTML || '';
    
    if (!content.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await taskService.createComment(taskId, { 
        content: content.trim()
      });
      setNewComment('');
      if (contentEditable) {
        contentEditable.innerHTML = '';
      }
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

  // Handle reply functionality - trigger @mention
  const handleReply = (commentId: string, commenterName: string) => {
    // Find the comment to get the commenter's name
    const comment = comments.find(c => c.id === commentId);
    const commenterDisplayName = comment?.userProfile 
      ? `${comment.userProfile.firstName} ${comment.userProfile.lastName}`.trim()
      : commenterName;
    
    // Focus on the main comment input and add @mention
    const mainContentEditable = document.querySelector('[data-placeholder="Add comment..."]') as HTMLElement;
    if (mainContentEditable) {
      mainContentEditable.focus();
      
      // Add @mention with green styling to the main comment input
      const mentionHTML = `<span class="text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-1 py-0.5 rounded">@${commenterDisplayName}</span> `;
      mainContentEditable.innerHTML += mentionHTML;
      
      // Update the state with plain text for storage
      setNewComment(mainContentEditable.textContent || '');
      
      // Position cursor at the end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(mainContentEditable);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  // Handle @mention input detection
  const handleMentionInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const text = target.textContent || '';
    const cursorPosition = window.getSelection()?.getRangeAt(0).startOffset || 0;
    
    // Find the last @ symbol before cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @ (meaning we're still typing the mention)
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        
        // Create a range to find the exact position of the @ symbol
        const range = document.createRange();
        const textNode = target.firstChild;
        
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          // Set range to the @ symbol position
          range.setStart(textNode, lastAtIndex);
          range.setEnd(textNode, lastAtIndex + 1);
          
          const rect = range.getBoundingClientRect();
          const inputRect = target.getBoundingClientRect();
          
          // Position dropdown right next to the @ symbol
          setMentionPosition({
            top: inputRect.top + window.scrollY - 5, // Position above the input field
            left: rect.left + window.scrollX // Align with the @ symbol
          });
        }
        
        setShowMentionDropdown(true);
        return;
      }
    }
    
    setShowMentionDropdown(false);
  };

  // Handle mention selection
  const handleMentionSelect = (selectedUser: any) => {
    const mainContentEditable = document.querySelector('[data-placeholder="Add comment..."]') as HTMLElement;
    if (mainContentEditable) {
      const text = mainContentEditable.textContent || '';
      const cursorPosition = window.getSelection()?.getRangeAt(0).startOffset || 0;
      
      // Find the last @ symbol before cursor
      const textBeforeCursor = text.substring(0, cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        // Replace the @query with the selected user mention
        const beforeAt = text.substring(0, lastAtIndex);
        const afterCursor = text.substring(cursorPosition);
        const mentionText = `@${selectedUser.firstName} ${selectedUser.lastName}`;
        
        // Update the content with green styling
        const mentionHTML = `<span class="text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-1 py-0.5 rounded">${mentionText}</span>`;
        const newHTML = beforeAt + mentionHTML + ' ' + afterCursor;
        mainContentEditable.innerHTML = newHTML;
        
        // Update state
        setNewComment(mainContentEditable.textContent || '');
        
        // Position cursor after the mention
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(mainContentEditable.firstChild || mainContentEditable, beforeAt.length + mentionText.length + 1);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    
    setShowMentionDropdown(false);
    setMentionQuery('');
  };


  // Handle like/dislike functionality
  const handleLike = async (commentId: string) => {
    try {
      const result = await taskService.likeComment(taskId, commentId);
      // Update local state with new like/dislike counts
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: result.likes, dislikes: result.dislikes }
          : comment
      ));
    } catch (err) {
      console.error('Failed to like comment:', err);
      onShowWarning?.('Failed to like comment. Please try again.', 'error');
    }
  };

  const handleDislike = async (commentId: string) => {
    try {
      const result = await taskService.dislikeComment(taskId, commentId);
      // Update local state with new like/dislike counts
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: result.likes, dislikes: result.dislikes }
          : comment
      ));
    } catch (err) {
      console.error('Failed to dislike comment:', err);
      onShowWarning?.('Failed to dislike comment. Please try again.', 'error');
    }
  };



  // Apply formatting to selected text using contentEditable div
  const applyFormattingToSelection = (type: 'bold' | 'italic' | 'underline') => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      if (!range.collapsed) {
        // Apply formatting to selected text
        switch (type) {
          case 'bold':
            document.execCommand('bold', false);
            break;
          case 'italic':
            document.execCommand('italic', false);
            break;
          case 'underline':
            document.execCommand('underline', false);
            break;
        }
      }
    }
  };

  // Handle formatting button clicks for main comment
  const handleFormattingClick = (type: 'bold' | 'italic' | 'underline') => {
    const contentEditable = document.querySelector('[data-placeholder="Add comment..."]') as HTMLElement;
    if (contentEditable) {
      contentEditable.focus();
      applyFormattingToSelection(type);
    }
  };

  // Handle @ mention button click
  const handleMentionClick = () => {
    const contentEditable = document.querySelector('[data-placeholder="Add comment..."]') as HTMLElement;
    if (contentEditable) {
      contentEditable.focus();
      
      // Add @ symbol to trigger mention dropdown
      const currentText = contentEditable.textContent || '';
      const newText = currentText + '@';
      contentEditable.textContent = newText;
      
      // Update state
      setNewComment(newText);
      
      // Position cursor at the end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentEditable);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      
      // Trigger mention input handler
      const event = new Event('input', { bubbles: true });
      contentEditable.dispatchEvent(event);
    }
  };


  // Render formatted text with @mention highlighting and automatic link detection
  const renderFormattedText = (content: string) => {
    if (!content) return content;
    
    let processedContent = content;
    
    // First, process URLs to make them clickable
    // This regex matches various URL formats including http, https, ftp, www, and domain names
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|ftp:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+|[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]]*)?)/g;
    processedContent = processedContent.replace(urlRegex, (url) => {
      // Clean up the URL (remove trailing punctuation that might not be part of the URL)
      const cleanUrl = url.replace(/[.,;:!?]+$/, '');
      const trailingPunctuation = url.slice(cleanUrl.length);
      
      // Ensure protocol is present
      const href = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-1 underline-offset-2 hover:decoration-2 transition-all duration-200">${cleanUrl}</a>${trailingPunctuation}`;
    });
    
    // Then process @mentions to add green styling
    processedContent = processedContent.replace(
      /@(\w+(?:\s+\w+)*)/g, 
      '<span class="text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-1 py-0.5 rounded">@$1</span>'
    );
    
    return <span dangerouslySetInnerHTML={{ __html: processedContent }} />;
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
        <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <span>Comments</span>
          {comments.length > 0 && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'
            }`}>
              {comments.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'oldest')}
            className={`text-sm border rounded px-2 py-1 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
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

                  </div>
                  {editingCommentId === comment.id ? (
                    <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
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
                    <>
                      <div className={`text-sm leading-relaxed mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {renderFormattedText(comment.content)}
                      </div>
                      
                      {/* Comment Interactions */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(comment.id)}
                          className={`flex items-center gap-1 text-xs hover:opacity-80 transition-opacity ${
                            comment.likes?.includes(user?.uid || '') 
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                              : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                          }`}
                        >
                          <LucideThumbsUp className="w-3 h-3" />
                          <span>{comment.likes?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => handleDislike(comment.id)}
                          className={`flex items-center gap-1 text-xs hover:opacity-80 transition-opacity ${
                            comment.dislikes?.includes(user?.uid || '') 
                              ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                              : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                          }`}
                        >
                          <LucideThumbsDown className="w-3 h-3" />
                          <span>{comment.dislikes?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => handleReply(comment.id, comment.userProfile ? `${comment.userProfile.firstName} ${comment.userProfile.lastName}`.trim() : comment.creatorId)}
                          className={`flex items-center gap-1 text-xs hover:opacity-80 transition-opacity ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          <LucideReply className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>


                    </>
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
            <div
              contentEditable
              onInput={(e) => {
                setNewComment(e.currentTarget.textContent || '');
                handleMentionInput(e);
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all min-h-[80px] ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              style={{ 
                minHeight: '80px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}
              data-placeholder="Add comment..."
              suppressContentEditableWarning={true}
            />
            {!newComment && (
              <div 
                className={`absolute top-3 left-4 pointer-events-none ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Add comment...
              </div>
            )}
          </div>
          
          {/* Formatting Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Formatting buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleFormattingClick('bold')}
                  className={`p-2 rounded hover:bg-opacity-20 ${
                    isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Bold (select text and click)"
                >
                  <LucideBold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormattingClick('italic')}
                  className={`p-2 rounded hover:bg-opacity-20 ${
                    isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Italic (select text and click)"
                >
                  <LucideItalic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormattingClick('underline')}
                  className={`p-2 rounded hover:bg-opacity-20 ${
                    isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Underline (select text and click)"
                >
                  <LucideUnderline className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMentionClick()}
                  className={`p-2 rounded hover:bg-opacity-20 ${
                    isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Mention someone"
                >
                  <LucideAtSign className="w-4 h-4" />
                </button>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {/* @ and Link icons moved to formatting buttons section above */}
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
            >
              <LucideSend className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Submit'}</span>
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

      {/* Mention Dropdown */}
      {showMentionDropdown && availableUsers.length > 0 && (
        <>
          <style>
            {`
              [data-mention-dropdown]::-webkit-scrollbar {
                display: none;
              }
            `}
          </style>
          <div
            data-mention-dropdown
            className={`fixed z-50 w-64 max-h-48 overflow-y-auto border rounded-lg shadow-xl ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-300'
            }`}
            style={{
              top: mentionPosition.top,
              left: mentionPosition.left,
              transform: 'translateY(-100%)', // Position above the @ symbol
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
            }}
          >
          {/* Arrow pointing down */}
          <div 
            className={`absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              isDarkMode ? 'border-t-gray-800' : 'border-t-white'
            }`}
            style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
          />
          {availableUsers
            .filter(user => 
              `${user.firstName} ${user.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
            )
            .map((user) => (
              <button
                key={user.id}
                onClick={() => handleMentionSelect(user)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.firstName} {user.lastName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskDetailComments;