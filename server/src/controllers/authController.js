const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { admin } = require('../config/firebase-admin');
const { sendWelcomeEmail } = require('../services/emailService');

exports.firebaseRegister = async (req, res) => {
  try {
    const { idToken, firstName, lastName } = req.body;

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for authentication' });
    }

    // Check if user already exists
    let user = await User.findByEmail(email);

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = await User.createUser({
      email,
      firebaseUid: uid,
      firstName,
      lastName,
      isEmailVerified: false
    });

    // Generate JWT token with database user ID
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

    if (!email) {
      return res.status(400).json({ message: 'Email is required for authentication' });
    }

    // Find or create user
    let user = await User.findByEmail(email);

    if (!user) {
      // Extract first and last name from Google profile
      const nameParts = name ? name.split(' ') : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await User.createUser({
        email,
        firebaseUid: uid,
        firstName,
        lastName,
        isEmailVerified: true, // Google emails are verified
        profilePicture: picture
      });

      // Send welcome email on first login
      try {
          await sendWelcomeEmail(user);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the registration process due to email error
      }
    } else {
      // Update Firebase UID if not set
      if (!user.firebaseUid) {
        await User.update(user.id, { firebaseUid: uid });
        user.firebaseUid = uid; // Update local object for response
      }
    }

    // Generate JWT token with database user ID
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

    if (!email) {
      return res.status(400).json({ message: 'Email is required for authentication' });
    }

    // Find user
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is verified in Firebase
    if (!decodedToken.email_verified) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    // Update user verification status and Firebase UID
    const updateData = { isEmailVerified: true };
    if (!user.firebaseUid) {
      updateData.firebaseUid = uid;
    }
    await User.update(user.id, updateData);

    // Generate JWT token with database user ID
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

    if (!email) {
      return res.status(400).json({ message: 'Email is required for authentication' });
    }

    // Find user
    let user = await User.findByEmail(email);

    if (!user) {
      // Create user if doesn't exist
      const nameParts = name ? name.split(' ') : [];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      user = await User.createUser({
        email,
        firebaseUid: uid,
        firstName,
        lastName,
        isEmailVerified: email_verified || false,
        profilePicture: picture
      });
    } else {
      // Update user data
      const updateData = {};
      if (!user.firebaseUid) {
        updateData.firebaseUid = uid;
      }
      if (email_verified && !user.isEmailVerified) {
        updateData.isEmailVerified = true;
      }
      if (picture && !user.profilePicture) {
        updateData.profilePicture = picture;
      }
      if (Object.keys(updateData).length > 0) {
        user = await User.update(user.id, updateData);
      }
    }

    // Generate JWT token with database user ID
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
    const user = await User.getProfile(req.userId);

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

exports.getUserProfiles = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds must be a non-empty array' });
    }

    // Use the new Firestore-based method
    const profiles = await User.getProfilesByIds(userIds);
    res.json(profiles);
  } catch (error) {
    console.error('Get user profiles error:', error);
    res.status(500).json({
      message: 'Server error fetching user profiles',
      error: error.message 
    });
  }
};

// Safe account type checking - READ ONLY operation
exports.checkAccountType = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        exists: false,
        authMethods: [],
        canLink: false,
        message: 'Email is required'
      });
    }

    // Check if user exists in our database
    const user = await User.findByEmail(email);
    
    // Check Firebase auth providers for this user
    let authMethods = [];
    let firebaseUser = null;
    
    try {
      // First try to get user by email from Firebase
      firebaseUser = await admin.auth().getUserByEmail(email);
      
      // Check what providers are linked
      if (firebaseUser.providerData) {
        firebaseUser.providerData.forEach(provider => {
          if (provider.providerId === 'google.com') {
            authMethods.push('google');
          } else if (provider.providerId === 'password') {
            authMethods.push('email_password');
          }
        });
      }
    } catch (firebaseError) {
      console.log('Firebase user check failed:', firebaseError.message);
      
      // If user not found in Firebase, check our database
      if (firebaseError.code === 'auth/user-not-found') {
        if (!user) {
          return res.json({
            exists: false,
            authMethods: [],
            canLink: false,
            message: 'No account found with this email'
          });
        }
        // If user exists in our database but not in Firebase, assume email/password
        authMethods = ['email_password'];
      } else {
        // Other Firebase errors
        authMethods = user ? ['email_password'] : [];
      }
    }
    
    // If no user found in either place
    if (!user && !firebaseUser) {
      return res.json({
        exists: false,
        authMethods: [],
        canLink: false,
        message: 'No account found with this email'
      });
    }

    // Determine if linking is possible
    const canLink = authMethods.length === 1; // Can link if only one method exists

    res.json({
      exists: true,
      authMethods,
      canLink,
      message: `Account found with ${authMethods.join(' and ')} authentication`
    });

  } catch (error) {
    console.error('Error checking account type:', error);
    res.status(500).json({
      exists: false,
      authMethods: [],
      canLink: false,
      message: 'Error checking account type'
    });
  }
};

// Link email/password to existing Google account
exports.linkEmailPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id; // From auth middleware
    const userEmail = req.user.email;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Link email/password to Firebase account
    try {
      const firebaseUser = await admin.auth().getUser(user.firebaseUid);
      
      // Check if user already has email/password provider
      const hasEmailPassword = firebaseUser.providerData.some(provider => 
        provider.providerId === 'password'
      );
      
      if (hasEmailPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email/password is already linked to this account'
        });
      }

      // Update Firebase user with password (this adds email/password provider)
      await admin.auth().updateUser(user.firebaseUid, {
        password: password
      });

      // Update user record to track auth methods
      await User.updateAuthMethods(userId, ['google', 'email_password']);

      res.json({
        success: true,
        message: 'Email/password successfully linked to your account',
        authMethods: ['google', 'email_password']
      });

    } catch (firebaseError) {
      console.error('Firebase linking error:', firebaseError);
      
      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/email-already-exists') {
        res.status(400).json({
          success: false,
          message: 'This email is already associated with another account'
        });
      } else if (firebaseError.code === 'auth/weak-password') {
        res.status(400).json({
          success: false,
          message: 'Password is too weak. Please choose a stronger password.'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to link email/password. Please try again.'
        });
      }
    }

  } catch (error) {
    console.error('Link email/password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account linking'
    });
  }
};

// Link Google account to existing email/password account
exports.linkGoogleAccount = async (req, res) => {
  try {
    const { googleIdToken } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!googleIdToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    // Verify Google ID token
    const decodedToken = await admin.auth().verifyIdToken(googleIdToken);
    const googleEmail = decodedToken.email;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email matches
    if (user.email !== googleEmail) {
      return res.status(400).json({
        success: false,
        message: 'Google account email does not match your account email'
      });
    }

    // Link Google provider to Firebase account
    try {
      const firebaseUser = await admin.auth().getUser(user.firebaseUid);
      
      // Update user record to track auth methods
      await User.updateAuthMethods(userId, ['email_password', 'google']);

      res.json({
        success: true,
        message: 'Google account successfully linked to your account',
        authMethods: ['email_password', 'google']
      });

    } catch (firebaseError) {
      console.error('Firebase Google linking error:', firebaseError);
      res.status(500).json({
        success: false,
        message: 'Failed to link Google account. Please try again.'
      });
    }

  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google account linking'
    });
  }
};