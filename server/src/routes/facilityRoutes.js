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
  getFacilityWithData,
  createFacility,
  updateFacility,
  deleteFacility,
  // Sharing functionality
  searchUsers,
  sendInvitation,
  getFacilityMembers,
  getUserRole,
  getFacilityStats,
  getFacilityTags,
  updateMemberRole,
  removeMember,
  generateShareLink,
  getShareLink,
  updateShareLinkRole,
  deactivateShareLink,
  joinViaShareLink,
  requestToJoinViaShareLink,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  leaveFacility,
  getInvitationDetails,
  acceptInvitation,
  rejectInvitation
} = require('../controllers/facilityController');

// ============ FACILITY SHARING ROUTES ============

// Invitation routes (must come before /:id routes to avoid conflicts)
router.get('/invitations/:token', getInvitationDetails);
router.post('/invitations/:token/accept', authMiddleware, acceptInvitation);
router.post('/invitations/:token/reject', authMiddleware, rejectInvitation);

// User search route (for invitations)
router.get('/search/users', authMiddleware, searchUsers);

// Basic facility routes
router.get('/', authMiddleware, getFacilities);
router.get('/:id', authMiddleware, getFacilityById);
router.get('/:id/data', authMiddleware, getFacilityWithData); // Optimized endpoint
router.post('/', authMiddleware, createFacility);
router.put('/:id', authMiddleware, updateFacility);
router.delete('/:id', authMiddleware, deleteFacility);

// Member management routes
router.get('/:facilityId/members', authMiddleware, canViewFacility, getFacilityMembers);
router.get('/:facilityId/user-role', authMiddleware, getUserRole);
router.get('/:facilityId/stats', authMiddleware, canViewFacility, getFacilityStats);
router.get('/:facilityId/tags', authMiddleware, canViewFacility, getFacilityTags);
// Test route to verify routing is working
router.get('/:facilityId/test-route', (req, res) => {
  res.json({ message: 'Test route is working', facilityId: req.params.facilityId });
});

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
router.post('/:facilityId/join-requests/:requestId/approve', authMiddleware, canManageJoinRequests, validateRole, approveJoinRequest);
router.post('/:facilityId/join-requests/:requestId/reject', authMiddleware, canManageJoinRequests, rejectJoinRequest);

// Request to join via share link (creates join request)
router.post('/request-join/:linkId', authMiddleware, requestToJoinViaShareLink);

module.exports = router;
