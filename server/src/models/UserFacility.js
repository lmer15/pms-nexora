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

  // Add user to facility with role
  async addUserToFacility(userId, facilityId, role = 'member') {
    const existing = await this.findByUserAndFacility(userId, facilityId);
    if (existing.length > 0) {
      throw new Error('User is already a member of this facility');
    }

    const data = {
      userId,
      facilityId,
      role,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the user-facility relationship
    const relationship = await this.create(data);

    // Also add the user to the facility's members array
    try {
      await Facility.addMember(facilityId, userId);
    } catch (facilityError) {
      console.error('Error updating facility members array:', facilityError);
      // Don't fail the operation if facility update fails
    }

    return relationship;
  }

  // Update user role in facility
  async updateUserRole(relationshipId, role) {
    const validRoles = ['owner', 'admin', 'member'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    return this.update(relationshipId, { role });
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
