const { getDb, saveDb } = require('../storage/devStorage');
const { generateId, generateDeviceToken, hashString, safeCompare } = require('../utils/cryptoUtils');

/**
 * Registers a new device after pairing code validation.
 * Generates raw token, stores ONLY tokenHash in persistent db.json.
 */
function registerDevice(deviceName) {
  const db = getDb();
  const deviceId = generateId('dev');
  const rawToken = generateDeviceToken();
  const tokenHash = hashString(rawToken);

  const now = Date.now();
  const deviceRecord = {
    id: deviceId,
    name: deviceName || "Child's Phone",
    tokenHash,
    pairedAt: now,
    lastSeen: now,
    revokedAt: null,
    createdAt: now,
    updatedAt: now
  };

  db.devices[deviceId] = deviceRecord;
  saveDb();

  return {
    deviceId,
    rawToken,
    name: deviceRecord.name
  };
}

/**
 * Validates raw device token and returns device record if valid & active.
 */
function authenticateDeviceToken(rawToken) {
  if (!rawToken) return null;
  const submittedHash = hashString(String(rawToken).trim());

  const db = getDb();
  for (const id in db.devices) {
    const device = db.devices[id];
    if (device.revokedAt === null && safeCompare(device.tokenHash, submittedHash)) {
      return device;
    }
  }
  return null;
}

/**
 * Gets device by ID.
 */
function getDeviceById(deviceId) {
  const db = getDb();
  return db.devices[deviceId] || null;
}

/**
 * Updates device lastSeen timestamp.
 */
function updateLastSeen(deviceId) {
  const db = getDb();
  const device = db.devices[deviceId];
  if (device) {
    device.lastSeen = Date.now();
    device.updatedAt = Date.now();
    saveDb();
  }
}

/**
 * Revokes a device token (unpairs device).
 */
function revokeDevice(deviceId) {
  const db = getDb();
  const device = db.devices[deviceId];
  if (device) {
    device.revokedAt = Date.now();
    device.updatedAt = Date.now();
    saveDb();
    return true;
  }
  return false;
}

/**
 * Returns all active registered devices (without sensitive token hashes).
 */
function getAllRegisteredDevices() {
  const db = getDb();
  const result = [];
  for (const id in db.devices) {
    const d = db.devices[id];
    if (!d.revokedAt) {
      result.push({
        id: d.id,
        name: d.name,
        pairedAt: d.pairedAt,
        lastSeen: d.lastSeen,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      });
    }
  }
  return result;
}

module.exports = {
  registerDevice,
  authenticateDeviceToken,
  getDeviceById,
  updateLastSeen,
  revokeDevice,
  getAllRegisteredDevices
};
