# Personal Parental Control Suite (FlashGet Kids Equivalent)

Location: `E:\ParentalControlApp`

A complete, private, self-hosted parental monitoring application built for parents to monitor their child's location, manage screen time, inspect live camera/screen feeds, and receive real-time notifications.

---

## Folder Structure

```
E:\ParentalControlApp\
├── backend-server/             # Node.js + Express + Socket.io Relay Server (Port 4000)
├── parent-dashboard/           # Modern React + Vite Web Dashboard (Port 3000)
└── child-android-app/          # Android Companion App Template & Background Services
```

---

## 🚀 Quick Start Guide

### Step 1: Start the Backend Relay Server
```bash
cd E:\ParentalControlApp\backend-server
npm start
```
The server will start at `http://localhost:4000`.

### Step 2: Start the Parent Web Dashboard
```bash
cd E:\ParentalControlApp\parent-dashboard
npm run dev
```
Open your browser at `http://localhost:3000` to access the full Parent Control Panel.

---

## 🌟 Key Features Built-In

1. **🗺️ Live GPS & Geofence Map:** Interactive OpenStreetMap showing real-time location, breadcrumb history, speed, and circular geofence safe zone alerts.
2. **👁️ Remote Inspection:** Live WebRTC stream buttons for **Front Camera**, **Rear Camera**, **Screen Mirroring**, and **Ambient Microphone**.
3. **📱 App Rules & Instant Lock:** View today's screen time per app, toggle block/unblock on TikTok/Roblox, or trigger **INSTANT EMERGENCY PHONE LOCK**.
4. **🔔 Live Notification Feed:** Mirrored incoming notifications from WhatsApp, SMS, TikTok, and system alerts.
5. **🔋 Battery Optimization:** Adaptive location pings (60s when moving, 15m when idle) to ensure zero battery drain on child's device.
