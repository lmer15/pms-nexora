const express = require('express');
const router = express.Router();
const { firebaseRegister, firebaseGoogleAuth, firebaseVerify, firebaseSync, getProfile, getUserProfiles, checkAccountType, linkEmailPassword, linkGoogleAccount } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// Routes
router.post('/register', firebaseRegister);
router.post('/firebase/google-auth', firebaseGoogleAuth);
router.post('/verify', firebaseVerify);
router.post('/firebase/sync', firebaseSync);
router.get('/profile', authMiddleware, getProfile);
router.post('/users/profiles', authMiddleware, getUserProfiles);
router.post('/check-account-type', checkAccountType);
router.post('/link-email-password', firebaseAuthMiddleware, linkEmailPassword);
router.post('/link-google-account', firebaseAuthMiddleware, linkGoogleAccount);

module.exports = router;
