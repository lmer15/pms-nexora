const { db } = require('../config/firebase-admin');

class FirestoreService {
  constructor(collectionName) {
    this.collection = db.collection(collectionName);
  }

  // Create a new document
  async create(data) {
    try {
      // If data has an id field, use it as the document ID
      if (data.id) {
        const docRef = this.collection.doc(data.id);
        await docRef.set({
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
      } else {
        // If no id field, let Firestore generate one
        const docRef = await this.collection.add({
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date()
        });
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
      }
    } catch (error) {
      if (error.code === 5) {
        throw new Error(`Firestore database not found. Please ensure Firestore is enabled in Firebase console for your project. Original error: ${error.message}`);
      }
      throw new Error(`Error creating document: ${error.message}`);
    }
  }

  // Create a new document with transaction to prevent duplicates
  async createWithTransaction(data, uniqueField, uniqueValue) {
    try {
      const result = await db.runTransaction(async (transaction) => {
        // Check if document already exists
        const query = this.collection.where(uniqueField, '==', uniqueValue);
        const querySnapshot = await transaction.get(query);

        if (!querySnapshot.empty) {
          // Document already exists, return existing
          const existingDoc = querySnapshot.docs[0];
          return { id: existingDoc.id, ...existingDoc.data() };
        }

        // Create new document
        const docRef = this.collection.doc();
        transaction.set(docRef, {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        return { id: docRef.id, ...data };
      });

      return result;
    } catch (error) {
      if (error.code === 5) {
        throw new Error(`Firestore database not found. Please ensure Firestore is enabled in Firebase console for your project. Original error: ${error.message}`);
      }
      throw new Error(`Error creating document with transaction: ${error.message}`);
    }
  }

  // Find document by ID
  async findById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      // Handle case where collection doesn't exist yet (empty database)
      if (error.code === 5 || error.message.includes('NOT_FOUND')) {
        return null;
      }
      throw new Error(`Error finding document: ${error.message}`);
    }
  }

  // Find documents by field
  async findByField(field, value) {
    try {
      const snapshot = await this.collection.where(field, '==', value).get();
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    } catch (error) {
      return [];
    }
  }

  // Find one document by field
  async findOneByField(field, value) {
    try {
      const results = await this.findByField(field, value);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`Error finding document: ${error.message}`);
    }
  }

  // Get all documents
  async findAll() {
    try {
      const snapshot = await this.collection.get();
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    } catch (error) {
      // Handle case where collection doesn't exist yet (empty database)
      if (error.code === 5 || error.message.includes('NOT_FOUND')) {
        return [];
      }
      throw new Error(`Error getting all documents: ${error.message}`);
    }
  }

  // Update document
  async update(id, data) {
    try {
      await this.collection.doc(id).update({
        ...data,
        updatedAt: new Date()
      });
      const updatedDoc = await this.findById(id);
      return updatedDoc;
    } catch (error) {
      throw new Error(`Error updating document: ${error.message}`);
    }
  }

  // Delete document
  async delete(id) {
    try {
      await this.collection.doc(id).delete();
      return true;
    } catch (error) {
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }

  // Query with multiple conditions
  async query(conditions = []) {
    try {
      let query = this.collection;
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
      const snapshot = await query.get();
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    } catch (error) {
      // Handle case where collection doesn't exist yet (empty database)
      if (error.code === 5 || error.message.includes('NOT_FOUND')) {
        return [];
      }
      throw new Error(`Error querying documents: ${error.message}`);
    }
  }

  // Count documents with conditions
  async count(conditions = []) {
    try {
      let query = this.collection;
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      // Handle case where collection doesn't exist yet (empty database)
      if (error.code === 5 || error.message.includes('NOT_FOUND')) {
        return 0;
      }
      throw new Error(`Error counting documents: ${error.message}`);
    }
  }

  // Get a batch instance for batch operations
  static batch() {
    return db.batch();
  }

  // Get collection reference
  static collection(collectionName) {
    return db.collection(collectionName);
  }
}

module.exports = FirestoreService;
