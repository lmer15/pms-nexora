const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDependenciesByTask,
  createDependency,
  deleteDependency
} = require('../controllers/taskDependencyController');

router.use(authMiddleware);

router.get('/', getDependenciesByTask);
router.post('/', createDependency);
router.delete('/:dependencyId', deleteDependency);

module.exports = router;
