const fs = require('fs');
const path = require('path');

// Development-only JSON Storage with Atomic File Writes
const DB_FILE = path.join(__dirname, '../../db.json');

let dbState = {
  _notice: "DEVELOPMENT-ONLY STORAGE. NOT FOR PRODUCTION USE.",
  devices: {}
};

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      dbState = {
        _notice: "DEVELOPMENT-ONLY STORAGE. NOT FOR PRODUCTION USE.",
        devices: parsed.devices || {}
      };
    } catch (err) {
      console.error('[DevStorage] Failed to parse db.json, starting fresh:', err.message);
    }
  } else {
    saveDb();
  }
}

function saveDb() {
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    const data = JSON.stringify(dbState, null, 2);
    fs.writeFileSync(tempPath, data, 'utf8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('[DevStorage] Atomic write failed:', err.message);
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }
  }
}

// Initial load
loadDb();

module.exports = {
  getDb: () => dbState,
  saveDb
};
