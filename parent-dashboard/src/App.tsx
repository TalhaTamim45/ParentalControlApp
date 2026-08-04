import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { ParentLogin } from './components/ParentLogin';
import { DeviceManager, DeviceItem } from './components/DeviceManager';
import { LiveMap } from './components/LiveMap';
import { RemoteStreamer } from './components/RemoteStreamer';
import { AppLockManager } from './components/AppLockManager';
import { NotificationFeed } from './components/NotificationFeed';
import { GeofenceManager } from './components/GeofenceManager';
import { MapPin, Eye, AppWindow, Bell, ShieldCheck, AlertCircle, Smartphone } from 'lucide-react';

const BACKEND_URL = 'http://localhost:4000';

export const App: React.FC = () => {
  const [parentToken, setParentToken] = useState<string | null>(() => sessionStorage.getItem('parent_token'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'map' | 'stream' | 'apps' | 'notifications' | 'geofence'>('devices');

  const [registeredDevices, setRegisteredDevices] = useState<DeviceItem[]>([]);
  const [device, setDevice] = useState<any>({
    name: "Child's Phone",
    online: false,
    battery: 84,
    charging: false,
    locked: false,
    currentLocation: { lat: 37.774929, lng: -122.419416, timestamp: Date.now() },
    locationHistory: [],
    installedApps: [],
    notifications: []
  });

  const [geofences, setGeofences] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Fetch real registered devices list
  const fetchRegisteredDevices = useCallback(async () => {
    if (!parentToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/devices`, {
        headers: { 'x-parent-token': parentToken }
      });
      if (res.status === 401) {
        // Token expired or invalid
        sessionStorage.removeItem('parent_token');
        setParentToken(null);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.devices)) {
        setRegisteredDevices(data.devices);
        if (data.devices.length > 0) {
          const first = data.devices[0];
          setDevice((prev: any) => ({
            ...prev,
            name: first.name,
            online: first.online
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  }, [parentToken]);

  // Handle Socket & Device sync
  useEffect(() => {
    if (!parentToken) return;

    fetchRegisteredDevices();

    const newSocket = io(BACKEND_URL, {
      auth: {
        role: 'parent',
        token: parentToken
      }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected as authenticated Parent');
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    newSocket.on('device_presence_changed', ({ deviceId, online, lastSeen }) => {
      setRegisteredDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, online, lastSeen: lastSeen || Date.now() } : d))
      );
    });

    newSocket.on('device_registered', (newDev) => {
      setRegisteredDevices((prev) => {
        const exists = prev.some((d) => d.id === newDev.id);
        if (exists) return prev.map((d) => (d.id === newDev.id ? { ...d, ...newDev } : d));
        return [newDev, ...prev];
      });
    });

    newSocket.on('initial_state', (data) => {
      if (data.geofences) setGeofences(data.geofences);
      if (data.alertLogs) setAlerts(data.alertLogs);
    });

    newSocket.on('location_update', (loc) => {
      setDevice((prev: any) => ({
        ...prev,
        currentLocation: loc,
        locationHistory: [loc, ...prev.locationHistory.slice(0, 99)]
      }));
    });

    newSocket.on('device_status_update', (status) => {
      setDevice((prev: any) => ({ ...prev, ...status }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [parentToken, fetchRegisteredDevices]);

  const handleLogout = () => {
    if (parentToken) {
      fetch(`${BACKEND_URL}/api/parent/logout`, {
        method: 'POST',
        headers: { 'x-parent-token': parentToken }
      }).catch(() => {});
    }
    sessionStorage.removeItem('parent_token');
    setParentToken(null);
  };

  const handleToggleLock = () => {
    if (socket) {
      socket.emit('parent_command_lock', !device.locked);
    }
  };

  const handleToggleAppBlock = (packageName: string, isBlocked: boolean) => {
    if (socket) {
      socket.emit('parent_toggle_app_block', { packageName, isBlocked });
    }
  };

  const handleAddGeofence = (name: string, lat: number, lng: number, radiusMeters: number) => {
    fetch(`${BACKEND_URL}/api/geofences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-parent-token': parentToken || '' },
      body: JSON.stringify({ name, lat, lng, radiusMeters })
    });
  };

  const handleDeleteGeofence = (id: string) => {
    fetch(`${BACKEND_URL}/api/geofences/${id}`, {
      method: 'DELETE',
      headers: { 'x-parent-token': parentToken || '' }
    });
  };

  const handleStartStream = (type: any) => {
    if (socket) {
      socket.emit('webrtc_stream_request', { type });
    }
  };

  const handleStopStream = () => {};

  if (!parentToken) {
    return <ParentLogin onLoginSuccess={setParentToken} backendUrl={BACKEND_URL} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header
        deviceName={device.name}
        online={device.online}
        battery={device.battery}
        charging={device.charging}
        locked={device.locked}
        onToggleLock={handleToggleLock}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        
        {/* Banner Alert for Recent Geofence Breaches */}
        {alerts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Latest Alert:</strong> {alerts[0].message} ({new Date(alerts[0].timestamp).toLocaleTimeString()})</span>
            </div>
            <button onClick={() => setAlerts([])} className="text-amber-400 hover:underline">Dismiss</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition ${
              activeTab === 'devices'
                ? 'bg-blue-600 text-white glow-blue'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" /> Devices ({registeredDevices.length})
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white glow-blue'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" /> Live Map & GPS
          </button>

          <button
            onClick={() => setActiveTab('stream')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition ${
              activeTab === 'stream'
                ? 'bg-indigo-600 text-white glow-blue'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" /> Remote Inspection
          </button>

          <button
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition ${
              activeTab === 'apps'
                ? 'bg-purple-600 text-white glow-blue'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <AppWindow className="w-4 h-4" /> App Rules
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition ${
              activeTab === 'notifications'
                ? 'bg-amber-600 text-white glow-blue'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>

          <button
            onClick={() => setActiveTab('geofence')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition ${
              activeTab === 'geofence'
                ? 'bg-emerald-600 text-white glow-green'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Geofences
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'devices' && (
          <DeviceManager
            devices={registeredDevices}
            token={parentToken}
            backendUrl={BACKEND_URL}
            onRefresh={fetchRegisteredDevices}
          />
        )}

        {activeTab !== 'devices' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {activeTab === 'map' && (
                <LiveMap
                  currentLocation={device.currentLocation}
                  locationHistory={device.locationHistory}
                  geofences={geofences}
                />
              )}
              {activeTab === 'stream' && (
                <RemoteStreamer
                  onStartStream={handleStartStream}
                  onStopStream={handleStopStream}
                />
              )}
              {activeTab === 'apps' && (
                <AppLockManager
                  apps={device.installedApps}
                  onToggleBlock={handleToggleAppBlock}
                />
              )}
              {activeTab === 'notifications' && (
                <NotificationFeed notifications={device.notifications} />
              )}
              {activeTab === 'geofence' && (
                <GeofenceManager
                  geofences={geofences}
                  currentLat={device.currentLocation.lat}
                  currentLng={device.currentLocation.lng}
                  onAddGeofence={handleAddGeofence}
                  onDeleteGeofence={handleDeleteGeofence}
                />
              )}
            </div>

            {/* Quick Summary Sidebar */}
            <div className="space-y-6">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Child Device Overview
                </h3>
                
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 font-medium">Paired Device:</span>
                    <span className="font-bold text-slate-200">{device.name}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Lock State:</span>
                    <span className={`font-bold ${device.locked ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {device.locked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Registered Devices:</span>
                    <span className="font-bold text-blue-400">{registeredDevices.length} Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
