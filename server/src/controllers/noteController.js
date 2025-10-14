const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
  try {
    const facilityId = req.params.facilityId || req.query.facilityId;
    const userId = req.user.firebaseUid; // Use authenticated user
    
    const notes = await Note.findByFacility(facilityId, userId);
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ 
      message: 'Server error fetching notes',
      error: error.message,
      stack: error.stack
    });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ message: 'Server error fetching note' });
  }
};

exports.getNotesByUser = async (req, res) => {
  try {
    const userId = req.user.firebaseUid; // Use authenticated user
    const notes = await Note.findByUser(userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes by user:', error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const noteData = {
      ...req.body,
      userId: req.user.firebaseUid // Use authenticated user
    };
    const note = await Note.createNote(noteData);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Server error creating note' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const updatedNote = await Note.update(req.params.id, req.body);
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Server error updating note' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const deleted = await Note.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
};

// Search notes
exports.searchNotes = async (req, res) => {
  try {
    const { facilityId, searchTerm } = req.query;
    const userId = req.user.firebaseUid; // Use authenticated user
    const notes = await Note.search(facilityId, searchTerm, userId);
    res.json(notes);
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ message: 'Server error searching notes' });
  }
};

// Get notes by category
exports.getNotesByCategory = async (req, res) => {
  try {
    const { facilityId, category } = req.query;
    const userId = req.user.firebaseUid; // Use authenticated user
    const notes = await Note.findByCategory(facilityId, category, userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes by category:', error);
    res.status(500).json({ message: 'Server error fetching notes by category' });
  }
};

// Get pinned notes
exports.getPinnedNotes = async (req, res) => {
  try {
    const { facilityId } = req.query;
    const userId = req.user.firebaseUid; // Use authenticated user
    const notes = await Note.findPinned(facilityId, userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching pinned notes:', error);
    res.status(500).json({ message: 'Server error fetching pinned notes' });
  }
};

// Get archived notes
exports.getArchivedNotes = async (req, res) => {
  try {
    const { facilityId } = req.query;
    const userId = req.user.firebaseUid; // Use authenticated user
    const notes = await Note.findArchived(facilityId, userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching archived notes:', error);
    res.status(500).json({ message: 'Server error fetching archived notes' });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const { facilityId } = req.query;
    const userId = req.user.firebaseUid; // Use authenticated user
    const categories = await Note.getCategories(facilityId, userId);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

// Get tags
exports.getTags = async (req, res) => {
  try {
    const { facilityId } = req.query;
    const userId = req.user.firebaseUid; // Use authenticated user
    const tags = await Note.getTags(facilityId, userId);
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Server error fetching tags' });
  }
};

// Toggle pin status
exports.togglePin = async (req, res) => {
  try {
    const { isPinned } = req.body;
    const updatedNote = await Note.update(req.params.id, { isPinned });
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(updatedNote);
  } catch (error) {
    console.error('Error toggling pin status:', error);
    res.status(500).json({ message: 'Server error toggling pin status' });
  }
};

// Toggle archive status
exports.toggleArchive = async (req, res) => {
  try {
    const { isArchived } = req.body;
    const updatedNote = await Note.update(req.params.id, { isArchived });
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(updatedNote);
  } catch (error) {
    console.error('Error toggling archive status:', error);
    res.status(500).json({ message: 'Server error toggling archive status' });
  }
};