const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  dislikeComment
} = require('../controllers/taskCommentController');

router.use(authMiddleware);

router.get('/', getCommentsByTask);
router.post('/', createComment);
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);
router.post('/:commentId/like', likeComment);
router.post('/:commentId/dislike', dislikeComment);

module.exports = router;
