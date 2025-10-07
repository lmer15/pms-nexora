const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId; // This is now the Firebase UID
    
    // Fetch user information from database for analytics and other controllers that need it
    try {
      const user = await User.findByFirebaseUid(decoded.userId);
      if (user) {
        req.user = {
          id: user.id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'member' // Default role if not set
        };
      } else {
        // If user not found in database, create a minimal user object
        req.user = {
          id: decoded.userId,
          firebaseUid: decoded.userId,
          role: 'member'
        };
      }
    } catch (dbError) {
      console.error('Error fetching user from database:', dbError);
      // Fallback to minimal user object if database query fails
      req.user = {
        id: decoded.userId,
        firebaseUid: decoded.userId,
        role: 'member'
      };
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;