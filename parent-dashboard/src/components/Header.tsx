import React from 'react';
import { Battery, BatteryCharging, ShieldAlert, Lock, Unlock, Smartphone, Wifi } from 'lucide-react';

interface HeaderProps {
  deviceName: string;
  online: boolean;
  battery: number;
  charging: boolean;
  locked: boolean;
  onToggleLock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  deviceName,
  online,
  battery,
  charging,
  locked,
  onToggleLock,
}) => {
  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Device */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Parent Shield</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Personal Edition
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>Target: <strong className="text-slate-200">{deviceName}</strong></span>
          </p>
        </div>
      </div>

      {/* Device Health Status */}
      <div className="flex items-center gap-4 text-sm">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <Wifi className={`w-4 h-4 ${online ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className={`text-xs font-medium ${online ? 'text-emerald-400' : 'text-slate-400'}`}>
            {online ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Battery Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          {charging ? (
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          ) : (
            <Battery className={`w-4 h-4 ${battery > 20 ? 'text-blue-400' : 'text-rose-400'}`} />
          )}
          <span className="text-xs font-semibold text-slate-200">{battery}%</span>
        </div>

        {/* Instant Emergency Lock Phone Toggle */}
        <button
          onClick={onToggleLock}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg ${
            locked
              ? 'bg-rose-600 hover:bg-rose-500 text-white glow-red'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white glow-blue'
          }`}
        >
          {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          <span>{locked ? 'PHONE LOCKED' : 'LOCK PHONE NOW'}</span>
        </button>
      </div>
    </header>
  );
};
