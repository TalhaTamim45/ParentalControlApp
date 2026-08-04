const { getDb, saveDb } = require('../storage/devStorage');
const { isPostgresEnabled, query } = require('../storage/dbPool');
const { generateId, generateDeviceToken, hashString, safeCompare } = require('../utils/cryptoUtils');

/**
 * Registers a new device after pairing code validation.
 * Generates raw token, stores ONLY tokenHash in database.
 */
async function registerDevice(deviceName) {
  const deviceId = generateId('dev');
  const rawToken = generateDeviceToken();
  const tokenHash = hashString(rawToken);

  const now = Date.now();
  const name = deviceName || "Child's Phone";

  if (isPostgresEnabled) {
    try {
      await query(
        `INSERT INTO devices (id, name, token_hash, paired_at, last_seen, revoked_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NULL, $6, $7)`,
        [deviceId, name, tokenHash, now, now, now, now]
      );
    } catch (err) {
      console.error('[DeviceService] DB registerDevice error:', err.message);
    }
  }

  // Fallback to devStorage for local development
  const db = getDb();
  db.devices[deviceId] = {
    id: deviceId,
    name,
    tokenHash,
    pairedAt: now,
    lastSeen: now,
    revokedAt: null,
    createdAt: now,
    updatedAt: now
  };
  saveDb();

  return {
    deviceId,
    rawToken,
    name
  };
}

/**
 * Validates raw device token and returns device record if valid & active.
 */
async function authenticateDeviceToken(rawToken) {
  if (!rawToken) return null;
  const submittedHash = hashString(String(rawToken).trim());

  if (isPostgresEnabled) {
    try {
      const res = await query(
        'SELECT id, name, token_hash as "tokenHash", paired_at as "pairedAt", last_seen as "lastSeen", revoked_at as "revokedAt" FROM devices WHERE token_hash = $1 AND revoked_at IS NULL',
        [submittedHash]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.error('[DeviceService] DB authenticateDeviceToken error:', err.message);
    }
  }

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
async function getDeviceById(deviceId) {
  if (isPostgresEnabled) {
    try {
      const res = await query(
        'SELECT id, name, token_hash as "tokenHash", paired_at as "pairedAt", last_seen as "lastSeen", revoked_at as "revokedAt" FROM devices WHERE id = $1',
        [deviceId]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.error('[DeviceService] DB getDeviceById error:', err.message);
    }
  }

  const db = getDb();
  return db.devices[deviceId] || null;
}

/**
 * Updates device lastSeen timestamp.
 */
async function updateLastSeen(deviceId) {
  const now = Date.now();
  if (isPostgresEnabled) {
    try {
      await query('UPDATE devices SET last_seen = $1, updated_at = $1 WHERE id = $2', [now, deviceId]);
    } catch (err) {
      console.error('[DeviceService] DB updateLastSeen error:', err.message);
    }
  }

  const db = getDb();
  const device = db.devices[deviceId];
  if (device) {
    device.lastSeen = now;
    device.updatedAt = now;
    saveDb();
  }
}

/**
 * Revokes a device token (unpairs device).
 */
async function revokeDevice(deviceId) {
  const now = Date.now();
  let revoked = false;

  if (isPostgresEnabled) {
    try {
      const res = await query('UPDATE devices SET revoked_at = $1, updated_at = $1 WHERE id = $2', [now, deviceId]);
      revoked = res.rowCount > 0;
    } catch (err) {
      console.error('[DeviceService] DB revokeDevice error:', err.message);
    }
  }

  const db = getDb();
  const device = db.devices[deviceId];
  if (device) {
    device.revokedAt = now;
    device.updatedAt = now;
    saveDb();
    revoked = true;
  }
  return revoked;
}

/**
 * Returns all active registered devices (without sensitive token hashes).
 */
async function getAllRegisteredDevices() {
  if (isPostgresEnabled) {
    try {
      const res = await query(
        'SELECT id, name, paired_at as "pairedAt", last_seen as "lastSeen", created_at as "createdAt", updated_at as "updatedAt" FROM devices WHERE revoked_at IS NULL ORDER BY paired_at DESC'
      );
      return res.rows;
    } catch (err) {
      console.error('[DeviceService] DB getAllRegisteredDevices error:', err.message);
    }
  }

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
