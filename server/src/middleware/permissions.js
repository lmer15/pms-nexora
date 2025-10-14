// Simple permissions middleware
// For now, this allows all authenticated users to perform these actions
// In the future, this can be enhanced with role-based permissions

const checkPermission = (permission) => {
  return (req, res, next) => {
    // For now, just check if user is authenticated
    // The firebaseAuthMiddleware should have already verified authentication
    if (!req.user || !req.user.firebaseUid) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // TODO: Implement proper permission checking based on user roles
    // For now, allow all authenticated users
    console.log(`Permission check: ${permission} for user ${req.user.firebaseUid}`);
    next();
  };
};

module.exports = {
  checkPermission
};
