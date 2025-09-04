const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.findByFacility(req.params.facilityId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error fetching notes' });
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
    const notes = await Note.findByUser(req.params.userId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes by user:', error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const note = await Note.createNote(req.body);
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
