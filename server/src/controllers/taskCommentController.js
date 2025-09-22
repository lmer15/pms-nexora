const TaskComment = require('../models/TaskComment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const UserFacility = require('../models/UserFacility');
const ActivityLoggerService = require('../services/activityLoggerService');

// Helper function to check if user has access to a task
const checkTaskAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const userFacility = await UserFacility.findByUserAndFacility(userId, project.facilityId);
  if (userFacility.length === 0) {
    throw new Error('Access denied: User is not a member of the facility');
  }

  return { task, project, facilityId: project.facilityId };
};

exports.getCommentsByTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.userId;

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const comments = await TaskComment.findByTaskWithReplies(taskId);

    // Fetch user profiles for comment creators
    const User = require('../models/User');
    const userIds = [...new Set(comments.flatMap(c => [c.creatorId, ...(c.replies || []).map(r => r.creatorId)]))];
    const userProfiles = {};
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (user) {
        const profile = await User.getProfile(user.id);
        userProfiles[userId] = profile || { firstName: 'Unknown', lastName: '', profilePicture: null };
      } else {
        userProfiles[userId] = { firstName: 'Unknown', lastName: '', profilePicture: null };
      }
    }

    // Attach user profile info to comments and replies
    const commentsWithUser = comments.map(comment => ({
      ...comment,
      userProfile: userProfiles[comment.creatorId] || { firstName: 'Unknown', lastName: '', profilePicture: null },
      replies: (comment.replies || []).map(reply => ({
        ...reply,
        userProfile: userProfiles[reply.creatorId] || { firstName: 'Unknown', lastName: '', profilePicture: null }
      }))
    }));

    res.json(commentsWithUser);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};

exports.createComment = async (req, res) => {
  try {
    const creatorId = req.userId;
    const { taskId } = req.params;
    const { content, parentCommentId, formatting } = req.body;

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required and must be a non-empty string' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Comment content must be less than 1000 characters' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(taskId, creatorId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    // If this is a reply, validate parent comment exists
    if (parentCommentId) {
      const parentComment = await TaskComment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      if (parentComment.taskId !== taskId) {
        return res.status(400).json({ message: 'Parent comment does not belong to this task' });
      }
    }

    const commentData = { 
      content: content.trim(),
      parentCommentId: parentCommentId || null,
      formatting: formatting || null // Store formatting information
    };

    const comment = await TaskComment.createComment(commentData, taskId, creatorId);

    // Log activity
    await ActivityLoggerService.logCommentAdded(taskId, creatorId, comment.id);

    // Fetch user profile for the created comment
    const User = require('../models/User');
    const user = await User.findById(creatorId);
    const userProfile = user ? await User.getProfile(user.id) : null;

    // Attach user profile info to the comment
    const commentWithUser = {
      ...comment,
      userProfile: userProfile || { firstName: 'Unknown', lastName: '', profilePicture: null }
    };

    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Server error creating comment' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { commentId } = req.params;
    const { content } = req.body;

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required and must be a non-empty string' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Comment content must be less than 1000 characters' });
    }

    // Get comment to check ownership
    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.creatorId !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own comments' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(comment.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const updatedComment = await TaskComment.updateComment(commentId, { content: content.trim() });
    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Log activity
    await ActivityLoggerService.logCommentUpdated(comment.taskId, userId, commentId);

    // Fetch user profile for the updated comment
    const User = require('../models/User');
    const user = await User.findById(updatedComment.creatorId);
    const userProfile = user ? await User.getProfile(user.id) : null;

    // Attach user profile info to the comment
    const commentWithUser = {
      ...updatedComment,
      userProfile: userProfile || { firstName: 'Unknown', lastName: '', profilePicture: null }
    };

    res.json(commentWithUser);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Server error updating comment' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { commentId } = req.params;

    // Get comment to check ownership
    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.creatorId !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only delete your own comments' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(comment.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const deleted = await TaskComment.deleteComment(commentId);
    if (!deleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Log activity
    await ActivityLoggerService.logCommentDeleted(comment.taskId, userId, commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { commentId } = req.params;

    // Get comment to check access
    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(comment.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const updatedComment = await TaskComment.likeComment(commentId, userId);
    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({
      message: 'Comment liked successfully',
      likes: updatedComment.likes || [],
      dislikes: updatedComment.dislikes || []
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ message: 'Server error liking comment' });
  }
};

// Dislike a comment
exports.dislikeComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { commentId } = req.params;

    // Get comment to check access
    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check user access to the task
    try {
      await checkTaskAccess(comment.taskId, userId);
    } catch (accessError) {
      return res.status(403).json({ message: accessError.message });
    }

    const updatedComment = await TaskComment.dislikeComment(commentId, userId);
    if (!updatedComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({
      message: 'Comment disliked successfully',
      likes: updatedComment.likes || [],
      dislikes: updatedComment.dislikes || []
    });
  } catch (error) {
    console.error('Error disliking comment:', error);
    res.status(500).json({ message: 'Server error disliking comment' });
  }
};
