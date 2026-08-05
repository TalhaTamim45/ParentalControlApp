const ACTIVE_TIMEOUT_MS = 90 * 1000; // 90 seconds timeout for heartbeat presence

// Map of active child socket connections: deviceId -> Set of socket IDs
const activeChildSockets = new Map();

function addActiveSocket(deviceId, socketId) {
  if (!activeChildSockets.has(deviceId)) {
    activeChildSockets.set(deviceId, new Set());
  }
  activeChildSockets.get(deviceId).add(socketId);
}

function removeActiveSocket(deviceId, socketId) {
  if (activeChildSockets.has(deviceId)) {
    const set = activeChildSockets.get(deviceId);
    set.delete(socketId);
    if (set.size === 0) {
      activeChildSockets.delete(deviceId);
    }
  }
}

function isDeviceOnline(device) {
  if (!device || device.revokedAt) return false;
  
  const hasActiveSocket = activeChildSockets.has(device.id) && activeChildSockets.get(device.id).size > 0;
  const recentHeartbeat = (Date.now() - device.lastSeen) < ACTIVE_TIMEOUT_MS;

  return hasActiveSocket || recentHeartbeat;
}

function formatDeviceWithPresence(device) {
  if (!device) return null;
  return {
    id: device.id,
    name: device.name,
    pairedAt: device.pairedAt,
    lastSeen: device.lastSeen,
    online: isDeviceOnline(device)
  };
}

let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function broadcastLocationChanged(deviceId, data) {
  if (ioInstance) {
    ioInstance.to('parent_room').emit('location_changed', data);
    console.log(`[PresenceService] Broadcasted location_changed for ${deviceId} to parent_room`);
  }
}

module.exports = {
  setIo,
  addActiveSocket,
  removeActiveSocket,
  isDeviceOnline,
  formatDeviceWithPresence,
  broadcastLocationChanged
};

