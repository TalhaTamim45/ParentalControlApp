# Changelog

## [1.3.0] - Milestone 3: Secure Device Pairing & Registration (Phase 1)

### Added
- **Parent Authentication Layer**: Login API (`POST /api/parent/login`), parent session management, and ParentLogin UI on dashboard.
- **One-Time Temporary Pairing Codes**: Hashed 6-digit numeric pairing code generation (`POST /api/pairing/generate`) with 10-minute expiration, single-use invalidation, and rate limiting.
- **Token-Hashed Device Registration**: Secure device pairing endpoint (`POST /api/pairing/validate`), issuing 256-bit raw tokens to child devices while storing ONLY SHA-256 token hashes (`tokenHash`) in `db.json`.
- **Android KeyStore Encryption**: `KeystoreManager.kt` providing direct hardware-backed AES-256-GCM token encryption and `CredentialManager.kt` storing credentials safely in `SharedPreferences`.
- **Presence & Heartbeat Loop**: `PresenceCoordinator.kt` executing periodic heartbeats (~45s interval) and Socket.io active presence signaling with 90s offline threshold.
- **Device Management & Revocation**: Dashboard Devices page featuring registered device list, pairing code modal with countdown timer, and device unpairing (`POST /api/devices/:id/unpair`).
- **Socket Authentication Roles**: Handshake authentication enforcing role `parent` (parent_room) vs `child` (device room).
- **Automated Backend Test Suite**: Node.js test script (`npm test`) covering authentication, code generation/validation, token hashing, single-use enforcement, heartbeat, and revocation.
- **Network Security Configuration**: Permitting HTTP cleartext traffic strictly for development host IPs in debug builds (`xml/network_security_config.xml`).

### Changed
- Refactored `backend-server/server.js` into clean modular structure (`routes/`, `services/`, `middleware/`, `socket/`, `storage/`, `utils/`).
- Replaced initial simulated devices on dashboard with real registered devices.
- Updated `MainActivity.kt` to host Jetpack Compose `PairingScreen.kt`.

### Security
- Excluded raw pairing codes and raw device tokens from `db.json` and production logs.
- Added `.env` to `.gitignore` and provided `.env.example`.
- Disabled Android backup (`android:allowBackup="false"`) to protect stored Keystore credentials.
