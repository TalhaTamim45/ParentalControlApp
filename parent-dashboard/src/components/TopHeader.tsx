import React, { useState } from 'react';
import { 
  Menu, 
  Smartphone, 
  Battery, 
  Zap, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  Lock, 
  RefreshCw, 
  CheckCircle2,
  Radio
} from 'lucide-react';
import { LocationFix } from './LocationPage';

export interface Device {
  id: string;
  name: string;
  online: boolean;
  lastSeen: number;
  batteryPercent?: number;
  isCharging?: boolean;
}

interface TopHeaderProps {
  devices: Device[];
  activeDevice: Device | null;
  currentLocation: LocationFix | null;
  socketConnected?: boolean;
  onSelectDevice: (deviceId: string) => void;
  onOpenMobileMenu: () => void;
  onLockDevice: () => void;
  onRefresh: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  devices,
  activeDevice,
  currentLocation,
  socketConnected = true,
  onSelectDevice,
  onOpenMobileMenu,
  onLockDevice,
  onRefresh
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'Not available';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const activeBattery = currentLocation?.batteryPercent ?? activeDevice?.batteryPercent;
  const activeCharging = currentLocation?.isCharging ?? activeDevice?.isCharging;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 hover:text-slate-900 lg:hidden rounded-xl hover:bg-slate-100 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Selected Child/Device Selector */}
        <div className="relative">
          {activeDevice ? (
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 transition text-left group shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{activeDevice.name}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${activeDevice.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Synced: {formatLastSeen(activeDevice.lastSeen)}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 ml-1 transition" />
            </button>
          ) : (
            <div className="text-xs text-slate-400 font-medium px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
              No target device paired
            </div>
          )}

          {/* Child Dropdown Menu */}
          {isDropdownOpen && (
            <div 
              className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in"
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Child Device
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 px-1">
                {devices.map(device => {
                  const isSelected = activeDevice?.id === device.id;
                  return (
                    <button
                      key={device.id}
                      onClick={() => onSelectDevice(device.id)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition
                        ${isSelected ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-slate-50 text-slate-700'}
                      `}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Smartphone className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="truncate">{device.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${device.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 ml-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Header Telemetry & Connection Indicators */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Socket Server Connection Badge */}
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border shadow-2xs ${
          socketConnected 
            ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`} title={socketConnected ? 'Connected to backend server' : 'Reconnecting to server...'}>
          <Radio className={`w-3.5 h-3.5 ${socketConnected ? 'text-blue-600 animate-pulse' : 'text-amber-500'}`} />
          <span className="hidden lg:inline">{socketConnected ? 'Live Connection' : 'Connecting...'}</span>
        </span>

        {/* Device Status Pills */}
        {activeDevice && (
          <div className="hidden md:flex items-center gap-2 text-xs">
            {/* Device Online/Offline Badge */}
            <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 border shadow-2xs ${
              activeDevice.online 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {activeDevice.online ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Offline</span>
                </>
              )}
            </span>

            {/* Battery & Charging Telemetry */}
            <span className="px-2.5 py-1 rounded-lg font-bold bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <Battery className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeBattery !== undefined ? `${activeBattery}%` : '—'}</span>
              {activeCharging && <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />}
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200/60"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeDevice && (
            <button
              onClick={onLockDevice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Screen</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
