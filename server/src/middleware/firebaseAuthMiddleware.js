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
    console.log('Looking for user with email:', email);
    const user = await User.findByEmail(email);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found in database for email:', email);
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
    
    console.log('User info added to request:', {
      id: req.user.id,
      firebaseUid: req.user.firebaseUid,
      email: req.user.email
    });
    
    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
};

module.exports = firebaseAuthMiddleware;
