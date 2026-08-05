const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const isPostgresEnabled = env.STORAGE_MODE === 'postgres';

let pool = null;

if (isPostgresEnabled) {
  if (!process.env.PGHOST && !process.env.DATABASE_URL) {
    throw new Error('[Storage] STORAGE_MODE is set to "postgres" but neither PGHOST nor DATABASE_URL is configured in environment.');
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'parental_control',
    port: parseInt(process.env.PGPORT || '5432'),
    max: 10,
    idleTimeoutMillis: 30000
  });

  pool.on('error', (err) => {
    console.error('[PostgreSQL] Unexpected client error:', err.message);
  });
}

async function runMigrations() {
  if (!pool) return;
  const migrationPath = path.join(__dirname, '../migrations/001_init_schema.sql');
  if (fs.existsSync(migrationPath)) {
    try {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(sql);
      console.log('[PostgreSQL] Initial schema migration applied successfully.');
    } catch (err) {
      console.error('[PostgreSQL] Failed to apply schema migration:', err.message);
    }
  }
}

module.exports = {
  isPostgresEnabled,
  pool,
  query: (text, params) => pool ? pool.query(text, params) : Promise.reject(new Error('PostgreSQL not configured')),
  runMigrations
};
