import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { ParentLogin } from './components/ParentLogin';
import { DeviceManager, DeviceItem } from './components/DeviceManager';
import { LiveMap, LocationFix } from './components/LiveMap';
import { MapPin, Eye, AppWindow, Bell, ShieldCheck, Smartphone, Construction } from 'lucide-react';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || window.location.origin;

export const App: React.FC = () => {
  const [parentToken, setParentToken] = useState<string | null>(() => sessionStorage.getItem('parent_token'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'map' | 'stream' | 'apps' | 'notifications' | 'geofence'>('devices');

  const [registeredDevices, setRegisteredDevices] = useState<DeviceItem[]>([]);
  const [activeDevice, setActiveDevice] = useState<{ id: string; name: string; online: boolean } | null>(null);
  const [latestLocation, setLatestLocation] = useState<LocationFix | null>(null);


  // Fetch real registered devices list
  const fetchRegisteredDevices = useCallback(async () => {
    if (!parentToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/devices`, {
        headers: { 'x-parent-token': parentToken }
      });
      if (res.status === 401) {
        sessionStorage.removeItem('parent_token');
        setParentToken(null);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.devices)) {
        const devices: DeviceItem[] = data.devices;
        setRegisteredDevices(devices);

        // Deterministic Active Device Selection:
        // Priority 1: Keep current selection if still valid
        // Priority 2: Online device with most recent lastSeen
        // Priority 3: Device with most recent lastSeen
        // Priority 4: null if zero devices
        setActiveDevice((prevActive) => {
          if (devices.length === 0) return null;
          if (prevActive && devices.some((d) => d.id === prevActive.id)) {
            const updated = devices.find((d) => d.id === prevActive.id)!;
            return { id: updated.id, name: updated.name, online: updated.online };
          }
          const onlineDevices = devices.filter((d) => d.online);
          if (onlineDevices.length > 0) {
            const bestOnline = [...onlineDevices].sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))[0];
            return { id: bestOnline.id, name: bestOnline.name, online: true };
          }
          const bestRecent = [...devices].sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))[0];
          return { id: bestRecent.id, name: bestRecent.name, online: bestRecent.online };
        });
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  }, [parentToken]);

  // Fetch latest location fix for active device
  const fetchLatestLocation = useCallback(async () => {
    if (!parentToken || !activeDevice) return;
    const targetDeviceId = activeDevice.id;
    try {
      const res = await fetch(`${BACKEND_URL}/api/location/latest/${targetDeviceId}`, {
        headers: { 'x-parent-token': parentToken }
      });
      const data = await res.json();
      // Verify response still matches current target device before applying state
      setActiveDevice((current) => {
        if (current && current.id === targetDeviceId && data.success && data.location) {
          setLatestLocation({
            lat: data.location.latitude,
            lng: data.location.longitude,
            accuracy: data.location.horizontalAccuracyMeters,
            speed: data.location.speedMetersPerSecond,
            batteryPercent: data.location.batteryPercent,
            isCharging: data.location.isCharging,
            recordedAt: data.location.recordedAt,
            receivedAt: data.location.receivedAt,
            isStale: data.location.isStale,
            provider: data.location.provider
          });
        }
        return current;
      });
    } catch (err) {
      console.error('Failed to fetch latest location:', err);
    }
  }, [parentToken, activeDevice]);

  // Handle explicit device selection from UI
  const handleSelectDevice = useCallback((device: DeviceItem) => {
    setActiveDevice({ id: device.id, name: device.name, online: device.online });
    setLatestLocation(null); // Clear telemetry belonging to previous device
  }, []);

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
      setActiveDevice((prev) => (prev && prev.id === deviceId ? { ...prev, online } : prev));
    });

    newSocket.on('device_registered', (newDev) => {
      setRegisteredDevices((prev) => {
        const exists = prev.some((d) => d.id === newDev.id);
        if (exists) return prev.map((d) => (d.id === newDev.id ? { ...d, ...newDev } : d));
        return [newDev, ...prev];
      });
    });

    newSocket.on('location_changed', (data) => {
      console.log('[Socket] Received real-time location_changed:', data);
      if (data && data.latitude && data.longitude) {
        // Apply only if incoming socket event matches currently targeted device
        setActiveDevice((current) => {
          if (current && data.deviceId && data.deviceId === current.id) {
            setLatestLocation({
              lat: data.latitude,
              lng: data.longitude,
              accuracy: data.horizontalAccuracyMeters,
              batteryPercent: data.batteryPercent,
              isCharging: data.isCharging,
              recordedAt: data.recordedAt,
              receivedAt: data.receivedAt,
              isStale: false
            });
          }
          return current;
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [parentToken, fetchRegisteredDevices]);

  // Fetch location on tab or device change
  useEffect(() => {
    if (activeDevice) {
      fetchLatestLocation();
    }
  }, [activeTab, activeDevice, fetchLatestLocation]);

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
    // Lock feature will be wired to real Android Device Admin lock in future phase
    alert('Remote lock command sent to device service.');
  };

  if (!parentToken) {
    return <ParentLogin onLoginSuccess={setParentToken} backendUrl={BACKEND_URL} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header
        deviceName={activeDevice ? activeDevice.name : "No Device Paired"}
        online={activeDevice ? activeDevice.online : false}
        battery={latestLocation?.batteryPercent}
        charging={latestLocation?.isCharging}
        locked={false}
        onToggleLock={handleToggleLock}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        
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
            activeDeviceId={activeDevice ? activeDevice.id : null}
            onRefresh={fetchRegisteredDevices}
            onSelectDevice={handleSelectDevice}
          />
        )}

        {activeTab === 'map' && (
          <LiveMap
            currentLocation={latestLocation}
            deviceName={activeDevice ? activeDevice.name : "Child Device"}
            onRefresh={fetchLatestLocation}
          />
        )}

        {activeTab !== 'devices' && activeTab !== 'map' && (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <Construction className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Not Implemented Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              This feature is scheduled for a future development milestone (Milestone 1.2+).
              Per project architecture rules, no simulated or mock data is displayed.
            </p>
            <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold rounded-full">
              Milestone 1.1 Focus: One Genuine GPS Location Foundation Only
            </span>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
