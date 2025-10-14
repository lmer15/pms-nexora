const FirestoreService = require('../services/firestoreService');

class Facility extends FirestoreService {
  constructor() {
    super('facilities');
  }

  // Find facilities by owner
  async findByOwner(ownerId) {
    return this.findByField('ownerId', ownerId);
  }

  // Find facilities by member (including owned facilities and UserFacility relationships) with caching
  async findByMember(userId) {
    try {
      const cacheService = require('../services/cacheService');
      
      // Check cache first
      const cachedFacilities = cacheService.getUserFacilities(userId);
      if (cachedFacilities) {
        return cachedFacilities;
      }

      const UserFacility = require('./UserFacility');
      const facilities = [];
      const facilityIds = new Set(); // Use Set to avoid duplicates
      
      // 1. Find facilities where user is the owner
      const ownedFacilities = await this.findByOwner(userId);
      
      ownedFacilities.forEach(facility => {
        facilities.push(facility);
        facilityIds.add(facility.id);
      });
      
      // 2. Find facilities where user is a member (through UserFacility relationships)
      let userFacilities = await UserFacility.findByUser(userId);
      
      // If no relationships found with database user ID, try with Firebase UID
      if (userFacilities.length === 0) {
        // Get the user's Firebase UID from the User model
        const User = require('./User');
        const user = await User.findById(userId);
        if (user && user.firebaseUid) {
          userFacilities = await UserFacility.findByUser(user.firebaseUid);
        }
      }
      
      if (userFacilities.length > 0) {
        // Get facility IDs that user is a member of (excluding already found owned facilities)
        const memberFacilityIds = userFacilities
          .map(uf => uf.facilityId)
          .filter(id => !facilityIds.has(id));
        
        
        // Use batch query for better performance - fetch all facilities at once
        const batchSize = 10; // Firestore 'in' queries are limited to 10 items
        
        for (let i = 0; i < memberFacilityIds.length; i += batchSize) {
          const batch = memberFacilityIds.slice(i, i + batchSize);
          
          try {
            // Use Firestore 'in' query for batch fetching
            const snapshot = await this.collection.where('__name__', 'in', batch.map(id => this.collection.doc(id))).get();
            
            snapshot.forEach(doc => {
              if (doc.exists) {
                const facilityData = { id: doc.id, ...doc.data() };
                facilities.push(facilityData);
                facilityIds.add(facilityData.id);
              }
            });
          } catch (batchError) {
            console.error('Batch query error, falling back to individual lookups:', batchError);
            // Fallback to individual lookups for this batch
            for (const facilityId of batch) {
              try {
                const facility = await this.findById(facilityId);
                if (facility) {
                  facilities.push(facility);
                  facilityIds.add(facility.id);
                }
              } catch (individualError) {
                console.error(`Error fetching individual facility ${facilityId}:`, individualError);
              }
            }
          }
        }
      }
      
      
      // Cache the results
      cacheService.setUserFacilities(userId, facilities);
      
      return facilities;
    } catch (error) {
      console.error('Error finding facilities by member:', error);
      return [];
    }
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
      status: facilityData.status || 'active', // Default to active status
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Ensure location is not included
    delete data.location;

    return this.create(data);
  }
}

module.exports = new Facility();
