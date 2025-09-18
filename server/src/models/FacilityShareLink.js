const FirestoreService = require('../services/firestoreService');
const crypto = require('crypto');

class FacilityShareLink extends FirestoreService {
  constructor() {
    super('facilityShareLinks');
  }

  // Create shareable link
  async createShareLink(facilityId, creatorUserId, role = 'member', expirationDays = 7) {
    const validRoles = ['admin', 'member', 'guest'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    // Generate secure share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const linkId = crypto.randomBytes(16).toString('hex');
    
    // Set default expiration to 7 days if not specified
    let expiresAt = null;
    if (expirationDays !== null) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
    }

    const shareLinkData = {
      facilityId,
      creatorUserId,
      linkId,
      shareToken,
      role,
      isActive: true,
      expiresAt,
      usageCount: 0,
      maxUsage: null, // null means unlimited
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.create(shareLinkData);
  }

  // Find active share link by facility
  async findActiveLinkByFacility(facilityId) {
    const links = await this.query([
      { field: 'facilityId', operator: '==', value: facilityId },
      { field: 'isActive', operator: '==', value: true }
    ]);
    
    // Filter out expired links
    const now = new Date();
    const activeLinks = links.filter(link => 
      !link.expiresAt || link.expiresAt > now
    );

    return activeLinks.length > 0 ? activeLinks[0] : null;
  }

  // Find share link by token
  async findByToken(shareToken) {
    const links = await this.query([
      { field: 'shareToken', operator: '==', value: shareToken },
      { field: 'isActive', operator: '==', value: true }
    ]);
    return links.length > 0 ? links[0] : null;
  }

  // Find share link by linkId
  async findByLinkId(linkId) {
    const links = await this.query([
      { field: 'linkId', operator: '==', value: linkId },
      { field: 'isActive', operator: '==', value: true }
    ]);
    return links.length > 0 ? links[0] : null;
  }

  // Use share link (increment usage count)
  async useShareLink(shareLinkId) {
    const shareLink = await this.findById(shareLinkId);
    if (!shareLink) {
      throw new Error('Share link not found');
    }

    if (!shareLink.isActive) {
      throw new Error('Share link is no longer active');
    }

    // Check expiration
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      await this.update(shareLinkId, { isActive: false, updatedAt: new Date() });
      throw new Error('Share link has expired');
    }

    // Check usage limit
    if (shareLink.maxUsage && shareLink.usageCount >= shareLink.maxUsage) {
      await this.update(shareLinkId, { isActive: false, updatedAt: new Date() });
      throw new Error('Share link usage limit exceeded');
    }

    // Increment usage count
    await this.update(shareLinkId, {
      usageCount: shareLink.usageCount + 1,
      lastUsedAt: new Date(),
      updatedAt: new Date()
    });

    return shareLink;
  }

  // Deactivate share link
  async deactivateShareLink(shareLinkId, deactivatedBy) {
    const shareLink = await this.findById(shareLinkId);
    if (!shareLink) {
      throw new Error('Share link not found');
    }

    await this.update(shareLinkId, {
      isActive: false,
      deactivatedBy,
      deactivatedAt: new Date(),
      updatedAt: new Date()
    });

    return shareLink;
  }

  // Update share link role
  async updateShareLinkRole(shareLinkId, newRole, updatedBy) {
    const validRoles = ['admin', 'member', 'guest'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role specified');
    }

    const shareLink = await this.findById(shareLinkId);
    if (!shareLink) {
      throw new Error('Share link not found');
    }

    if (!shareLink.isActive) {
      throw new Error('Cannot update inactive share link');
    }

    await this.update(shareLinkId, {
      role: newRole,
      updatedBy,
      updatedAt: new Date()
    });

    return shareLink;
  }

  // Get all share links for a facility
  async findByFacility(facilityId, includeInactive = false) {
    const conditions = [
      { field: 'facilityId', operator: '==', value: facilityId }
    ];

    if (!includeInactive) {
      conditions.push({ field: 'isActive', operator: '==', value: true });
    }

    return this.query(conditions);
  }

  // Clean up expired share links
  async cleanupExpiredLinks() {
    const now = new Date();
    const expiredLinks = await this.query([
      { field: 'isActive', operator: '==', value: true },
      { field: 'expiresAt', operator: '<', value: now }
    ]);

    const updatePromises = expiredLinks.map(link =>
      this.update(link.id, {
        isActive: false,
        expiredAt: now,
        updatedAt: now
      })
    );

    await Promise.all(updatePromises);
    return expiredLinks.length;
  }

  // Generate share URL
  generateShareUrl(linkId, baseUrl = process.env.CLIENT_URL || 'http://localhost:5173') {
    return `${baseUrl}/join-facility/${linkId}`;
  }
}

module.exports = new FacilityShareLink();
