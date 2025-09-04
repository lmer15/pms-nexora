const FirestoreService = require('../services/firestoreService');

class Facility extends FirestoreService {
  constructor() {
    super('facilities');
  }

  // Find facilities by owner
  async findByOwner(ownerId) {
    return this.findByField('ownerId', ownerId);
  }

  // Find facilities by member
  async findByMember(userId) {
    return this.query([
      { field: 'members', operator: 'array-contains', value: userId }
    ]);
  }

  // Add member to facility
  async addMember(facilityId, userId) {
    const facility = await this.findById(facilityId);
    if (!facility) {
      throw new Error('Facility not found');
    }

    const members = facility.members || [];
    if (!members.includes(userId)) {
      members.push(userId);
      return this.update(facilityId, { members });
    }

    return facility;
  }

  // Remove member from facility
  async removeMember(facilityId, userId) {
    const facility = await this.findById(facilityId);
    if (!facility) {
      throw new Error('Facility not found');
    }

    const members = facility.members || [];
    const updatedMembers = members.filter(id => id !== userId);
    return this.update(facilityId, { members: updatedMembers });
  }

  // Create facility with owner
  async createFacility(facilityData, ownerId) {
    const data = {
      ...facilityData,
      ownerId,
      members: [ownerId], // Owner is automatically a member
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(data);
  }
}

module.exports = new Facility();
