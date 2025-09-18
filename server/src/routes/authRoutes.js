const express = require('express');
const router = express.Router();
const { firebaseRegister, firebaseGoogleAuth, firebaseVerify, firebaseSync, getProfile, getUserProfiles } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes
router.post('/register', firebaseRegister);
router.post('/firebase/google-auth', firebaseGoogleAuth);
router.post('/verify', firebaseVerify);
router.post('/firebase/sync', firebaseSync);
router.get('/profile', authMiddleware, getProfile);
router.post('/users/profiles', authMiddleware, getUserProfiles);

module.exports = router;
