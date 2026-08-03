# System Architecture Overview

The **ParentalControlApp** suite consists of three decoupled components:

1. **Child Android Companion App (`child-android-app`)**: Kotlin-based Android application (API 36 target) using Jetpack Compose and Clean MVVM architecture.
2. **Backend Server (`backend-server`)**: Node.js + Express + Socket.io relay server handling REST endpoints and real-time WebSocket signaling.
3. **Parent Web Dashboard (`parent-dashboard`)**: Modern React + Vite web application for parent monitoring, location tracking, and device management.

```
+---------------------+           +------------------------+           +----------------------+
|  Child Companion    | <=======> |  Backend Relay Server  | <=======> |  Parent Web          |
|  Android App        |  Socket   |  (Node.js / Express /  |  Socket   |  Dashboard           |
|  (Clean MVVM UI)    |  / REST   |   Socket.io - Port     |  / REST   |  (React + Vite -     |
|                     |           |   4000)                |           |   Port 3000)         |
+---------------------+           +------------------------+           +----------------------+
```
