const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const {
  getSubtasksByTask,
  createSubtask,
  updateSubtask,
  deleteSubtask
} = require('../controllers/taskSubtaskController');

router.use(authMiddleware);

router.get('/', getSubtasksByTask);
router.post('/', createSubtask);
router.put('/:subtaskId', updateSubtask);
router.delete('/:subtaskId', deleteSubtask);

module.exports = router;
