const express = require('express');
const router = express.Router();
const { cacheResponse } = require('../middleware/cacheMiddleware');
const {
  signup,
  login,
  forgotUsername,
  forgotPassword,
  resetPassword,
  validateResetToken,
  testMail,
  getMyProfile,
  updateMyProfile,
  changeMyPassword
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Auth endpoints
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', verifyToken, cacheResponse({ prefix: 'user:me', ttl: 60, varyByUser: true, cacheControl: 'private, max-age=60' }), getMyProfile);
router.put('/me', verifyToken, updateMyProfile);
router.put('/change-password', verifyToken, changeMyPassword);

// Forgot/Reset endpoints
router.post('/forgot-username', forgotUsername);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.get('/test-mail', testMail);

module.exports = router;
