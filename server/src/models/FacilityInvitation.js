const FirestoreService = require('../services/firestoreService');
const crypto = require('crypto');

class FacilityInvitation extends FirestoreService {
  constructor() {
    super('facilityInvitations');
  }

  // Create invitation with secure token
  async createInvitation(facilityId, inviterUserId, inviteeEmail, role = 'member') {
    const validRoles = ['admin', 'member', 'guest'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    // Check if invitation already exists and is pending
    const existingInvitation = await this.findPendingInvitation(facilityId, inviteeEmail);
    if (existingInvitation) {
      throw new Error('Invitation already sent to this email');
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitationData = {
      facilityId,
      inviterUserId,
      inviteeEmail: inviteeEmail.toLowerCase().trim(),
      role,
      invitationToken,
      status: 'pending', // pending, accepted, rejected, expired
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.create(invitationData);
  }

  // Find pending invitation by facility and email
  async findPendingInvitation(facilityId, email) {
    const invitations = await this.query([
      { field: 'facilityId', operator: '==', value: facilityId },
      { field: 'inviteeEmail', operator: '==', value: email.toLowerCase().trim() },
      { field: 'status', operator: '==', value: 'pending' }
    ]);
    return invitations.length > 0 ? invitations[0] : null;
  }

  // Find invitation by token
  async findByToken(token) {
    const invitations = await this.query([
      { field: 'invitationToken', operator: '==', value: token }
    ]);
    return invitations.length > 0 ? invitations[0] : null;
  }

  // Find pending invitation by token (for acceptance)
  async findPendingByToken(token) {
    const invitations = await this.query([
      { field: 'invitationToken', operator: '==', value: token },
      { field: 'status', operator: '==', value: 'pending' }
    ]);
    return invitations.length > 0 ? invitations[0] : null;
  }

  // Get all invitations for a facility
  async findByFacility(facilityId, status = null) {
    const conditions = [
      { field: 'facilityId', operator: '==', value: facilityId }
    ];
    
    if (status) {
      conditions.push({ field: 'status', operator: '==', value: status });
    }

    return this.query(conditions);
  }

  // Accept invitation by token
  async acceptInvitation(token, acceptingUserId) {
    const invitation = await this.findByToken(token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      await this.update(invitation.id, { status: 'expired', updatedAt: new Date() });
      throw new Error('Invitation has expired');
    }

    // Update invitation status
    await this.update(invitation.id, {
      status: 'accepted',
      acceptedBy: acceptingUserId,
      acceptedAt: new Date(),
      updatedAt: new Date()
    });

    return invitation;
  }

  // Reject invitation
  async rejectInvitation(invitationId) {
    const invitation = await this.findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    await this.update(invitationId, {
      status: 'rejected',
      rejectedAt: new Date(),
      updatedAt: new Date()
    });

    return invitation;
  }

  // Cancel invitation (by inviter)
  async cancelInvitation(invitationId, cancellingUserId) {
    const invitation = await this.findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.inviterUserId !== cancellingUserId) {
      throw new Error('Only the inviter can cancel this invitation');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation cannot be cancelled');
    }

    await this.update(invitationId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date()
    });

    return invitation;
  }

  // Clean up expired invitations
  async cleanupExpiredInvitations() {
    const now = new Date();
    const expiredInvitations = await this.query([
      { field: 'status', operator: '==', value: 'pending' },
      { field: 'expiresAt', operator: '<', value: now }
    ]);

    const updatePromises = expiredInvitations.map(invitation =>
      this.update(invitation.id, {
        status: 'expired',
        updatedAt: now
      })
    );

    await Promise.all(updatePromises);
    return expiredInvitations.length;
  }
}

module.exports = new FacilityInvitation();
