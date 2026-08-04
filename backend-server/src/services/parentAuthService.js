const crypto = require('crypto');
const env = require('../config/env');

// Active Parent Sessions: token -> { token, username, createdAt, expiresAt }
const parentSessions = new Map();

function login(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  // Constant-time check for username and password to prevent timing attacks
  const userMatch = crypto.timingSafeEqual(
    Buffer.from(String(username).padEnd(64)),
    Buffer.from(String(env.PARENT_USERNAME).padEnd(64))
  ) && username === env.PARENT_USERNAME;

  const passMatch = crypto.timingSafeEqual(
    Buffer.from(String(password).padEnd(64)),
    Buffer.from(String(env.PARENT_PASSWORD).padEnd(64))
  ) && password === env.PARENT_PASSWORD;

  if (!userMatch || !passMatch) {
    return { success: false, error: 'Invalid parent credentials' };
  }

  const token = `parent_sess_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  parentSessions.set(token, {
    token,
    username,
    createdAt: Date.now(),
    expiresAt
  });

  return {
    success: true,
    token,
    expiresAt
  };
}

function validateParentToken(token) {
  if (!token) return false;
  const session = parentSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    parentSessions.delete(token);
    return false;
  }
  return true;
}

function logout(token) {
  if (token) {
    parentSessions.delete(token);
  }
  return { success: true };
}

module.exports = {
  login,
  validateParentToken,
  logout
};
