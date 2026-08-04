const express = require('express');
const router = express.Router();
const deviceService = require('../services/deviceService');
const presenceService = require('../services/presenceService');
const { requireParentAuth, requireDeviceAuth } = require('../middleware/authMiddleware');

// Get Real Registered Devices (Parent Authenticated)
router.get('/', requireParentAuth, (req, res) => {
  const rawDevices = deviceService.getAllRegisteredDevices();
  const devices = rawDevices.map(d => presenceService.formatDeviceWithPresence(d));
  res.json({ success: true, devices });
});

// Device Heartbeat (Child Device Authenticated)
router.post('/heartbeat', requireDeviceAuth, (req, res) => {
  const device = req.device;
  deviceService.updateLastSeen(device.id);

  if (req.io) {
    req.io.to('parent_room').emit('device_presence_changed', {
      deviceId: device.id,
      online: true,
      lastSeen: Date.now()
    });
  }

  res.json({ success: true, timestamp: Date.now() });
});

// Unpair / Revoke Device (Parent Authenticated)
router.post('/:id/unpair', requireParentAuth, (req, res) => {
  const deviceId = req.params.id;
  const revoked = deviceService.revokeDevice(deviceId);

  if (!revoked) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  if (req.io) {
    // Notify child socket room if connected so child app transitions to unpaired
    req.io.to(`device_${deviceId}`).emit('device_unpaired', { deviceId });
    
    // Force disconnect sockets associated with this device
    const childSockets = req.io.sockets.adapter.rooms.get(`device_${deviceId}`);
    if (childSockets) {
      for (const socketId of childSockets) {
        const socket = req.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
    }

    req.io.to('parent_room').emit('device_presence_changed', {
      deviceId,
      online: false,
      revoked: true,
      lastSeen: Date.now()
    });
  }

  res.json({ success: true, message: 'Device revoked successfully' });
});

module.exports = router;
