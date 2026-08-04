# REST API Documentation

## Base URL
`http://localhost:4000` (or `http://<PC-LAN-IP>:4000`)

---

## 1. Parent Authentication

### `POST /api/parent/login`
Authenticates parent user against environment credentials (`PARENT_USERNAME`, `PARENT_PASSWORD`).
- **Request Body**:
  ```json
  {
    "username": "parent",
    "password": "ParentSecretPass123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "parent_sess_a1b2c3...",
    "expiresAt": 1785980000000
  }
  ```

### `POST /api/parent/logout`
Revokes active parent session.
- **Headers**: `x-parent-token: <parent_session_token>`

---

## 2. Pairing & Device Registration

### `POST /api/pairing/generate`
Generates a temporary 6-digit one-time pairing code.
- **Headers**: `x-parent-token: <parent_session_token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "code": "482019",
    "expiresAt": 1785980600000
  }
  ```

### `POST /api/pairing/validate`
Validates a temporary pairing code and registers permanent device identity.
- **Request Body**:
  ```json
  {
    "code": "482019",
    "deviceName": "Samsung Galaxy S24"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "deviceId": "dev_9f8e7d6c5b4a3a2b",
    "authToken": "a1b2c3d4e5f6... (raw token issued ONCE)",
    "name": "Samsung Galaxy S24"
  }
  ```

---

## 3. Device Management & Presence

### `GET /api/devices`
Fetches list of registered child devices for the parent dashboard.
- **Headers**: `x-parent-token: <parent_session_token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "devices": [
      {
        "id": "dev_9f8e7d6c5b4a3a2b",
        "name": "Samsung Galaxy S24",
        "pairedAt": 1785980000000,
        "lastSeen": 1785980045000,
        "online": true
      }
    ]
  }
  ```

### `POST /api/devices/heartbeat`
Sends heartbeat connection ping from child device.
- **Headers**: `x-device-token: <raw_auth_token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "timestamp": 1785980045000
  }
  ```

### `POST /api/devices/:id/unpair`
Revokes device token and disconnects device.
- **Headers**: `x-parent-token: <parent_session_token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Device revoked successfully"
  }
  ```

---

## 4. System Health Check

### `GET /api/status`
Public health status check endpoint.
- **Response (200 OK)**:
  ```json
  {
    "status": "online",
    "service": "Parental Control Backend Server",
    "version": "1.0.0"
  }
  ```
