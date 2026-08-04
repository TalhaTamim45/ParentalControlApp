import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { ParentLogin } from './components/ParentLogin';
import { DeviceManager, DeviceItem } from './components/DeviceManager';
import { MapPin, Eye, AppWindow, Bell, ShieldCheck, Smartphone, Construction } from 'lucide-react';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || window.location.origin;

export const App: React.FC = () => {
  const [parentToken, setParentToken] = useState<string | null>(() => sessionStorage.getItem('parent_token'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'map' | 'stream' | 'apps' | 'notifications' | 'geofence'>('devices');

  const [registeredDevices, setRegisteredDevices] = useState<DeviceItem[]>([]);
  const [activeDevice, setActiveDevice] = useState<{ id: string; name: string; online: boolean } | null>(null);

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
        setRegisteredDevices(data.devices);
        if (data.devices.length > 0) {
          const first = data.devices[0];
          setActiveDevice({ id: first.id, name: first.name, online: first.online });
        } else {
          setActiveDevice(null);
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
      setActiveDevice((prev) => (prev && prev.id === deviceId ? { ...prev, online } : prev));
    });

    newSocket.on('device_registered', (newDev) => {
      setRegisteredDevices((prev) => {
        const exists = prev.some((d) => d.id === newDev.id);
        if (exists) return prev.map((d) => (d.id === newDev.id ? { ...d, ...newDev } : d));
        return [newDev, ...prev];
      });
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
        battery={0}
        charging={false}
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
            onRefresh={fetchRegisteredDevices}
          />
        )}

        {activeTab !== 'devices' && (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-amber-400">
              <Construction className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Not Implemented Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              This feature is scheduled for a future development milestone.
              Per project architecture rules, no simulated or mock data is displayed.
            </p>
            <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold rounded-full">
              Milestone 3 Focus: Secure Pairing & Registration Only
            </span>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
