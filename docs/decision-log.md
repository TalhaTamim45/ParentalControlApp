# Architectural Decision Log (ADR)

## ADR-001: Target Android API 36 (Android 16) Specification
- **Decision**: Set `compileSdk = 36`, `targetSdk = 36`, `minSdk = 26`.
- **Reason**: Play Store policy mandates targeting API 36 for new apps and updates. minSdk 26 preserves compatibility back to Android 8.0 Oreo while supporting modern notification channels and background execution rules.

## ADR-002: Android Build Tooling (AGP 9.2.1 & Gradle 9.4.1)
- **Decision**: Adopt AGP 9.2.1 with Gradle 9.4.1 and Kotlin 2.1.0.
- **Reason**: Ensures native Kotlin compiler support and seamless API 36 compilation.

## ADR-003: Jetpack Compose for UI
- **Decision**: Use Jetpack Compose with Kotlin Compose plugin (`org.jetbrains.kotlin.plugin.compose`) and Compose BOM 2026.04.01.
- **Reason**: Declarative UI layout eliminates XML layout duplication and boilerplate code.

## ADR-004: Version Catalog (`libs.versions.toml`)
- **Decision**: Centralize all Gradle dependency and plugin versions in `gradle/libs.versions.toml`.
- **Reason**: Prevents version fragmentation and enforces single-source-of-truth version management.

## ADR-005: Parent Authentication Layer
- **Decision**: Authenticate parent dashboard sessions using environment credentials (`PARENT_USERNAME`, `PARENT_PASSWORD`).
- **Reason**: Ensures parent endpoints (`/api/pairing/generate`, `/api/devices`, etc.) cannot be accessed publicly while avoiding committed secrets.

## ADR-006: One-Time Temporary Pairing Code Security
- **Decision**: Generate 6-digit numeric pairing codes with `crypto.randomInt`. Store ONLY SHA-256 code hashes in memory with 10-minute expiration.
- **Reason**: Plain code is returned once to parent. Storing hashes prevents plain-text exposure in memory dumps. Single-use enforcement invalidates codes upon validation.

## ADR-007: Token-Hashed Device Identity & Revocation
- **Decision**: Return a 256-bit raw token once to child upon pairing. Backend stores ONLY `tokenHash` (`sha256(rawToken)`) in persistence storage. Compare tokens using constant-time `safeCompare` (`crypto.timingSafeEqual`).
- **Reason**: Raw tokens are never stored in persistence files or server logs. Revocation (`revokedAt = timestamp`) invalidates tokens immediately.

## ADR-008: Direct Android KeyStore Encryption for Credentials
- **Decision**: Encrypt device token on Android using direct `AndroidKeyStore` AES-256-GCM (`KeystoreManager.kt`) rather than deprecated EncryptedSharedPreferences.
- **Reason**: Deprecated EncryptedSharedPreferences and MasterKey APIs are avoided. Direct KeyStore provides robust hardware-backed credential protection. Set `android:allowBackup="false"` to prevent credential leakage in backups.

## ADR-009: Separate Socket Authentication Roles
- **Decision**: Enforce distinct socket authorization roles: `parent` (validated via parent session token) and `child` (validated via device token hash).
- **Reason**: Prevents child sockets from subscribing to parent administrative events or parent sockets from impersonating child devices.

## ADR-010: Truthful Dynamic Presence Calculation
- **Decision**: Compute device `online` presence dynamically based on active socket connection state OR `lastSeen` window (<90 seconds).
- **Reason**: Avoids storing a misleading permanent `online: true` field in persistence. Heartbeat coordinator runs while app process is active (~45s interval).

## ADR-011: Unified Node.js Server & Static SPA Proxying
- **Decision**: Serve the Parent Dashboard static SPA build (`parent-dashboard/dist`) directly at `/` from the Node.js backend server (`server.js`), alongside `/api` REST routes and `/socket.io` WebSockets.
- **Reason**: Eliminates multi-origin CORS complexities and allows a single port (4000) to be exposed securely via Tailscale Funnel.

## ADR-012: Tailscale Funnel Public Internet Routing
- **Decision**: Adopt Tailscale Funnel to assign a stable, permanent public HTTPS domain (`https://<windows-node>.<tailnet>.ts.net`) to the Windows PC server.
- **Reason**: Provides zero-cost, encrypted HTTPS and WSS access across different cities over public mobile data without router port forwarding, mock servers, or unstable temporary URLs.
