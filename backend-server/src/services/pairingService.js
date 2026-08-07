const { generatePairingCode, hashString, safeCompare } = require('../utils/cryptoUtils');

// Temporary in-memory store for pairing code hashes: codeHash -> { codeHash, createdAt, expiresAt, used }
const pairingCodeStore = new Map();

// Periodic cleanup of expired pairing codes (every 1 minute)
setInterval(() => {
  const now = Date.now();
  for (const [hash, entry] of pairingCodeStore.entries()) {
    if (now > entry.expiresAt || entry.used) {
      pairingCodeStore.delete(hash);
    }
  }
}, 60 * 1000);

/**
 * Generates a temporary 6-digit pairing code for an authenticated parent.
 * Stores only a SHA-256 hash in memory.
 */
function createPairingCode() {
  let plainCode = generatePairingCode();
  let codeHash = hashString(plainCode);

  // Handle rare code collisions by regenerating
  let attempts = 0;
  while (pairingCodeStore.has(codeHash) && attempts < 5) {
    plainCode = generatePairingCode();
    codeHash = hashString(plainCode);
    attempts++;
  }

  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  pairingCodeStore.set(codeHash, {
    codeHash,
    createdAt: Date.now(),
    expiresAt,
    used: false
  });

  return {
    code: plainCode,
    expiresAt
  };
}

/**
 * Validates a pairing code provided by a child device.
 * Immediately invalidates and deletes the code on successful validation.
 */
function validateAndConsumePairingCode(submittedCode) {
  if (!submittedCode || String(submittedCode).trim().length !== 6) {
    return { valid: false, error: 'Invalid pairing code format' };
  }

  const submittedHash = hashString(String(submittedCode).trim());
  const entry = pairingCodeStore.get(submittedHash);

  if (!entry) {
    return { valid: false, error: 'Invalid or expired pairing code' };
  }

  if (Date.now() > entry.expiresAt) {
    pairingCodeStore.delete(submittedHash);
    return { valid: false, error: 'Pairing code has expired' };
  }

  if (entry.used) {
    pairingCodeStore.delete(submittedHash);
    return { valid: false, error: 'Pairing code has already been used' };
  }

  // Double check hash equality with timing safe compare
  if (!safeCompare(entry.codeHash, submittedHash)) {
    return { valid: false, error: 'Invalid pairing code' };
  }

  // Mark as used and delete immediately (one-time use)
  entry.used = true;
  pairingCodeStore.delete(submittedHash);

  return { valid: true };
}

function invalidateAllPairingCodes() {
  pairingCodeStore.clear();
}

module.exports = {
  createPairingCode,
  validateAndConsumePairingCode,
  invalidateAllPairingCodes
};

