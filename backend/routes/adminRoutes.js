const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const { cacheResponse } = require('../middleware/cacheMiddleware');
const adminController = require('../controllers/adminController');
const issueController = require('../controllers/issueController');

// Legacy/frontend-compatible endpoints
router.post('/login', adminController.login);

router.get('/students', protectAdmin, cacheResponse({ prefix: 'admin:registrations', ttl: 60 }), adminController.listRegistrations);
router.get('/issues', protectAdmin, cacheResponse({ prefix: 'admin:issues', ttl: 30 }), issueController.listIssues);
router.put('/issues/:id', protectAdmin, issueController.updateIssue);
router.delete('/issues/:id', protectAdmin, issueController.deleteIssue);
router.get('/download', protectAdmin, adminController.exportRegistrations);

router.get('/dashboard', protectAdmin, cacheResponse({ prefix: 'admin:dashboard', ttl: 60 }), adminController.dashboard);
router.get('/registrations', protectAdmin, cacheResponse({ prefix: 'admin:registrations', ttl: 60 }), adminController.listRegistrations);
router.get('/registrations/export', protectAdmin, adminController.exportRegistrations);
router.get('/registration-link', protectAdmin, cacheResponse({ prefix: 'admin:registration-link', ttl: 120 }), adminController.getRegistrationLink);
router.post('/registration-link', protectAdmin, adminController.setRegistrationLink);
router.get('/registrations/:id/word', protectAdmin, adminController.downloadRegistrationWord);
router.get('/registrations/:id/excel', protectAdmin, adminController.downloadRegistrationExcel);
router.put('/registrations/:id', protectAdmin, adminController.updateRegistration);
router.delete('/registrations/:id', protectAdmin, adminController.deleteRegistration);
router.put('/approve/:id', protectAdmin, adminController.approveRegistration);
router.put('/reject/:id', protectAdmin, adminController.rejectRegistration);

module.exports = router;
