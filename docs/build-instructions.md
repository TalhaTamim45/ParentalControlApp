# Build Instructions

## 1. Backend Server
```bash
cd backend-server
npm start
```
Starts backend server at `http://localhost:4000`. Verified active status via `/api/status`.

## 2. Parent Web Dashboard
```bash
cd parent-dashboard
npm run build
```
Generates production build bundle in `parent-dashboard/dist/`. Verified build time: 8.15s.

## 3. Child Android Companion App

### Environment Requirements
- **JDK**: Java 17 (Set `JAVA_HOME` environment variable to JDK installation path).
- **Android Platform Tools / ADB**: Located at `C:\Users\Hi\Downloads\platform-tools-latest-windows\platform-tools\adb.exe` (v37.0.0).

### Compiling Debug APK
```bash
cd child-android-app
gradlew.bat assembleDebug
```
Output APK location: `child-android-app/app/build/outputs/apk/debug/app-debug.apk`

### Physical Device Installation Instructions
1. **Enable Developer Options on Android Phone**: Go to Settings -> About Phone -> Tap "Build Number" 7 times.
2. **Enable USB Debugging**: Go to Settings -> System -> Developer Options -> Toggle "USB Debugging" to ON.
3. **Connect Phone**: Connect Android device to computer via USB cable.
4. **Authorize Computer**: Accept the "Allow USB Debugging?" prompt on the phone screen.
5. **Install APK**:
   ```bash
   C:\Users\Hi\Downloads\platform-tools-latest-windows\platform-tools\adb.exe install -r child-android-app/app/build/outputs/apk/debug/app-debug.apk
   ```
6. **Launch Application**:
   ```bash
   C:\Users\Hi\Downloads\platform-tools-latest-windows\platform-tools\adb.exe shell am start -n com.parental.child.debug/com.parental.child.ui.MainActivity
   ```
