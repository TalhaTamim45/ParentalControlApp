# Android Permissions & Security Matrix

## Phase 1 (Foundation & Secure Pairing)
- **Active Permissions**:
  - `android.permission.INTERNET`: Required for REST API communication and Socket.io presence signaling.
  - `android.permission.ACCESS_NETWORK_STATE`: Required for monitoring network connectivity.

## Network Security Configuration
- File: `app/src/main/res/xml/network_security_config.xml`
- **Development Exception**: Cleartext HTTP traffic (`cleartextTrafficPermitted="true"`) is allowed strictly for development host domain/IPs (`10.0.2.2`, `localhost`, local LAN IPv4 ranges).
- **Production Enforcer**: Base configuration enforces strict HTTPS/WSS (`cleartextTrafficPermitted="false"`).

## Planned Permissions for Future Phases
- `android.permission.ACCESS_FINE_LOCATION`: High-accuracy GPS tracking (Phase 3).
- `android.permission.ACCESS_BACKGROUND_LOCATION`: Continuous geofence monitoring (Phase 3).
- `android.permission.PACKAGE_USAGE_STATS`: Screen time monitoring & app blocking (Phase 4).
- `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`: Incoming notification mirroring (Phase 5).
- `android.permission.CAMERA`: Remote live camera feed streaming (Phase 6).
- `android.permission.RECORD_AUDIO`: Ambient audio inspection (Phase 6).
