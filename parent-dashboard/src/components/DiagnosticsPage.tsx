import React from 'react';
import { Terminal, HardDrive, Cpu, Radio, ShieldCheck, Database } from 'lucide-react';
import { Device } from './TopHeader';

interface DiagnosticsPageProps {
  devices: Device[];
  activeDevice: Device | null;
  socketConnected?: boolean;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  devices,
  activeDevice,
  socketConnected = true
}) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono">Developer Diagnostics</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Engineering inspection area for technical leads & developers.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
        {/* Active Selection Diagnostics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 space-y-4">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4" />
            <span>Active Target State</span>
          </h3>

          <div className="space-y-2.5">
            <div>
              <span className="text-slate-500 block">Sanitized Device ID:</span>
              <span className="text-slate-200 font-semibold">{activeDevice ? `${activeDevice.id.substring(0, 8)}...${activeDevice.id.slice(-4)}` : 'None'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Display Name:</span>
              <span className="text-slate-200">{activeDevice?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Online Status:</span>
              <span className={activeDevice?.online ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {activeDevice?.online ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Last Seen Timestamp:</span>
              <span className="text-slate-200">{activeDevice?.lastSeen ? new Date(activeDevice.lastSeen).toISOString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Database & Socket Connection Diagnostics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Radio className="w-4 h-4" />
            <span>Socket.io & Persistence Diagnostics</span>
          </h3>

          <div className="space-y-2.5">
            <div>
              <span className="text-slate-500 block">Parent Socket Connection:</span>
              <span className={socketConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {socketConnected ? 'CONNECTED (HTTP/1.1 WebSocket)' : 'DISCONNECTED'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Database Records:</span>
              <span className="text-slate-200 font-semibold">{devices.length} Devices</span>
            </div>
            <div>
              <span className="text-slate-500 block">Active Online Count:</span>
              <span className="text-emerald-400 font-semibold">{devices.filter(d => d.online).length} Devices</span>
            </div>
            <div>
              <span className="text-slate-500 block">Storage Engine:</span>
              <span className="text-slate-200">DevStorage JSON (db.json)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
