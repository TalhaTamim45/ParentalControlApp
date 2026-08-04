# System Architecture Overview

The **ParentalControlApp** suite consists of three decoupled components:

1. **Child Android Companion App (`child-android-app`)**: Kotlin-based Android application (API 36 target) using Jetpack Compose, Clean MVVM architecture, and `ParentalForegroundService` (API 36 `specialUse` type). Encrypts authentication tokens via **Android KeyStore** (AES-256-GCM) and conducts token-based authenticated REST/WebSocket pings.
2. **Backend Relay Server (`backend-server`)**: Unified Node.js + Express + Socket.io relay server handling parent authentication, temporary one-time pairing codes (SHA-256 hashed), token-hashed device registration, static dashboard SPA serving, and real-time presence signaling.
3. **Parent Web Dashboard (`parent-dashboard`)**: React + Vite web application requiring parent session authentication for device management, temporary pairing code generation, and live presence monitoring.

```
+---------------------+           +------------------------+           +----------------------+
|  Child Companion    | <=======> |  Backend Relay Server  | <=======> |  Parent Web          |
|  Android App        |  Socket   |  (Node.js / Express /  |  Socket   |  Dashboard           |
|  (Foreground        |  / REST   |   Socket.io - Port     |  / REST   |  (React + Vite SPA   |
|   Service & KeyStore)| (Token)  |   4000)                | (Session) |   Bundle)            |
+---------------------+           +------------------------+           +----------------------+
```

---

## Milestone 5: Android Core Service & Reliability Architecture

### 1. Foreground Service Architecture (`ParentalForegroundService.kt`)
- **Service Type**: `android:foregroundServiceType="specialUse"` targeting API 36 with manifest property `<property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="Parent-authorized child protection and supervision connection" />`.
- **Single-Owner State Machine**: `Stopped`, `Starting`, `Active`, `WaitingForNetwork`, `Reconnecting`, `AuthenticationFailed`, `Revoked`, `Stopping`, `Failed`. Single owner for socket connection and heartbeat loop (~45s).
- **Persistent Notification**: Low/Default importance ongoing notification (`parental_service_channel`) showing honest status ("Connected & Protected", "Reconnecting...", "Offline").

### 2. Boot Auto-Recovery (`BootReceiver.kt`)
- Listens to `Intent.ACTION_BOOT_COMPLETED` and `Intent.ACTION_MY_PACKAGE_REPLACED`.
- Verifies encrypted KeyStore credentials. Safe FGS execution inside `try-catch (ForegroundServiceStartNotAllowedException)` to prevent boot crash loops. If background FGS launch is restricted by OS, displays a user-facing notification to tap and reactivate protection.

### 3. Real-Time Network Callback Monitoring (`NetworkMonitor.kt`)
- Uses `ConnectivityManager.registerDefaultNetworkCallback` to detect Wi-Fi and Mobile Data availability, loss, and validated internet access.
- Restores connections with single-owner jittered exponential backoff.

### 4. Battery Optimization & Exemption Flow (`BatteryOptimizationManager.kt`)
- Detects `PowerManager.isIgnoringBatteryOptimizations()`.
- Provides UI prompt to open system settings (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` or app settings) with Samsung Galaxy A12 Device Care instructions (Unrestricted battery setting & "Never sleeping apps").

### 5. Crash Diagnostics (`CrashHandler.kt`)
- Global `UncaughtExceptionHandler` logs sanitized local crash reports (timestamp + class + sanitized stack trace, strictly omitting tokens, passwords, and secrets). Delegates to original handler without infinite restart loops.

---

## Milestone 3 & 4: Internet Deployment & Pairing Architecture

### 1. Public HTTPS Domain Routing (Tailscale Funnel)
- Assigned permanent public domain: `https://nemo.tail7499c7.ts.net`.
- Unified Node server serves Dashboard SPA at `/`, REST API at `/api`, and Socket.io at `/socket.io`.

### 2. Parent Authentication & PostgreSQL Migration
- Parent endpoints require session tokens. Passwords hashed using `bcryptjs` (12 salt rounds).
- Database support via `dbPool.js` & `001_init_schema.sql` (PostgreSQL).

### 3. Device Token Hashing & Android KeyStore Encryption
- Backend stores ONLY SHA-256 token hashes (`tokenHash`) in database.
- Child app encrypts raw token using AES-256-GCM via `AndroidKeyStore` (`KeystoreManager.kt`). `android:allowBackup="false"` prevents leakage.
