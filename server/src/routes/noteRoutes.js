const express = require('express');
const router = express.Router();
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');
const {
  getNotes,
  getNoteById,
  getNotesByUser,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  getNotesByCategory,
  getPinnedNotes,
  getArchivedNotes,
  getCategories,
  getTags,
  togglePin,
  toggleArchive
} = require('../controllers/noteController');

// All note routes require authentication
router.use(firebaseAuthMiddleware);

// Routes - Specific routes first, then parameterized routes
router.get('/facility/:facilityId', getNotes);
router.get('/user/me', getNotesByUser); // For authenticated user's notes
router.get('/user/:userId', getNotesByUser);
router.get('/search', searchNotes);
router.get('/category', getNotesByCategory);
router.get('/pinned', getPinnedNotes);
router.get('/archived', getArchivedNotes);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/:id', getNoteById); // This must be last among GET routes
router.post('/', createNote);
router.put('/:id/pin', togglePin);
router.put('/:id/archive', toggleArchive);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
