const FirestoreService = require('../services/firestoreService');
const Facility = require('./Facility');

class UserFacility extends FirestoreService {
  constructor() {
    super('userFacilities');
  }

  // Find user-facility relationships by user
  async findByUser(userId) {
    return this.findByField('userId', userId);
  }

  // Find user-facility relationships by facility
  async findByFacility(facilityId) {
    return this.findByField('facilityId', facilityId);
  }

  // Find relationship by user and facility
  async findByUserAndFacility(userId, facilityId) {
    return this.query([
      { field: 'userId', operator: '==', value: userId },
      { field: 'facilityId', operator: '==', value: facilityId }
    ]);
  }

  // Add user to facility with role (atomic operation)
  async addUserToFacility(userId, facilityId, role = 'member') {
    // Use transaction to prevent race conditions
    const db = require('../config/firebase-admin').db;
    
    try {
      const result = await db.runTransaction(async (transaction) => {
        // Check if relationship already exists
        const existingQuery = this.collection
          .where('userId', '==', userId)
          .where('facilityId', '==', facilityId);
        
        const existingSnapshot = await transaction.get(existingQuery);
        
        if (!existingSnapshot.empty) {
          throw new Error('User is already a member of this facility');
        }
        
        // Get facility document BEFORE any writes (Firestore transaction rule)
        const facilityRef = db.collection('facilities').doc(facilityId);
        const facilityDoc = await transaction.get(facilityRef);
        
        if (!facilityDoc.exists) {
          throw new Error('Facility not found');
        }
        
        // Create the user-facility relationship
        const relationshipRef = this.collection.doc();
        const relationshipData = {
          userId,
          facilityId,
          role,
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        transaction.set(relationshipRef, relationshipData);
        
        // Update the facility's members array
        const facilityData = facilityDoc.data();
        const members = facilityData.members || [];
        
        if (!members.includes(userId)) {
          members.push(userId);
          transaction.update(facilityRef, { 
            members,
            updatedAt: new Date().toISOString()
          });
        }
        
        return { id: relationshipRef.id, ...relationshipData };
      });
      
      return result;
    } catch (error) {
      if (error.message.includes('already a member')) {
        throw error;
      }
      throw new Error('Failed to add user to facility: ' + error.message);
    }
  }

  // Update user role in facility
  async updateUserRole(relationshipId, role) {
    const validRoles = ['owner', 'manager', 'member', 'guest'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const result = await this.update(relationshipId, { 
      role,
      updatedAt: new Date().toISOString()
    });
    
    // Invalidate cache for the user and facility
    const cacheService = require('../services/cacheService');
    if (result && result.userId && result.facilityId) {
      cacheService.invalidateUserFacilities(result.userId);
      cacheService.invalidateFacilityStats(result.facilityId);
      cacheService.invalidateFacilityMembers(result.facilityId);
    }
    
    return result;
  }

  // Remove user from facility
  async removeUserFromFacility(userId, facilityId) {
    const relationships = await this.findByUserAndFacility(userId, facilityId);
    if (relationships.length === 0) {
      throw new Error('User is not a member of this facility');
    }

    // Delete the user-facility relationship
    await this.delete(relationships[0].id);

    // Also remove the user from the facility's members array
    try {
      await Facility.removeMember(facilityId, userId);
    } catch (facilityError) {
      console.error('Error updating facility members array:', facilityError);
      // Don't fail the operation if facility update fails
    }

    // Invalidate cache for the user and facility
    const cacheService = require('../services/cacheService');
    cacheService.invalidateUserFacilities(userId);
    cacheService.invalidateFacilityStats(facilityId);
    cacheService.invalidateFacilityMembers(facilityId);

    return true;
  }

  // Get facility members with user details
  async getFacilityMembers(facilityId) {
    const relationships = await this.findByFacility(facilityId);
    // In a real implementation, you might want to fetch user details
    // and return combined data
    return relationships;
  }
}

module.exports = new UserFacility();
