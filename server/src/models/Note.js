const { db } = require('../config/firebase-admin');
const { FirestoreService } = require('../services/firestoreService');

class Note {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.content = data.content;
    this.facilityId = data.facilityId;
    this.userId = data.userId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Create a new note
  static async createNote(data) {
    try {
      const noteData = {
        title: data.title,
        content: data.content,
        facilityId: data.facilityId,
        userId: data.userId,
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
  static async findByFacility(facilityId) {
    try {
      const snapshot = await db.collection('notes')
        .where('facilityId', '==', facilityId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw new Error(`Error finding notes by facility: ${error.message}`);
    }
  }

  // Find all notes for a user
  static async findByUser(userId) {
    try {
      const snapshot = await db.collection('notes')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => new Note({
        id: doc.id,
        ...doc.data()
      }));
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

  // Convert to plain object
  toObject() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      facilityId: this.facilityId,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Note;
