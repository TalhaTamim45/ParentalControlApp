import React, { useState } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Battery, 
  Zap, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  HardDrive
} from 'lucide-react';
import { Device } from './TopHeader';

interface DevicesPageProps {
  devices: Device[];
  activeDevice: Device | null;
  onSelectDevice: (deviceId: string) => void;
  onUnpairDevice: (deviceId: string) => void;
  onGeneratePairingCode: () => void;
  pairingCode?: string | null;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({
  devices,
  activeDevice,
  onSelectDevice,
  onUnpairDevice,
  onGeneratePairingCode,
  pairingCode
}) => {
  const [deviceToUnpair, setDeviceToUnpair] = useState<string | null>(null);

  const formatLastSeen = (timestamp?: number) => {
    if (!timestamp) return 'Not available';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Paired Child Devices</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your connected child phones and pair new devices safely.
          </p>
        </div>

        <button
          onClick={onGeneratePairingCode}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Pair New Child Device</span>
        </button>
      </div>

      {/* Pairing Code Banner */}
      {pairingCode && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-2 animate-fade-in">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Fresh Pairing Code</p>
          <div className="text-3xl font-extrabold tracking-widest font-mono text-blue-900">
            {pairingCode}
          </div>
          <p className="text-xs text-blue-700 max-w-md mx-auto">
            Enter this 6-digit code in the Child Android App to pair the device safely. Code expires in 15 minutes.
          </p>
        </div>
      )}

      {/* Device List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {devices.map(device => {
          const isCurrentTarget = activeDevice?.id === device.id;

          return (
            <div 
              key={device.id}
              className={`bg-white rounded-2xl p-6 border transition space-y-5 ${
                isCurrentTarget 
                  ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' 
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isCurrentTarget ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{device.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 ${
                        device.online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {device.online ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3" />}
                        <span>{device.online ? 'Online' : 'Offline'}</span>
                      </span>
                      {isCurrentTarget && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          CURRENT TARGET
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-4 py-3 px-4 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Last Seen</span>
                  <span className="font-semibold text-slate-700">{formatLastSeen(device.lastSeen)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Battery</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                    {device.batteryPercent !== undefined ? `${device.batteryPercent}%` : '—'}
                    {device.isCharging && <Zap className="w-3 h-3 text-amber-500 fill-current" />}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                {!isCurrentTarget ? (
                  <button
                    onClick={() => onSelectDevice(device.id)}
                    className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200/60 transition text-center"
                  >
                    Select Target
                  </button>
                ) : (
                  <div className="flex-1 py-2 px-3 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200/60 text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Active Selection</span>
                  </div>
                )}

                <button
                  onClick={() => onUnpairDevice(device.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                  title="Unpair Device"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
