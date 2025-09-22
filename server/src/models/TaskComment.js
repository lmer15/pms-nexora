const RealtimeDatabaseService = require('../services/realtimeDatabaseService');

class TaskComment extends RealtimeDatabaseService {
  constructor() {
    super('taskComments');
  }

  async findByTask(taskId) {
    return this.findByField('taskId', taskId);
  }

  async createComment(commentData, taskId, creatorId) {
    const data = {
      ...commentData,
      taskId,
      creatorId,
      parentCommentId: commentData.parentCommentId || null, // For replies
      likes: [], // Array of user IDs who liked
      dislikes: [], // Array of user IDs who disliked
      replies: [], // Array of reply comment IDs
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Fetch user profile
    const User = require('./User');
    const user = await User.findById(creatorId);
    const userProfile = user ? await User.getProfile(user.id) : { firstName: 'Unknown', lastName: '', profilePicture: null };
    data.userProfile = userProfile;
    
    const comment = await this.create(data);
    
    // If this is a reply, add it to the parent comment's replies array
    if (commentData.parentCommentId) {
      await this.addReplyToParent(commentData.parentCommentId, comment.id);
    }
    
    return comment;
  }

  async updateComment(commentId, updateData) {
    // Preserve userProfile if not provided
    const current = await this.findById(commentId);
    const data = { ...updateData, updatedAt: new Date() };
    if (current && current.userProfile && !data.userProfile) {
      data.userProfile = current.userProfile;
    }
    return this.update(commentId, data);
  }

  async deleteComment(commentId) {
    return this.delete(commentId);
  }

  // Add reply to parent comment
  async addReplyToParent(parentCommentId, replyCommentId) {
    const parentComment = await this.findById(parentCommentId);
    if (parentComment) {
      const replies = parentComment.replies || [];
      if (!replies.includes(replyCommentId)) {
        replies.push(replyCommentId);
        await this.update(parentCommentId, { replies });
      }
    }
  }

  // Like a comment
  async likeComment(commentId, userId) {
    const comment = await this.findById(commentId);
    if (!comment) return null;

    const likes = comment.likes || [];
    const dislikes = comment.dislikes || [];

    // Remove from dislikes if present
    const updatedDislikes = dislikes.filter(id => id !== userId);
    
    // Add to likes if not already present
    const updatedLikes = likes.includes(userId) 
      ? likes.filter(id => id !== userId) // Toggle: remove if already liked
      : [...likes, userId]; // Add if not liked

    return this.update(commentId, { 
      likes: updatedLikes, 
      dislikes: updatedDislikes 
    });
  }

  // Dislike a comment
  async dislikeComment(commentId, userId) {
    const comment = await this.findById(commentId);
    if (!comment) return null;

    const likes = comment.likes || [];
    const dislikes = comment.dislikes || [];

    // Remove from likes if present
    const updatedLikes = likes.filter(id => id !== userId);
    
    // Add to dislikes if not already present
    const updatedDislikes = dislikes.includes(userId) 
      ? dislikes.filter(id => id !== userId) // Toggle: remove if already disliked
      : [...dislikes, userId]; // Add if not disliked

    return this.update(commentId, { 
      likes: updatedLikes, 
      dislikes: updatedDislikes 
    });
  }

  // Get comments with replies (hierarchical structure)
  async findByTaskWithReplies(taskId) {
    const comments = await this.findByTask(taskId);
    
    // Separate parent comments and replies
    const parentComments = comments.filter(comment => !comment.parentCommentId);
    const replies = comments.filter(comment => comment.parentCommentId);
    
    // Build hierarchical structure
    const commentsWithReplies = parentComments.map(parent => {
      const commentReplies = replies.filter(reply => reply.parentCommentId === parent.id);
      return {
        ...parent,
        replies: commentReplies
      };
    });
    
    return commentsWithReplies;
  }
}

module.exports = new TaskComment();
