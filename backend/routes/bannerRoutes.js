const express = require('express');
const router = express.Router();
const { cacheResponse } = require('../middleware/cacheMiddleware');
const bannerController = require('../controllers/bannerController');

router.get('/', cacheResponse({ prefix: 'banner:active-list', ttl: 300 }), bannerController.getActiveBanners);

router.get('/active', cacheResponse({ prefix: 'banner:active-config', ttl: 300 }), bannerController.getActiveBannerConfig);

router.get('/whatsapp-group-link', cacheResponse({ prefix: 'banner:whatsapp-link', ttl: 300 }), bannerController.getWhatsAppGroupLink);

module.exports = router;
