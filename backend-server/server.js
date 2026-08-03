const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-Memory Database & Persistence File
const DB_FILE = path.join(__dirname, 'db.json');

let dbState = {
  childDevice: {
    id: "child-phone-01",
    name: "Child's Phone",
    online: true,
    battery: 84,
    charging: false,
    locked: false,
    currentLocation: {
      lat: 37.774929,
      lng: -122.419416,
      accuracy: 12,
      speed: 0,
      timestamp: Date.now(),
      address: "Market St & 8th St, San Francisco, CA"
    },
    locationHistory: [],
    installedApps: [
      { packageName: "com.whatsapp", appName: "WhatsApp", icon: "💬", usageTodayMin: 45, isBlocked: false },
      { packageName: "com.zhiliaoapp.musically", appName: "TikTok", icon: "🎵", usageTodayMin: 120, isBlocked: false },
      { packageName: "com.google.android.youtube", appName: "YouTube", icon: "▶️", usageTodayMin: 90, isBlocked: false },
      { packageName: "com.instagram.android", appName: "Instagram", icon: "📷", usageTodayMin: 35, isBlocked: false },
      { packageName: "com.roblox.client", appName: "Roblox", icon: "🎮", usageTodayMin: 60, isBlocked: true }
    ],
    notifications: [
      { id: 1, app: "WhatsApp", title: "Mom", message: "Call me when you finish school!", timestamp: Date.now() - 1000 * 60 * 15 },
      { id: 2, app: "TikTok", title: "TikTok Alert", message: "Trending video: Check this out!", timestamp: Date.now() - 1000 * 60 * 45 }
    ]
  },
  geofences: [
    { id: "gf-1", name: "Home", lat: 37.774929, lng: -122.419416, radiusMeters: 250, active: true },
    { id: "gf-2", name: "School", lat: 37.783333, lng: -122.416667, radiusMeters: 300, active: true }
  ],
  alertLogs: []
};

// Load saved state if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    dbState = { ...dbState, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load db.json, using defaults:', err.message);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2));
  } catch (err) {
    console.error('Failed to save db.json:', err.message);
  }
}

// Haversine Geofence Distance Calculation
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function checkGeofences(location) {
  dbState.geofences.forEach(gf => {
    if (!gf.active) return;
    const dist = calculateDistanceMeters(location.lat, location.lng, gf.lat, gf.lng);
    const inside = dist <= gf.radiusMeters;
    
    // Check state change
    if (gf.wasInside !== inside) {
      gf.wasInside = inside;
      const status = inside ? 'ENTERED' : 'EXITED';
      const alert = {
        id: Date.now(),
        type: 'GEOFENCE',
        geofenceName: gf.name,
        status: status,
        message: `Child's phone has ${status} geofence zone: ${gf.name}`,
        timestamp: Date.now()
      };
      dbState.alertLogs.unshift(alert);
      io.emit('geofence_alert', alert);
      saveDb();
    }
  });
}

// Simulated GPS Movement Interval for Testing
setInterval(() => {
  if (dbState.childDevice.online && !dbState.childDevice.locked) {
    // Add micro variations to simulate live walk/drive
    const latOffset = (Math.random() - 0.5) * 0.0003;
    const lngOffset = (Math.random() - 0.5) * 0.0003;
    
    dbState.childDevice.currentLocation.lat += latOffset;
    dbState.childDevice.currentLocation.lng += lngOffset;
    dbState.childDevice.currentLocation.timestamp = Date.now();
    dbState.childDevice.currentLocation.speed = Math.floor(Math.random() * 5); // 0-5 km/h

    dbState.childDevice.locationHistory.unshift({ ...dbState.childDevice.currentLocation });
    if (dbState.childDevice.locationHistory.length > 100) {
      dbState.childDevice.locationHistory.pop();
    }

    checkGeofences(dbState.childDevice.currentLocation);
    io.emit('location_update', dbState.childDevice.currentLocation);
  }
}, 5000);

// REST APIs
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    device: dbState.childDevice,
    geofences: dbState.geofences,
    alerts: dbState.alertLogs.slice(0, 20)
  });
});

app.post('/api/geofences', (req, res) => {
  const { name, lat, lng, radiusMeters } = req.body;
  const newGf = {
    id: `gf-${Date.now()}`,
    name: name || 'New Zone',
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radiusMeters: parseInt(radiusMeters) || 200,
    active: true
  };
  dbState.geofences.push(newGf);
  saveDb();
  io.emit('geofences_updated', dbState.geofences);
  res.json({ success: true, geofence: newGf });
});

app.delete('/api/geofences/:id', (req, res) => {
  dbState.geofences = dbState.geofences.filter(g => g.id !== req.params.id);
  saveDb();
  io.emit('geofences_updated', dbState.geofences);
  res.json({ success: true });
});

// Socket.io Real-Time Event Handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state
  socket.emit('initial_state', dbState);

  // Parent commands
  socket.on('parent_command_lock', (locked) => {
    dbState.childDevice.locked = !!locked;
    console.log(`[Command] Phone lock set to: ${dbState.childDevice.locked}`);
    saveDb();
    io.emit('device_status_update', { locked: dbState.childDevice.locked });
    io.emit('child_command_lock', dbState.childDevice.locked);
  });

  socket.on('parent_toggle_app_block', ({ packageName, isBlocked }) => {
    const appItem = dbState.childDevice.installedApps.find(a => a.packageName === packageName);
    if (appItem) {
      appItem.isBlocked = isBlocked;
      saveDb();
      io.emit('apps_updated', dbState.childDevice.installedApps);
    }
  });

  // WebRTC Stream Signaling
  socket.on('webrtc_stream_request', (data) => {
    console.log('[WebRTC] Parent requested live stream:', data);
    io.emit('child_start_stream', data);
  });

  socket.on('webrtc_offer', (offer) => {
    socket.broadcast.emit('webrtc_offer', offer);
  });

  socket.on('webrtc_answer', (answer) => {
    socket.broadcast.emit('webrtc_answer', answer);
  });

  socket.on('webrtc_ice_candidate', (candidate) => {
    socket.broadcast.emit('webrtc_ice_candidate', candidate);
  });

  // Child app incoming location update
  socket.on('child_location_update', (loc) => {
    dbState.childDevice.currentLocation = {
      ...loc,
      timestamp: Date.now()
    };
    dbState.childDevice.locationHistory.unshift(dbState.childDevice.currentLocation);
    checkGeofences(dbState.childDevice.currentLocation);
    saveDb();
    io.emit('location_update', dbState.childDevice.currentLocation);
  });

  // Child app incoming notification
  socket.on('child_notification_received', (notif) => {
    const newNotif = {
      id: Date.now(),
      ...notif,
      timestamp: Date.now()
    };
    dbState.childDevice.notifications.unshift(newNotif);
    if (dbState.childDevice.notifications.length > 50) dbState.childDevice.notifications.pop();
    saveDb();
    io.emit('notification_received', newNotif);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Parental Control Backend Server running on http://localhost:${PORT}`);
});
