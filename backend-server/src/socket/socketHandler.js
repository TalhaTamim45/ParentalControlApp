const presenceService = require('../services/presenceService');
const deviceService = require('../services/deviceService');

function registerSocketHandlers(io, socket) {
  if (socket.role === 'parent') {
    socket.join('parent_room');
    console.log(`[Socket] Parent client connected: ${socket.id}`);
  } else if (socket.role === 'child' && socket.device) {
    const deviceId = socket.device.id;
    socket.join(`device_${deviceId}`);
    presenceService.addActiveSocket(deviceId, socket.id);
    deviceService.updateLastSeen(deviceId);

    console.log(`[Socket] Child device connected: ${socket.device.name} (${deviceId})`);

    // Broadcast immediate online status to parent dashboard
    io.to('parent_room').emit('device_presence_changed', {
      deviceId,
      online: true,
      lastSeen: Date.now()
    });

    // Handle incoming heartbeat from child socket
    socket.on('child_heartbeat', () => {
      deviceService.updateLastSeen(deviceId);
      io.to('parent_room').emit('device_presence_changed', {
        deviceId,
        online: true,
        lastSeen: Date.now()
      });
      socket.emit('heartbeat_ack', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Child device disconnected: ${socket.device.name} (${deviceId})`);
      presenceService.removeActiveSocket(deviceId, socket.id);
      deviceService.updateLastSeen(deviceId);

      // Re-evaluate presence after socket drop
      const device = deviceService.getDeviceById(deviceId);
      const isOnline = presenceService.isDeviceOnline(device);

      io.to('parent_room').emit('device_presence_changed', {
        deviceId,
        online: isOnline,
        lastSeen: Date.now()
      });
    });
  }
}

module.exports = {
  registerSocketHandlers
};
