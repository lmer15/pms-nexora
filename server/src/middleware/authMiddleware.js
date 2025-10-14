const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId; // This is the database user ID from JWT
    
    // Fetch user information from database for analytics and other controllers that need it
    try {
      const user = await User.findById(decoded.userId);
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
        return res.status(404).json({ message: 'User not found in database' });
      }
    } catch (dbError) {
      console.error('AuthMiddleware: Error fetching user from database:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;