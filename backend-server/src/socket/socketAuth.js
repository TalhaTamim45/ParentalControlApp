const parentAuthService = require('../services/parentAuthService');
const deviceService = require('../services/deviceService');
const presenceService = require('../services/presenceService');

function socketAuthenticate(socket, next) {
  const auth = socket.handshake.auth || {};
  const token = auth.token || socket.handshake.query?.token;
  const role = auth.role || socket.handshake.query?.role;

  if (role === 'parent') {
    if (!token || !parentAuthService.validateParentToken(token)) {
      return next(new Error('Unauthorized parent socket connection'));
    }
    socket.role = 'parent';
    return next();
  }

  if (role === 'child' || (!role && token)) {
    const device = deviceService.authenticateDeviceToken(token);
    if (!device) {
      return next(new Error('Unauthorized child device socket connection'));
    }
    socket.role = 'child';
    socket.device = device;
    return next();
  }

  return next(new Error('Authentication role or token missing'));
}

module.exports = {
  socketAuthenticate
};
