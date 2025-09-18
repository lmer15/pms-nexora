const UserFacility = require('../models/UserFacility');
const Facility = require('../models/Facility');

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  'owner': 4,
  'admin': 3,
  'member': 2,
  'guest': 1
};

// Check if user has required role or higher in facility
const checkFacilityRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const facilityId = req.params.facilityId || req.params.id || req.body.facilityId;
      const userId = req.userId;

      if (!facilityId) {
        return res.status(400).json({ message: 'Facility ID is required' });
      }

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user is facility owner first
      const facility = await Facility.findById(facilityId);
      
      if (!facility) {
        return res.status(404).json({ message: 'Facility not found' });
      }

      // If user is the facility owner, they have all permissions
      if (facility.ownerId === userId) {
        req.userRole = 'owner';
        req.facility = facility;
        return next();
      }

      // Check user-facility relationship
      const userFacilityRelation = await UserFacility.findByUserAndFacility(userId, facilityId);
      
      if (!userFacilityRelation || userFacilityRelation.length === 0) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this facility' });
      }

      const userRole = userFacilityRelation[0].role;
      const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          message: `Access denied: ${requiredRole} role or higher required` 
        });
      }

      // Add user role and facility to request for use in controllers
      req.userRole = userRole;
      req.facility = facility;
      req.userFacilityRelation = userFacilityRelation[0];

      next();
    } catch (error) {
      console.error('Error in facility role middleware:', error);
      res.status(500).json({ message: 'Server error checking permissions' });
    }
  };
};

// Check if user can manage members (admin or owner)
const canManageMembers = checkFacilityRole('admin');

// Check if user can manage facility settings (owner only)
const canManageFacility = checkFacilityRole('owner');

// Check if user can view facility (any member)
const canViewFacility = checkFacilityRole('guest');

// Check if user can manage invitations (admin or owner)
const canManageInvitations = checkFacilityRole('admin');

// Check if user can manage share links (admin or owner)
const canManageShareLinks = checkFacilityRole('admin');

// Check if user can approve join requests (admin or owner)
const canManageJoinRequests = checkFacilityRole('admin');

// Middleware to check if user can update member roles
const canUpdateMemberRole = async (req, res, next) => {
  try {
    const { targetUserId, newRole } = req.body;
    const facilityId = req.params.facilityId || req.params.id;
    const currentUserRole = req.userRole;

    if (!targetUserId || !newRole) {
      return res.status(400).json({ message: 'Target user ID and new role are required' });
    }

    // Validate new role
    if (!ROLE_HIERARCHY.hasOwnProperty(newRole)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Get target user's current role
    const targetUserRelation = await UserFacility.findByUserAndFacility(targetUserId, facilityId);
    if (!targetUserRelation || targetUserRelation.length === 0) {
      return res.status(404).json({ message: 'Target user is not a member of this facility' });
    }

    const targetCurrentRole = targetUserRelation[0].role;
    const currentUserRoleLevel = ROLE_HIERARCHY[currentUserRole] || 0;
    const targetCurrentRoleLevel = ROLE_HIERARCHY[targetCurrentRole] || 0;
    const newRoleLevel = ROLE_HIERARCHY[newRole] || 0;

    // Only owners can change owner roles
    if (targetCurrentRole === 'owner' && currentUserRole !== 'owner') {
      return res.status(403).json({ message: 'Only facility owners can modify owner roles' });
    }

    // Users cannot promote others to a role higher than their own
    if (newRoleLevel >= currentUserRoleLevel && currentUserRole !== 'owner') {
      return res.status(403).json({ message: 'Cannot assign a role equal to or higher than your own' });
    }

    // Users cannot modify roles of users with equal or higher roles (except owners)
    if (targetCurrentRoleLevel >= currentUserRoleLevel && currentUserRole !== 'owner') {
      return res.status(403).json({ message: 'Cannot modify roles of users with equal or higher permissions' });
    }

    req.targetUserRelation = targetUserRelation[0];
    next();
  } catch (error) {
    console.error('Error in role update middleware:', error);
    res.status(500).json({ message: 'Server error checking role permissions' });
  }
};

// Middleware to validate role values
const validateRole = (req, res, next) => {
  const { role } = req.body;
  
  if (role && !ROLE_HIERARCHY.hasOwnProperty(role)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }
  
  next();
};

module.exports = {
  checkFacilityRole,
  canManageMembers,
  canManageFacility,
  canViewFacility,
  canManageInvitations,
  canManageShareLinks,
  canManageJoinRequests,
  canUpdateMemberRole,
  validateRole,
  ROLE_HIERARCHY
};
