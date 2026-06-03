const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const { cacheResponse } = require('../middleware/cacheMiddleware');
const feeController = require('../controllers/feeController');

// Public read
router.get('/', cacheResponse({ prefix: 'feeSettings:default', ttl: 120 }), feeController.getFeeSettings);
router.get('/:eventId', cacheResponse({ prefix: 'feeSettings:event', ttl: 120 }), feeController.getFeeSettings);

// Admin update
router.put('/', verifyToken, requireAdmin, feeController.updateFeeSettings);
router.put('/:eventId', verifyToken, requireAdmin, feeController.updateFeeSettings);

module.exports = router;
