# REST API Documentation

## Base URL
`http://localhost:4000`

## Endpoints

### 1. Get System Status
- **Method**: `GET`
- **Path**: `/api/status`
- **Response**:
```json
{
  "status": "online",
  "device": {
    "id": "child-phone-01",
    "name": "Child's Phone",
    "online": true,
    "battery": 84,
    "locked": false
  }
}
```

### 2. Manage Geofences
- **Method**: `POST`
- **Path**: `/api/geofences`
- **Body**: `{ "name": "Home", "lat": 37.7749, "lng": -122.4194, "radiusMeters": 250 }`
