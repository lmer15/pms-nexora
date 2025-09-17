const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/taskCommentController');

router.use(authMiddleware);

router.get('/', getCommentsByTask);
router.post('/', createComment);
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);

module.exports = router;
