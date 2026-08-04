-- Migration 001: Initial Schema for Production Parental Control System

CREATE TABLE IF NOT EXISTS parent_accounts (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(128) UNIQUE NOT NULL,
    paired_at BIGINT NOT NULL,
    last_seen BIGINT NOT NULL,
    revoked_at BIGINT DEFAULT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64) REFERENCES devices(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_token_hash ON devices(token_hash);
CREATE INDEX IF NOT EXISTS idx_devices_revoked_at ON devices(revoked_at);
