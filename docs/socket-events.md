# Real-Time WebSocket Events

Centralized WebSocket event definitions for Socket.io signaling.

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `initial_state` | Server -> Client | Full initial device status, geofences, and alert history. |
| `parent_command_lock` | Dashboard -> Server | Lock toggle command (`{ "locked": true }`). |
| `child_command_lock` | Server -> Child App | Emergency device lock signal. |
| `device_status_update` | Server -> Dashboard | Real-time status update broadcast. |
| `location_update` | Child App -> Server | Live GPS position update payload. |
