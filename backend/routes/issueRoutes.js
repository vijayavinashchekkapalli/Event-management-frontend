const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/requireAdmin');
const { cacheResponse } = require('../middleware/cacheMiddleware');
const issueController = require('../controllers/issueController');

// IMPORTANT: Order matters! Specific routes must come before generic :id routes

// Public - create an issue (no auth required)
router.post('/', issueController.createIssue);

// Logged-in user - list own issues (MUST come before generic GET)
router.get('/mine', verifyToken, cacheResponse({ prefix: 'issue:mine', ttl: 30, varyByUser: true, cacheControl: 'private, max-age=30' }), issueController.listUserIssues);

// Admin - get all issues
router.get('/', verifyToken, requireAdmin, cacheResponse({ prefix: 'admin:issues', ttl: 30 }), issueController.listIssues);

// Admin - update issue status (PUT must come before DELETE for same path)
router.put('/:id', verifyToken, requireAdmin, issueController.updateIssue);

// Admin - delete issue
router.delete('/:id', verifyToken, requireAdmin, issueController.deleteIssue);

module.exports = router;
