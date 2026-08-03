# Build Instructions

## 1. Backend Server
```bash
cd backend-server
npm start
```
Starts backend server at `http://localhost:4000`.

## 2. Parent Web Dashboard
```bash
cd parent-dashboard
npm run build
```
Generates production build bundle in `parent-dashboard/dist/`.

## 3. Child Android Companion App
```bash
cd child-android-app
./gradlew assembleDebug
```
Generates Debug APK at `child-android-app/app/build/outputs/apk/debug/app-debug.apk` (requires JDK 17 and Android SDK set in environment variables `JAVA_HOME` and `ANDROID_HOME`).
