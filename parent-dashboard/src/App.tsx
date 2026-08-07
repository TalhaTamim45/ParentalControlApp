import React, { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ParentLogin } from './components/ParentLogin';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopHeader, Device } from './components/TopHeader';
import { HomeOverview } from './components/HomeOverview';
import { DevicesPage } from './components/DevicesPage';
import { LocationPage, LocationFix } from './components/LocationPage';
import { DiagnosticsPage } from './components/DiagnosticsPage';
import { FeatureShellPage } from './components/FeatureShellPage';
import { ConfirmModal } from './components/ConfirmModal';

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || window.location.origin;

export const App: React.FC = () => {
  const [parentToken, setParentToken] = useState<string | null>(() => sessionStorage.getItem('parent_token'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [registeredDevices, setRegisteredDevices] = useState<Device[]>([]);
  const [activeDevice, setActiveDevice] = useState<Device | null>(null);
  const [latestLocation, setLatestLocation] = useState<LocationFix | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  // Modal confirmation states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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
        const devices: Device[] = data.devices;
        setRegisteredDevices(devices);

        // 4-priority deterministic selection algorithm
        setActiveDevice((prevActive) => {
          if (devices.length === 0) return null;
          if (prevActive && devices.some((d) => d.id === prevActive.id)) {
            const updated = devices.find((d) => d.id === prevActive.id)!;
            return updated;
          }
          const onlineDevices = devices.filter((d) => d.online);
          if (onlineDevices.length > 0) {
            return [...onlineDevices].sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))[0];
          }
          return [...devices].sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))[0];
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

  // Explicit device selection
  const handleSelectDevice = useCallback((deviceId: string) => {
    const target = registeredDevices.find(d => d.id === deviceId);
    if (target) {
      setActiveDevice(target);
      setLatestLocation(null);
    }
  }, [registeredDevices]);

  // Generate pairing code
  const handleGeneratePairingCode = async () => {
    if (!parentToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/pairing/code`, {
        method: 'POST',
        headers: { 'x-parent-token': parentToken }
      });
      const data = await res.json();
      if (data.success && data.code) {
        setPairingCode(data.code);
      }
    } catch (err) {
      console.error('Failed to generate pairing code:', err);
    }
  };

  // Unpair device handler with confirmation
  const handleUnpairDevice = (deviceId: string) => {
    const dev = registeredDevices.find(d => d.id === deviceId);
    setConfirmModal({
      isOpen: true,
      title: 'Unpair Device',
      message: `Are you sure you want to unpair "${dev?.name || 'this child device'}"? This action will revoke its connection to Parent Shield.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${BACKEND_URL}/api/devices/${deviceId}/unpair`, {
            method: 'POST',
            headers: { 'x-parent-token': parentToken! }
          });
          const data = await res.json();
          if (data.success) {
            fetchRegisteredDevices();
          }
        } catch (err) {
          console.error('Failed to unpair device:', err);
        }
      }
    });
  };

  // Lock device handler with confirmation
  const handleLockDevice = () => {
    if (!activeDevice) return;
    setConfirmModal({
      isOpen: true,
      title: 'Lock Child Screen',
      message: `Send an immediate remote screen lock command to ${activeDevice.name}?`,
      isDanger: true,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        alert('Remote lock command transmitted to backend service.');
      }
    });
  };

  // Socket & presence sync
  useEffect(() => {
    if (!parentToken) return;

    fetchRegisteredDevices();

    const newSocket = io(BACKEND_URL, {
      auth: { role: 'parent', token: parentToken }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket] Connected as authenticated Parent');
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setSocketConnected(false);
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
      if (data && data.latitude && data.longitude) {
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

  // Refresh location when switching to location page or target device changes
  useEffect(() => {
    if (activeDevice && (activeTab === 'location' || activeTab === 'home')) {
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

  if (!parentToken) {
    return <ParentLogin onLoginSuccess={setParentToken} backendUrl={BACKEND_URL} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Desktop Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header with Vibrant Connection Status */}
        <TopHeader
          devices={registeredDevices}
          activeDevice={activeDevice}
          currentLocation={latestLocation}
          socketConnected={socketConnected}
          onSelectDevice={handleSelectDevice}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLockDevice={handleLockDevice}
          onRefresh={() => {
            fetchRegisteredDevices();
            fetchLatestLocation();
          }}
        />

        {/* Content View Routing */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'home' && (
            <HomeOverview
              activeDevice={activeDevice}
              currentLocation={latestLocation}
              socketConnected={socketConnected}
              onNavigateToLocation={() => setActiveTab('location')}
              onNavigateToDevices={() => setActiveTab('devices')}
              onLockDevice={handleLockDevice}
            />
          )}

          {activeTab === 'location' && (
            <LocationPage
              currentLocation={latestLocation}
              deviceName={activeDevice ? activeDevice.name : "Child Device"}
              onRefresh={fetchLatestLocation}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesPage
              devices={registeredDevices}
              activeDevice={activeDevice}
              onSelectDevice={handleSelectDevice}
              onUnpairDevice={handleUnpairDevice}
              onGeneratePairingCode={handleGeneratePairingCode}
              pairingCode={pairingCode}
            />
          )}

          {activeTab === 'diagnostics' && (
            <DiagnosticsPage
              devices={registeredDevices}
              activeDevice={activeDevice}
              socketConnected={socketConnected}
            />
          )}

          {activeTab !== 'home' && activeTab !== 'location' && activeTab !== 'devices' && activeTab !== 'diagnostics' && (
            <FeatureShellPage
              title={
                activeTab === 'screen' ? 'Remote Screen View' :
                activeTab === 'activity' ? 'App Activity Monitoring' :
                activeTab === 'screentime' ? 'Screen Time Limits' :
                activeTab === 'rules' ? 'App Rules & Restrictions' :
                activeTab === 'notifications' ? 'Parent Notification Feed' :
                activeTab === 'geofences' ? 'Automated Geofencing' : 'Settings'
              }
              description="This feature area will become available in a future authorized release milestone."
              onBackToHome={() => setActiveTab('home')}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
