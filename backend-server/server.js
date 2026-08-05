const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const env = require('./src/config/env');
const { runMigrations } = require('./src/storage/dbPool');

const parentAuthRoutes = require('./src/routes/parentAuthRoutes');
const pairingRoutes = require('./src/routes/pairingRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const locationRoutes = require('./src/routes/locationRoutes');


const { socketAuthenticate } = require('./src/socket/socketAuth');
const { registerSocketHandlers } = require('./src/socket/socketHandler');

const app = express();
app.use(cors());

// Diagnostic HTTP Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) IP: ${req.ip || req.socket.remoteAddress} UA: "${req.get('user-agent') || 'none'}"`);
  });
  next();
});

app.use(express.json({ limit: '1mb' }));

// Serve Parent Dashboard Static SPA Bundle at root '/'
const dashboardDistPath = path.join(__dirname, '../parent-dashboard/dist');
app.use(express.static(dashboardDistPath));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach socket server instance to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// REST Routes
app.use('/api/parent', parentAuthRoutes);
app.use('/api/pairing', pairingRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/location', locationRoutes);


// General Status Endpoint (Public health check)
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'Parental Control Backend Server',
    version: '1.0.0'
  });
});

// SPA Route Fallback: Any non-API request returns static index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(dashboardDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Parent Dashboard static build not found. Run npm run build in parent-dashboard first.');
    }
  });
});

// Socket.io Middleware & Handlers
io.use(socketAuthenticate);
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

// Run DB Migrations if PostgreSQL configured
runMigrations();

const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`[Server] Unified Parental Control Server running on http://localhost:${PORT}`);
});

module.exports = { app, server };
