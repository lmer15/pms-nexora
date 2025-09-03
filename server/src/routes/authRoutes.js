const express = require('express');
const router = express.Router();

// Temporary mock endpoints - we'll add database later
router.post('/firebase/sync', (req, res) => {
  console.log('Firebase sync request received');
  res.json({
    message: 'Sync successful',
    token: 'mock-jwt-token-for-now',
    user: {
      id: 1,
      email: req.body.email || 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isEmailVerified: true
    }
  });
});

router.post('/firebase/google', (req, res) => {
  console.log('Google auth request received');
  res.json({
    message: 'Google login successful',
    token: 'mock-jwt-token-for-now',
    user: {
      id: 1,
      email: 'googleuser@example.com',
      firstName: 'Google',
      lastName: 'User',
      isEmailVerified: true
    }
  });
});

router.post('/firebase/verify', (req, res) => {
  console.log('Token verify request received');
  res.json({
    message: 'Token verified',
    token: 'mock-jwt-token-for-now',
    user: {
      id: 1,
      email: 'verified@example.com',
      firstName: 'Verified',
      lastName: 'User',
      isEmailVerified: true
    }
  });
});

module.exports = router;