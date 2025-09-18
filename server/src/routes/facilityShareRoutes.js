const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  searchUsers,
  sendInvitation,
  getFacilityMembers,
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

// User search route (for invitations)
router.get('/search/users', authMiddleware, searchUsers);

// Member management routes
router.get('/:facilityId/members', authMiddleware, getFacilityMembers);
router.put('/:facilityId/members/role', authMiddleware, updateMemberRole);
router.delete('/:facilityId/members', authMiddleware, removeMember);
router.post('/:facilityId/leave', authMiddleware, leaveFacility);

// Invitation routes
router.post('/:facilityId/invitations', authMiddleware, sendInvitation);

// Share link routes
router.post('/:facilityId/share-link', authMiddleware, generateShareLink);
router.get('/:facilityId/share-link', authMiddleware, getShareLink);
router.put('/:facilityId/share-link/role', authMiddleware, updateShareLinkRole);
router.delete('/:facilityId/share-link', authMiddleware, deactivateShareLink);

// Join via share link (direct join for invitations)
router.post('/join/:linkId', authMiddleware, joinViaShareLink);

// Request to join via share link (creates join request)
router.post('/request-join/:linkId', authMiddleware, requestToJoinViaShareLink);

// Invitation acceptance routes
router.get('/invitations/:token', getInvitationDetails);
router.post('/invitations/:token/accept', authMiddleware, acceptInvitation);
router.post('/invitations/:token/reject', rejectInvitation);

// Join request routes
router.get('/:facilityId/join-requests', authMiddleware, getJoinRequests);
router.post('/:facilityId/join-requests/:requestId/approve', authMiddleware, approveJoinRequest);
router.post('/:facilityId/join-requests/:requestId/reject', authMiddleware, rejectJoinRequest);

module.exports = router;
