# WebSocket & Socket.io Event Documentation

## Connection Handshake & Authentication Roles

Socket.io connections require handshake authentication. Rejects unauthenticated connections.

### Parent Connection Handshake
```javascript
const socket = io("http://localhost:4000", {
  auth: {
    role: "parent",
    token: "<parent_session_token>"
  }
});
```
- **Room Joined**: `parent_room`
- **Capabilities**: Receives device presence updates (`device_presence_changed`, `device_registered`). Disallowed from impersonating child devices.

### Child Device Connection Handshake
```javascript
const socket = io("http://localhost:4000", {
  auth: {
    role: "child",
    token: "<raw_device_token>"
  }
});
```
- **Room Joined**: `device_<deviceId>`
- **Capabilities**: Sends active connection pings (`child_heartbeat`). Receives unpair signals (`device_unpaired`). Disallowed from receiving parent administrative events.

---

## Event Matrix

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `child_heartbeat` | Child -> Server | `{}` | Sent by child app every ~45s to maintain active presence. |
| `heartbeat_ack` | Server -> Child | `{ timestamp }` | Server acknowledgement of heartbeat. |
| `device_presence_changed` | Server -> Parent | `{ deviceId, online, lastSeen }` | Broadcast to parent dashboard when device online/offline presence updates. |
| `device_registered` | Server -> Parent | `{ id, name, online, pairedAt }` | Broadcast to parent dashboard when new device is paired. |
| `device_unpaired` | Server -> Child | `{ deviceId }` | Sent to child device socket when parent revokes device. |
