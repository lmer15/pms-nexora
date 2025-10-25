const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const firebaseAuthMiddleware = require('../middleware/firebaseAuthMiddleware');

// All routes require Firebase authentication
router.use(firebaseAuthMiddleware);

// Get user settings
router.get('/', settingsController.getSettings);

// Update all user settings
router.put('/', settingsController.updateSettings);

// Update specific settings section
router.put('/section/:section', settingsController.updateSection);

// Update user profile (special endpoint)
router.put('/profile', settingsController.updateProfile);

// Upload profile image
router.post('/profile/image', settingsController.uploadProfileImage);

// Change password
router.put('/password', settingsController.changePassword);

// Toggle two-factor authentication
router.put('/two-factor', settingsController.toggleTwoFactor);

// Reset settings to default
router.post('/reset', settingsController.resetSettings);

// Export user data (GDPR compliance)
router.get('/export', settingsController.exportUserData);

// Delete user account
router.delete('/account', settingsController.deleteAccount);

module.exports = router;
