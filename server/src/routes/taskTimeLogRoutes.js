const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTimeLogsByTask,
  createTimeLog,
  updateTimeLog,
  deleteTimeLog
} = require('../controllers/taskTimeLogController');

router.use(authMiddleware);

router.get('/', getTimeLogsByTask);
router.post('/', createTimeLog);
router.put('/:timeLogId', updateTimeLog);
router.delete('/:timeLogId', deleteTimeLog);

module.exports = router;
