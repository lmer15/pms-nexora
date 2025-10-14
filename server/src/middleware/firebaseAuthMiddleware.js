const { admin } = require('../config/firebase-admin');
const User = require('../models/User');

const firebaseAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for authentication' });
    }

    // Find user in database
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'member'
    };
    
    // Also set req.userId for compatibility with other middleware
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
};

module.exports = firebaseAuthMiddleware;
