const crypto = require('crypto');

/**
 * Generates a cryptographically secure 6-digit numeric pairing code.
 */
function generatePairingCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Generates a cryptographically secure 256-bit device token (64 hex characters).
 */
function generateDeviceToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates a secure random unique identifier with a given prefix.
 */
function generateId(prefix = 'dev') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Computes SHA-256 hash of input string.
 */
function hashString(str) {
  if (!str) return '';
  return crypto.createHash('sha256').update(String(str)).digest('hex');
}

/**
 * Performs a constant-time comparison of two string hashes to prevent timing attacks.
 */
function safeCompare(hash1, hash2) {
  if (!hash1 || !hash2) return false;
  const buf1 = Buffer.from(hash1, 'utf8');
  const buf2 = Buffer.from(hash2, 'utf8');
  if (buf1.length !== buf2.length) return false;
  return crypto.timingSafeEqual(buf1, buf2);
}

module.exports = {
  generatePairingCode,
  generateDeviceToken,
  generateId,
  hashString,
  safeCompare
};
