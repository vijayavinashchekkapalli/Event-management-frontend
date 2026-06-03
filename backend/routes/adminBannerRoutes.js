const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const upload = require('../middleware/bannerUpload');
const { cacheResponse } = require('../middleware/cacheMiddleware');
const bannerController = require('../controllers/bannerController');

// In development allow bypassing auth for easier local testing. In production
// the routes remain protected by `verifyToken` + `requireAdmin`.
const devAuth = process.env.NODE_ENV === 'production' ? [verifyToken, requireAdmin] : [];

router.get('/', ...devAuth, cacheResponse({ prefix: 'admin:banners', ttl: 60 }), bannerController.getAdminBanners);
// accept both main banner image and optional upiImage
router.post('/', ...devAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upiImage', maxCount: 1 }]), bannerController.createBanner);
router.put('/:id', ...devAuth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upiImage', maxCount: 1 }]), bannerController.updateBanner);
router.delete('/:id', ...devAuth, bannerController.deleteBanner);

module.exports = router;
