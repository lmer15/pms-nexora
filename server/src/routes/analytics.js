const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const facilityRoleMiddleware = require('../middleware/facilityRoleMiddleware');

// Health check endpoint
router.get('/health', analyticsController.healthCheck);

// Global analytics - accessible to all authenticated users
router.get('/global', authMiddleware, analyticsController.getGlobalAnalytics);

// Facility analytics - requires facility access
router.get('/facility/:facilityId', 
  authMiddleware, 
  facilityRoleMiddleware.requireFacilityAccess,
  analyticsController.getFacilityAnalytics
);

// Member analytics - requires member access or facility management
router.get('/member/:memberId', 
  authMiddleware, 
  analyticsController.getMemberAnalytics
);

// Export endpoints
router.get('/export/global', authMiddleware, analyticsController.exportGlobalAnalytics);
router.get('/export/facility/:facilityId', 
  authMiddleware, 
  facilityRoleMiddleware.requireFacilityAccess,
  analyticsController.exportFacilityAnalytics
);
router.get('/export/member/:memberId', 
  authMiddleware, 
  analyticsController.exportMemberAnalytics
);

module.exports = router;
