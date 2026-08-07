import React from 'react';
import { 
  MapPin, 
  Wifi, 
  WifiOff, 
  Battery, 
  Zap, 
  Clock, 
  Lock, 
  ShieldCheck, 
  Activity, 
  Bell, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Device } from './TopHeader';
import { LocationFix } from './LiveMap';

interface HomeOverviewProps {
  activeDevice: Device | null;
  currentLocation: LocationFix | null;
  onNavigateToLocation: () => void;
  onNavigateToDevices: () => void;
  onLockDevice: () => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  activeDevice,
  currentLocation,
  onNavigateToLocation,
  onNavigateToDevices,
  onLockDevice
}) => {
  const formatTime = (ts?: number) => {
    if (!ts) return 'Not available';
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isLocationFresh = currentLocation && !currentLocation.isStale;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-12 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Parent Shield Active Protection</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {activeDevice ? `Overview for ${activeDevice.name}` : 'Welcome to Parent Shield'}
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            {activeDevice 
              ? 'Real-time device status and location telemetry at a glance.' 
              : 'Select or pair a child device to view protection metrics.'}
          </p>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Location Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            {currentLocation ? (
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                isLocationFresh 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isLocationFresh ? 'FRESH FIX' : 'STALE (>15m)'}
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-500">
                NO FIX YET
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Child Location</h3>
            <p className="text-lg font-bold text-slate-900">
              {currentLocation ? 'Genuine Android Fix Available' : 'Location Not Shared Yet'}
            </p>
            <p className="text-xs text-slate-500">
              {currentLocation?.recordedAt 
                ? `Last update: ${formatTime(currentLocation.recordedAt)}` 
                : 'Tap View Location to refresh telemetry'}
            </p>
          </div>

          <button
            onClick={onNavigateToLocation}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 font-semibold text-xs rounded-xl border border-slate-200/80 hover:border-blue-200 transition flex items-center justify-center gap-2"
          >
            <span>View Live Map</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Device Health Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Wifi className="w-5 h-5" />
            </div>
            {activeDevice ? (
              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                activeDevice.online 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {activeDevice.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-500">
                UNPAIRED
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Device Telemetry</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-slate-400" />
                <span>Battery: {activeDevice?.batteryPercent !== undefined ? `${activeDevice.batteryPercent}%` : '—'}</span>
                {activeDevice?.isCharging && <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Last heartbeat: {activeDevice?.lastSeen ? formatTime(activeDevice.lastSeen) : 'N/A'}
            </p>
          </div>

          <button
            onClick={onNavigateToDevices}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 font-semibold text-xs rounded-xl border border-slate-200/80 hover:border-indigo-200 transition flex items-center justify-center gap-2"
          >
            <span>Manage Devices</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Lock Action Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              SAFETY ACTION
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Immediate Control</h3>
            <p className="text-lg font-bold text-slate-900">Remote Device Lock</p>
            <p className="text-xs text-slate-500">Instantly lock target child device screen.</p>
          </div>

          <button
            onClick={onLockDevice}
            disabled={!activeDevice}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Lock Device Now</span>
          </button>
        </div>
      </div>

      {/* Feature Coming Soon Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Screen Time & Usage</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Screen time limits and app usage reporting will become available once enabled in an authorized release.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Bell className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Automated Safety Geofences</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Geofence entry/exit boundary monitoring will become available when location Milestone 1.3 is authorized.
          </p>
        </div>
      </div>
    </div>
  );
};
