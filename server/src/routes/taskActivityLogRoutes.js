const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const {
  getActivityLogsByTask,
  createActivityLog
} = require('../controllers/taskActivityLogController');

router.use(authMiddleware);

router.get('/', getActivityLogsByTask);
router.post('/', createActivityLog);

module.exports = router;
