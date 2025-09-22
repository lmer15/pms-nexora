const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllTimeLogs,
  getTimeLogsByProject,
  getTimeLogsByDateRange,
  getTimeLogSummary,
  getRunningTimeLogs,
  startTimeTracking,
  stopTimeTracking
} = require('../controllers/timeLogController');

router.use(authMiddleware);

// Get all time logs for the authenticated user
router.get('/', getAllTimeLogs);

// Get time logs by project
router.get('/project/:projectId', getTimeLogsByProject);

// Get time logs by date range
router.get('/range', getTimeLogsByDateRange);

// Get time log summary
router.get('/summary', getTimeLogSummary);

// Get running time logs
router.get('/running', getRunningTimeLogs);

// Start time tracking
router.post('/start/:taskId', startTimeTracking);

// Stop time tracking
router.post('/stop/:taskId/:timeLogId', stopTimeTracking);

module.exports = router;
