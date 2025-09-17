const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAttachmentsByTask,
  uploadAttachments,
  downloadAttachment,
  deleteAttachment,
  getAttachmentInfo
} = require('../controllers/taskAttachmentController');

// Use auth middleware for all routes
router.use(authMiddleware);

// Routes for task attachments
router.get('/', getAttachmentsByTask);
router.post('/upload', uploadAttachments);
router.get('/:attachmentId', getAttachmentInfo);
router.delete('/:attachmentId', deleteAttachment);

module.exports = router;
