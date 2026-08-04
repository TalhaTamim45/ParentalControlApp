# Android Permissions & Security Matrix

## Active Milestone 5 Permissions Audit (Minimal Permitted Set)
- `android.permission.INTERNET`: Required for REST API communication and Socket.io WSS presence.
- `android.permission.ACCESS_NETWORK_STATE`: Required for NetworkMonitor callback detection.
- `android.permission.FOREGROUND_SERVICE`: Required for running persistent long-running protection service.
- `android.permission.FOREGROUND_SERVICE_SPECIAL_USE`: Required for API 34-36 `specialUse` type declaration with `<property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value="Parent-authorized child protection and supervision connection" />`.
- `android.permission.POST_NOTIFICATIONS`: Required for Android 13+ (API 33+) ongoing persistent notification display.
- `android.permission.RECEIVE_BOOT_COMPLETED`: Required for BootReceiver device restart auto-recovery.
- `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`: Required for user-guided Battery Saver exemption on Samsung Galaxy A12 / Android 13.

## Prohibited & Removed Permissions (Unimplemented Features)
- `FOREGROUND_SERVICE_DATA_SYNC`: Prohibited for continuous FGS operation on Android 15+ (API 35/36 6-hour limit). Removed.
- All future permissions (`ACCESS_FINE_LOCATION`, `CAMERA`, `RECORD_AUDIO`, `PACKAGE_USAGE_STATS`, etc.) remain strictly excluded until their respective future milestones.

## Network Security Configuration
- File: `app/src/main/res/xml/network_security_config.xml`
- Base configuration enforces strict HTTPS/WSS (`cleartextTrafficPermitted="false"`).
