const parentAuthService = require('../services/parentAuthService');
const deviceService = require('../services/deviceService');

function extractToken(req, headerName = 'x-parent-token') {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers[headerName]) {
    return String(req.headers[headerName]).trim();
  }
  return null;
}

function requireParentAuth(req, res, next) {
  const token = extractToken(req, 'x-parent-token');
  if (!token || !parentAuthService.validateParentToken(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized parent access' });
  }
  req.parentToken = token;
  next();
}

async function requireDeviceAuth(req, res, next) {
  const token = extractToken(req, 'x-device-token');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication token missing' });
  }

  const device = await deviceService.authenticateDeviceToken(token);
  if (!device) {
    return res.status(401).json({ success: false, error: 'Invalid or revoked device token' });
  }

  req.device = device;
  next();
}

module.exports = {
  requireParentAuth,
  requireDeviceAuth
};
