const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  canViewFacility,
  canManageMembers,
  canManageFacility,
  canManageInvitations,
  canManageShareLinks,
  canManageJoinRequests,
  canUpdateMemberRole,
  validateRole
} = require('../middleware/facilityRoleMiddleware');
const {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  // Sharing functionality
  searchUsers,
  sendInvitation,
  getFacilityMembers,
  getFacilityStats,
  updateMemberRole,
  removeMember,
  generateShareLink,
  getShareLink,
  updateShareLinkRole,
  deactivateShareLink,
  joinViaShareLink,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  leaveFacility
} = require('../controllers/facilityController');

// Basic facility routes
router.get('/', authMiddleware, getFacilities);
router.get('/:id', authMiddleware, getFacilityById);
router.post('/', authMiddleware, createFacility);
router.put('/:id', authMiddleware, updateFacility);
router.delete('/:id', authMiddleware, deleteFacility);

// ============ FACILITY SHARING ROUTES ============

// User search route (for invitations)
router.get('/search/users', authMiddleware, searchUsers);

// Member management routes
router.get('/:facilityId/members', authMiddleware, canViewFacility, getFacilityMembers);
router.get('/:facilityId/stats', authMiddleware, canViewFacility, getFacilityStats);
router.put('/:facilityId/members/role', authMiddleware, canManageMembers, validateRole, canUpdateMemberRole, updateMemberRole);
router.delete('/:facilityId/members', authMiddleware, canManageMembers, removeMember);
router.post('/:facilityId/leave', authMiddleware, canViewFacility, leaveFacility);

// Invitation routes
router.post('/:facilityId/invitations', authMiddleware, canManageInvitations, validateRole, sendInvitation);

// Share link routes
router.post('/:facilityId/share-link', authMiddleware, canManageShareLinks, validateRole, generateShareLink);
router.get('/:facilityId/share-link', authMiddleware, canManageShareLinks, getShareLink);
router.put('/:facilityId/share-link/role', authMiddleware, canManageShareLinks, validateRole, updateShareLinkRole);
router.delete('/:facilityId/share-link', authMiddleware, canManageShareLinks, deactivateShareLink);

// Join via share link (public route with auth)
router.post('/join/:linkId', authMiddleware, joinViaShareLink);

// Join request routes
router.get('/:facilityId/join-requests', authMiddleware, canManageJoinRequests, getJoinRequests);
router.post('/join-requests/:requestId/approve', authMiddleware, canManageJoinRequests, validateRole, approveJoinRequest);
router.post('/join-requests/:requestId/reject', authMiddleware, canManageJoinRequests, rejectJoinRequest);

module.exports = router;
