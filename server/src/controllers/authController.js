const db = require('../models');
const User = db.User;
const { generateToken } = require('../utils/generateToken');
const { admin } = require('../config/firebase-admin');

exports.firebaseRegister = async (req, res) => {
  try {
    const { idToken, firstName, lastName } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid } = decodedToken;

    // Check if user already exists
    let user = await User.findOne({ where: { email } });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = await User.create({
      email,
      firebaseUid: uid,
      firstName,
      lastName,
      isEmailVerified: false
    });

    // Generate JWT token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Firebase register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.firebaseGoogleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, uid, picture } = decodedToken;

    // Find or create user
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Extract first and last name from Google profile
      const nameParts = name ? name.split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await User.create({
        email,
        firebaseUid: uid,
        firstName,
        lastName,
        isEmailVerified: true, // Google emails are verified
        profilePicture: picture
      });
    } else {
      // Update Firebase UID if not set
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

exports.firebaseVerify = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid } = decodedToken;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is verified in Firebase
    if (!decodedToken.email_verified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    // Update user verification status and Firebase UID
    user.isEmailVerified = true;
    if (!user.firebaseUid) {
      user.firebaseUid = uid;
    }
    await user.save();

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Firebase verify error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

exports.firebaseSync = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid, name, picture, email_verified } = decodedToken;

    // Find user
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create user if doesn't exist
      const nameParts = name ? name.split(' ') : [];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await User.create({
        email,
        firebaseUid: uid,
        firstName,
        lastName,
        isEmailVerified: email_verified || false,
        profilePicture: picture
      });
    } else {
      // Update user data
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
      }
      if (email_verified) {
        user.isEmailVerified = true;
      }
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      message: 'Sync successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Firebase sync error:', error);
    res.status(500).json({ message: 'Server error during sync' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};