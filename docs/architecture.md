# System Architecture Overview

The **ParentalControlApp** suite consists of three decoupled components:

1. **Child Android Companion App (`child-android-app`)**: Kotlin-based Android application (API 36 target) using Jetpack Compose and Clean MVVM architecture. Encrypts authentication tokens via **Android KeyStore** (AES-256-GCM) and conducts token-based authenticated REST/WebSocket pings.
2. **Backend Relay Server (`backend-server`)**: Node.js + Express + Socket.io relay server handling parent authentication, temporary one-time pairing codes (SHA-256 hashed), token-hashed device registration, and real-time presence signaling.
3. **Parent Web Dashboard (`parent-dashboard`)**: React + Vite web application requiring parent session authentication for device management, temporary pairing code generation, and live presence monitoring.

```
+---------------------+           +------------------------+           +----------------------+
|  Child Companion    | <=======> |  Backend Relay Server  | <=======> |  Parent Web          |
|  Android App        |  Socket   |  (Node.js / Express /  |  Socket   |  Dashboard           |
|  (Clean MVVM UI +   |  / REST   |   Socket.io - Port     |  / REST   |  (React + Vite -     |
|   Android KeyStore) | (Token)   |   4000)                | (Session) |   Port 3000)         |
+---------------------+           +------------------------+           +----------------------+
```

---

## Milestone 3: Secure Device Pairing & Registration Architecture

### 1. Parent Authentication Layer
Parent endpoints (`/api/pairing/generate`, `/api/devices`, etc.) require parent authentication.
- **Login Endpoint**: `POST /api/parent/login` accepts credentials matching environment variables (`PARENT_USERNAME`, `PARENT_PASSWORD`).
- **Session Token**: Issues a short-lived parent session token.
- **Header**: All protected parent REST calls pass `x-parent-token: <session_token>` or `Authorization: Bearer <session_token>`.

### 2. Pairing Code Protocol & Security
- **Generation**: Parent generates a 6-digit numeric code via `POST /api/pairing/generate` (cryptographically random via `crypto.randomInt`).
- **Storage**: Backend stores ONLY a SHA-256 hash of the code in memory with a 10-minute expiration.
- **Single-Use**: Immediately invalidated and deleted upon successful validation.
- **Rate Limiting**: Protected against brute-force guessing and rate limited by IP/session.

### 3. Device Token & Credential Protection
- **Raw Token Issuance**: On successful pairing code validation (`POST /api/pairing/validate`), backend returns a 256-bit crypto-random token to the child device once.
- **Backend Hashing**: Backend stores ONLY the SHA-256 hash (`tokenHash`) in `db.json`. Raw tokens are never logged or persisted on backend storage.
- **Android Keystore Encryption**: Child app encrypts the raw token using AES-256-GCM via `AndroidKeyStore` (`KeystoreManager.kt`) and stores ciphertext + IV in `SharedPreferences`.

### 4. Socket Roles & Authorization
Socket.io handshakes enforce explicit authentication roles:
- **Role `parent`**: Verified with parent session token. Enters `parent_room` to receive presence updates. Cannot impersonate devices.
- **Role `child`**: Verified with raw device token (matched against `tokenHash`). Enters `device_<id>` room. Emits heartbeat events. Disallowed from parent administrative events.

### 5. Truthful Presence & Heartbeat Management
- Presence is calculated dynamically from active socket connection state + `lastSeen` window (90 seconds).
- `PresenceCoordinator` on Android manages a periodic heartbeat (~45 seconds) while the app process is active.
- Devices are marked **OFFLINE** on the dashboard if no heartbeat/socket ping is received for >90 seconds.

### 6. Device Revocation & Unpairing
- Parent unpairs device via `POST /api/devices/:id/unpair`.
- Token is revoked (`revokedAt = timestamp`). Sockets are forcibly disconnected.
- Subsequent heartbeats return HTTP 401, causing the Child App to clear local Keystore credentials and reset to `PairingScreen`.
