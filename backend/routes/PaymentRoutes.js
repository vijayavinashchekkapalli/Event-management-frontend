const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const upload = require('../middleware/bannerUpload');
const { cacheResponse } = require('../middleware/cacheMiddleware');
const paymentController = require('../controllers/paymentController');

router.get('/settings', cacheResponse({ prefix: 'payment:settings', ttl: 120 }), paymentController.getPaymentSettings);
router.put('/settings', verifyToken, requireAdmin, upload.single('upiImage'), paymentController.updatePaymentSettings);
router.post('/upi', verifyToken, upload.single('paymentScreenshot'), paymentController.submitUpiPayment);
router.post('/submit-upi-payment', verifyToken, upload.single('paymentScreenshot'), paymentController.submitUpiPayment);
router.get('/status/:id?', verifyToken, cacheResponse({ prefix: 'payment:status', ttl: 30, varyByUser: true, cacheControl: 'private, max-age=30' }), paymentController.getPaymentVerificationStatus);
router.patch('/:id/review', verifyToken, requireAdmin, paymentController.reviewPayment);

module.exports = router;