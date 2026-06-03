const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { cacheResponse } = require('../middleware/cacheMiddleware');
const { registerTeam, listMyRegistrations } = require('../controllers/teamController');

// Supports POST /api/register when mounted at /api/register
router.post("/", verifyToken, registerTeam);
// Supports POST /api/teams/register (and /api/register/register legacy)
router.post("/register", verifyToken, registerTeam);
router.get("/mine", verifyToken, cacheResponse({ prefix: 'team:mine', ttl: 30, varyByUser: true, cacheControl: 'private, max-age=30' }), listMyRegistrations);

module.exports = router;