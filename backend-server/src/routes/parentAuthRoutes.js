const express = require('express');
const router = express.Router();
const parentAuthService = require('../services/parentAuthService');
const { loginLimiter } = require('../middleware/rateLimiter');
const { requireParentAuth } = require('../middleware/authMiddleware');

// Parent Login
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  const result = await parentAuthService.login(username, password);
  if (!result.success) {
    return res.status(401).json(result);
  }
  res.json(result);
});

// Parent Logout
router.post('/logout', requireParentAuth, (req, res) => {
  const result = parentAuthService.logout(req.parentToken);
  res.json(result);
});

// Parent Session Status Check
router.get('/session', requireParentAuth, (req, res) => {
  res.json({ success: true, valid: true });
});

module.exports = router;
