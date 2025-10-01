const FirestoreService = require('../services/firestoreService');

class FacilityJoinRequest extends FirestoreService {
  constructor() {
    super('facilityJoinRequests');
  }

  // Create join request
  async createJoinRequest(facilityId, requestingUserId, message = null, shareToken = null) {
    // Check if user already has a pending request
    const existingRequest = await this.findPendingRequest(facilityId, requestingUserId);
    if (existingRequest) {
      throw new Error('You already have a pending join request for this facility');
    }

    const joinRequestData = {
      facilityId,
      requestingUserId,
      message: message ? message.trim() : null,
      shareToken, // Token from share link if applicable
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.create(joinRequestData);
  }

  // Find pending request by user and facility
  async findPendingRequest(facilityId, userId) {
    const requests = await this.query([
      { field: 'facilityId', operator: '==', value: facilityId },
      { field: 'requestingUserId', operator: '==', value: userId },
      { field: 'status', operator: '==', value: 'pending' }
    ]);
    return requests.length > 0 ? requests[0] : null;
  }

  // Get all join requests for a facility
  async findByFacility(facilityId, status = null) {
    const conditions = [
      { field: 'facilityId', operator: '==', value: facilityId }
    ];
    
    if (status) {
      conditions.push({ field: 'status', operator: '==', value: status });
    }

    return this.query(conditions);
  }

  // Get join requests by user
  async findByUser(userId, status = null) {
    const conditions = [
      { field: 'requestingUserId', operator: '==', value: userId }
    ];
    
    if (status) {
      conditions.push({ field: 'status', operator: '==', value: status });
    }

    return this.query(conditions);
  }

  // Approve join request
  async approveJoinRequest(requestId, approvedBy, assignedRole = 'member') {
    const validRoles = ['admin', 'member', 'guest'];
    if (!validRoles.includes(assignedRole)) {
      throw new Error('Invalid role specified');
    }

    const request = await this.findById(requestId);
    if (!request) {
      throw new Error('Join request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Join request is no longer pending');
    }

    await this.update(requestId, {
      status: 'approved',
      approvedBy,
      assignedRole,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return request;
  }

  // Reject join request
  async rejectJoinRequest(requestId, rejectedBy, rejectionReason = null) {
    const request = await this.findById(requestId);
    if (!request) {
      throw new Error('Join request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Join request is no longer pending');
    }

    await this.update(requestId, {
      status: 'rejected',
      rejectedBy,
      rejectionReason: rejectionReason ? rejectionReason.trim() : null,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return request;
  }

  // Cancel join request (by requester)
  async cancelJoinRequest(requestId, cancellingUserId) {
    const request = await this.findById(requestId);
    if (!request) {
      throw new Error('Join request not found');
    }

    if (request.requestingUserId !== cancellingUserId) {
      throw new Error('Only the requester can cancel this join request');
    }

    if (request.status !== 'pending') {
      throw new Error('Join request cannot be cancelled');
    }

    await this.update(requestId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return request;
  }

  // Get join requests with user details (for facility admins)
  async getJoinRequestsWithUserDetails(facilityId, status = 'pending') {
    const requests = await this.findByFacility(facilityId, status);
    
    // In a real implementation, you would join with user data
    // For now, return the requests as-is
    // The controller will handle fetching user details
    return requests;
  }

  // Clean up old processed requests (optional maintenance)
  async cleanupOldRequests(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldRequests = await this.query([
      { field: 'status', operator: 'in', value: ['approved', 'rejected', 'cancelled'] },
      { field: 'updatedAt', operator: '<', value: cutoffDate }
    ]);

    // Optionally delete or archive old requests
    // For now, just return count
    return oldRequests.length;
  }
}

module.exports = new FacilityJoinRequest();
