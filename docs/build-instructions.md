# Build & Setup Instructions

## 1. Prerequisites
- **JDK**: Eclipse Adoptium Temurin JDK 17 (`C:\Android\jdk-17`).
- **Node.js**: Node.js 18+ or 20+.
- **Android SDK**: API 36 Platform Tools and Build Tools 36.0.0.

---

## 2. Backend Relay Server Setup & Test

1. Navigate to backend server:
   ```bash
   cd backend-server
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
   *(Configure `PARENT_USERNAME` and `PARENT_PASSWORD` if desired)*.
3. Run automated security and pairing tests:
   ```bash
   npm test
   ```
4. Start backend server:
   ```bash
   npm start
   ```
   *(Runs on `http://localhost:4000`)*.

---

## 3. Parent Web Dashboard

1. Navigate to parent dashboard:
   ```bash
   cd parent-dashboard
   ```
2. Install dependencies (if not installed):
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
   *(Open `http://localhost:3000` in browser)*.
4. Log in using parent credentials (`parent` / `ParentSecretPass123!`).
5. Build production bundle:
   ```bash
   npm run build
   ```

---

## 4. Child Android Companion App

1. Navigate to child app folder:
   ```bash
   cd child-android-app
   ```
2. Build Debug APK using JDK 17:
   ```powershell
   $env:JAVA_HOME="C:\Android\jdk-17"; .\gradlew.bat assembleDebug
   ```
3. Generated Debug APK location:
   `child-android-app/app/build/outputs/apk/debug/app-debug.apk`

---

## 5. Local Physical Phone Pairing

1. Connect Android phone via USB with USB Debugging enabled.
2. Verify connection: `C:\Android\Sdk\platform-tools\adb.exe devices`.
3. Install debug APK:
   ```powershell
   C:\Android\Sdk\platform-tools\adb.exe install -r app\build\outputs\apk\debug\app-debug.apk
   ```
4. Find your PC's local LAN IP: `ipconfig` (e.g., `192.168.1.105`).
5. Open Parent Dashboard -> Click "Generate Pairing Code".
6. Open Child App on phone -> Enter PC's LAN IP (`http://192.168.1.105:4000`) and the 6-digit pairing code -> Click "PAIR DEVICE NOW".
