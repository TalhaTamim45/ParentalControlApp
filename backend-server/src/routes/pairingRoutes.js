const express = require('express');
const router = express.Router();
const pairingService = require('../services/pairingService');
const deviceService = require('../services/deviceService');
const { requireParentAuth } = require('../middleware/authMiddleware');
const { generateLimiter, validateLimiter } = require('../middleware/rateLimiter');

// Generate Pairing Code (Parent authenticated only)
router.post('/generate', requireParentAuth, generateLimiter, (req, res) => {
  const result = pairingService.createPairingCode();
  res.json({
    success: true,
    code: result.code,
    expiresAt: result.expiresAt
  });
});

// Validate Pairing Code & Register Device Identity (Child application)
router.post('/validate', validateLimiter, (req, res) => {
  const { code, deviceName } = req.body || {};

  if (!code || String(code).trim().length !== 6) {
    return res.status(400).json({ success: false, error: 'Six-digit pairing code is required' });
  }

  const validation = pairingService.validateAndConsumePairingCode(code);
  if (!validation.valid) {
    return res.status(400).json({ success: false, error: validation.error });
  }

  const registration = deviceService.registerDevice(deviceName);

  // Notify active parent sockets if io is attached
  if (req.io) {
    req.io.to('parent_room').emit('device_registered', {
      id: registration.deviceId,
      name: registration.name,
      online: true,
      pairedAt: Date.now()
    });
  }

  res.json({
    success: true,
    deviceId: registration.deviceId,
    authToken: registration.rawToken,
    name: registration.name
  });
});

module.exports = router;
