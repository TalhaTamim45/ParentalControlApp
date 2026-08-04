const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const env = require('./src/config/env');

const parentAuthRoutes = require('./src/routes/parentAuthRoutes');
const pairingRoutes = require('./src/routes/pairingRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');

const { socketAuthenticate } = require('./src/socket/socketAuth');
const { registerSocketHandlers } = require('./src/socket/socketHandler');
const deviceService = require('./src/services/deviceService');
const presenceService = require('./src/services/presenceService');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

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

// General Status Endpoint (Public health check)
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'Parental Control Backend Server',
    version: '1.0.0'
  });
});

// Socket.io Middleware & Handlers
io.use(socketAuthenticate);
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`[Server] Parental Control Backend Server running on http://localhost:${PORT}`);
});

module.exports = { app, server };
