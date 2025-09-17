const { realtimeDb } = require('../config/firebase-admin');

class RealtimeDatabaseService {
  constructor(path) {
    this.path = path;
    this.ref = realtimeDb.ref(path);
  }

  // Create a new record
  async create(data) {
    try {
      const newRef = this.ref.push();
      const recordData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await newRef.set(recordData);
      return { id: newRef.key, ...recordData };
    } catch (error) {
      throw new Error(`Error creating record: ${error.message}`);
    }
  }

  // Find record by ID
  async findById(id) {
    try {
      const snapshot = await this.ref.child(id).once('value');
      if (!snapshot.exists()) {
        return null;
      }
      return { id: snapshot.key, ...snapshot.val() };
    } catch (error) {
      throw new Error(`Error finding record: ${error.message}`);
    }
  }

  // Find records by field value
  async findByField(field, value) {
    try {
      const snapshot = await this.ref.orderByChild(field).equalTo(value).once('value');
      const results = [];
      snapshot.forEach(childSnapshot => {
        results.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      return results;
    } catch (error) {
      throw new Error(`Error finding records: ${error.message}`);
    }
  }

  // Find one record by field value
  async findOneByField(field, value) {
    try {
      const results = await this.findByField(field, value);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw new Error(`Error finding record: ${error.message}`);
    }
  }

  // Get all records
  async findAll() {
    try {
      const snapshot = await this.ref.once('value');
      const results = [];
      snapshot.forEach(childSnapshot => {
        results.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      return results;
    } catch (error) {
      throw new Error(`Error getting all records: ${error.message}`);
    }
  }

  // Update record
  async update(id, data) {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await this.ref.child(id).update(updateData);
      const updatedRecord = await this.findById(id);
      return updatedRecord;
    } catch (error) {
      throw new Error(`Error updating record: ${error.message}`);
    }
  }

  // Delete record
  async delete(id) {
    try {
      await this.ref.child(id).remove();
      return true;
    } catch (error) {
      throw new Error(`Error deleting record: ${error.message}`);
    }
  }

  // Query with multiple conditions (limited support in Realtime DB)
  async query(conditions = []) {
    try {
      // Realtime DB has limited querying capabilities
      // For now, we'll fetch all and filter client-side
      const allRecords = await this.findAll();
      return allRecords.filter(record => {
        return conditions.every(condition => {
          const { field, operator, value } = condition;
          const recordValue = record[field];

          switch (operator) {
            case '==':
              return recordValue === value;
            case '!=':
              return recordValue !== value;
            case '<':
              return recordValue < value;
            case '<=':
              return recordValue <= value;
            case '>':
              return recordValue > value;
            case '>=':
              return recordValue >= value;
            default:
              return true;
          }
        });
      });
    } catch (error) {
      throw new Error(`Error querying records: ${error.message}`);
    }
  }
}

module.exports = RealtimeDatabaseService;
