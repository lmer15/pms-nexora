const FirestoreService = require('../services/firestoreService');
const admin = require('firebase-admin');

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

  // Batch fetch user profiles by IDs
  async getProfilesByIds(userIds) {
    if (!userIds || userIds.length === 0) return {};
    
    const profiles = {};
    
    // Use individual document fetches instead of 'in' queries for document IDs
    const promises = userIds.map(async (userId) => {
      try {
        // Handle both string IDs and objects with id property
        const actualUserId = typeof userId === 'string' ? userId : (userId && userId.id ? userId.id : null);
        
        if (!actualUserId) {
          console.warn('Invalid userId provided:', userId);
          return;
        }
        
        const doc = await this.collection.doc(actualUserId).get();
        if (doc.exists) {
          const user = doc.data();
          profiles[actualUserId] = {
            id: actualUserId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            profilePicture: user.profilePicture
          };
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    });
    
    await Promise.all(promises);
    return profiles;
  }
}

module.exports = new User();
