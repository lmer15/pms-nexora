const { db } = require('../config/firebase-admin');
const { FirestoreService } = require('../services/firestoreService');

class Note {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.content = data.content;
    this.facilityId = data.facilityId;
    this.userId = data.userId;
    this.category = data.category || 'general';
    this.tags = data.tags || [];
    this.isPinned = data.isPinned || false;
    this.isArchived = data.isArchived || false;
    this.color = data.color || 'default';
    
    // Convert Firestore Timestamps to JavaScript Date objects
    this.createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();
    this.updatedAt = data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)) : new Date();
  }

  // Create a new note
  static async createNote(data) {
    try {
      const noteData = {
        title: data.title,
        content: data.content,
        facilityId: data.facilityId,
        userId: data.userId,
        category: data.category || 'general',
        tags: data.tags || [],
        isPinned: data.isPinned || false,
        isArchived: data.isArchived || false,
        color: data.color || 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('notes').add(noteData);
      const note = await docRef.get();

      return new Note({
        id: docRef.id,
        ...note.data()
      });
    } catch (error) {
      throw new Error(`Error creating note: ${error.message}`);
    }
  }

  // Find note by ID
  static async findById(id) {
    try {
      const doc = await db.collection('notes').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new Note({
        id: doc.id,
        ...doc.data()
      });
    } catch (error) {
      throw new Error(`Error finding note: ${error.message}`);
    }
  }

  // Find all notes for a facility
  static async findByFacility(facilityId, userId = null) {
    try {
      let query = db.collection('notes')
        .where('facilityId', '==', facilityId);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();

      // Sort by createdAt in memory to avoid Firestore index requirements
      const notes = snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));

      return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw new Error(`Error finding notes by facility: ${error.message}`);
    }
  }

  // Find all notes for a user
  static async findByUser(userId) {
    try {
      const snapshot = await db.collection('notes')
        .where('userId', '==', userId)
        .get();

      // Sort by createdAt in memory
      const notes = snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));

      return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw new Error(`Error finding notes by user: ${error.message}`);
    }
  }

  // Update note
  static async update(id, updateData) {
    try {
      const updateObj = {
        ...updateData,
        updatedAt: new Date()
      };

      await db.collection('notes').doc(id).update(updateObj);

      // Return updated note
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Error updating note: ${error.message}`);
    }
  }

  // Delete note
  static async delete(id) {
    try {
      await db.collection('notes').doc(id).delete();
      return true;
    } catch (error) {
      throw new Error(`Error deleting note: ${error.message}`);
    }
  }

  // Search notes by title and content
  static async search(facilityId, searchTerm, userId = null) {
    try {
      let query = db.collection('notes')
        .where('facilityId', '==', facilityId)
        .where('isArchived', '==', false);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();
      const notes = snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by search term (case-insensitive)
      const searchLower = searchTerm.toLowerCase();
      return notes.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      throw new Error(`Error searching notes: ${error.message}`);
    }
  }

  // Get notes by category
  static async findByCategory(facilityId, category, userId = null) {
    try {
      let query = db.collection('notes')
        .where('facilityId', '==', facilityId)
        .where('category', '==', category)
        .where('isArchived', '==', false);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();
      const notes = snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));

      return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw new Error(`Error finding notes by category: ${error.message}`);
    }
  }

  // Get pinned notes
  static async findPinned(facilityId, userId = null) {
    try {
      let query = db.collection('notes')
        .where('facilityId', '==', facilityId)
        .where('isPinned', '==', true)
        .where('isArchived', '==', false);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();
      const notes = snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));

      return notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw new Error(`Error finding pinned notes: ${error.message}`);
    }
  }

  // Get archived notes
  static async findArchived(facilityId, userId = null) {
    try {
      let query = db.collection('notes')
        .where('facilityId', '==', facilityId)
        .where('isArchived', '==', true);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();
      const notes = snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));

      return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      throw new Error(`Error finding archived notes: ${error.message}`);
    }
  }

  // Get all categories for a facility
  static async getCategories(facilityId, userId = null) {
    try {
      let query = db.collection('notes')
        .where('facilityId', '==', facilityId)
        .where('isArchived', '==', false);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();
      const categories = new Set();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      throw new Error(`Error getting categories: ${error.message}`);
    }
  }

  // Get all tags for a facility
  static async getTags(facilityId, userId = null) {
    try {
      let query = db.collection('notes')
        .where('facilityId', '==', facilityId)
        .where('isArchived', '==', false);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.get();
      const tags = new Set();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => tags.add(tag));
        }
      });

      return Array.from(tags).sort();
    } catch (error) {
      throw new Error(`Error getting tags: ${error.message}`);
    }
  }

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      facilityId: this.facilityId,
      userId: this.userId,
      category: this.category,
      tags: this.tags,
      isPinned: this.isPinned,
      isArchived: this.isArchived,
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Note;
