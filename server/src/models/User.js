const FirestoreService = require('../services/firestoreService');

class User extends FirestoreService {
  constructor() {
    super('users');
  }

  // Find user by email
  async findByEmail(email) {
    return this.findOneByField('email', email);
  }

  // Find user by Firebase UID
  async findByFirebaseUid(firebaseUid) {
    return this.findOneByField('firebaseUid', firebaseUid);
  }

  // Create user with validation and transaction to prevent duplicates
  async createUser(userData) {
    try {
      // Use transactional create to prevent race conditions
      const user = await this.createWithTransaction(userData, 'email', userData.email);
      return user;
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  // Update user profile
  async updateProfile(id, profileData) {
    const allowedFields = ['firstName', 'lastName', 'profilePicture', 'isEmailVerified'];
    const updateData = {};

    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = profileData[key];
      }
    });

    return this.update(id, updateData);
  }

  // Get user with sensitive data excluded
  async getProfile(id) {
    const user = await this.findById(id);
    if (!user) return null;

    // Exclude sensitive fields
    const { firebaseUid, ...profile } = user;
    return profile;
  }
}

module.exports = new User();
