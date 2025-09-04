const express = require('express');
const router = express.Router();
const {
  getNotes,
  getNoteById,
  getNotesByUser,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/noteController');

// Routes
router.get('/facility/:facilityId', getNotes);
router.get('/:id', getNoteById);
router.get('/user/:userId', getNotesByUser);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
