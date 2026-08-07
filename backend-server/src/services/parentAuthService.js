const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { isPostgresEnabled, query } = require('../storage/dbPool');

// Active Parent Sessions: token -> { token, username, createdAt, expiresAt }
const parentSessions = new Map();

async function login(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  let authenticated = false;

  if (isPostgresEnabled) {
    try {
      const res = await query('SELECT * FROM parent_accounts WHERE username = $1', [username]);
      if (res.rows.length > 0) {
        const parent = res.rows[0];
        authenticated = await bcrypt.compare(password, parent.password_hash);
      }
    } catch (err) {
      console.error('[ParentAuth] DB authentication error:', err.message);
    }
  }

  // Fallback to environment variable authentication if DB not configured or empty
  if (!authenticated) {
    const userMatch = crypto.timingSafeEqual(
      Buffer.from(String(username).padEnd(64)),
      Buffer.from(String(env.PARENT_USERNAME).padEnd(64))
    ) && username === env.PARENT_USERNAME;

    const passMatch = crypto.timingSafeEqual(
      Buffer.from(String(password).padEnd(64)),
      Buffer.from(String(env.PARENT_PASSWORD).padEnd(64))
    ) && password === env.PARENT_PASSWORD;

    authenticated = userMatch && passMatch;
  }

  if (!authenticated) {
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

function invalidateAllSessions() {
  parentSessions.clear();
}

module.exports = {
  login,
  validateParentToken,
  logout,
  invalidateAllSessions
};

