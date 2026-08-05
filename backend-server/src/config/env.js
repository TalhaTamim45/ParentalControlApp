const fs = require('fs');
const path = require('path');

// Simple .env parser to avoid external dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch (err) {
      console.error('Failed to parse .env file:', err.message);
    }
  }
}

loadEnv();

module.exports = {
  PORT: process.env.PORT || 4000,
  STORAGE_MODE: (process.env.STORAGE_MODE || 'json').toLowerCase(),
  PARENT_USERNAME: process.env.PARENT_USERNAME || 'parent',
  PARENT_PASSWORD: process.env.PARENT_PASSWORD || 'ParentSecretPass123!',
  PARENT_SESSION_SECRET: process.env.PARENT_SESSION_SECRET || 'dev_parent_session_secret_key'
};
