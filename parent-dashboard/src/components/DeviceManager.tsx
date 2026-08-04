import React, { useState, useEffect } from 'react';
import { Smartphone, Plus, RefreshCw, Copy, Check, ShieldAlert, Trash2, Clock, Wifi, WifiOff } from 'lucide-react';

export interface DeviceItem {
  id: string;
  name: string;
  online: boolean;
  lastSeen: number;
  pairedAt?: number;
}

interface DeviceManagerProps {
  devices: DeviceItem[];
  token: string;
  backendUrl: string;
  onRefresh: () => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({ devices, token, backendUrl, onRefresh }) => {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unpairingId, setUnpairingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Countdown timer for pairing code
  useEffect(() => {
    if (!codeExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((codeExpiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setPairingCode(null);
        setCodeExpiresAt(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const handleGenerateCode = async () => {
    setGenerating(true);
    setActionError(null);
    try {
      const res = await fetch(`${backendUrl}/api/pairing/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-token': token
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate code');
      }
      setPairingCode(data.code);
      setCodeExpiresAt(data.expiresAt);
      setSecondsLeft(Math.floor((data.expiresAt - Date.now()) / 1000));
    } catch (err: any) {
      setActionError(err.message || 'Failed to generate pairing code.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnpair = async (deviceId: string) => {
    setActionError(null);
    try {
      const res = await fetch(`${backendUrl}/api/devices/${deviceId}/unpair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-parent-token': token
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpair device');
      }
      setUnpairingId(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'Failed to unpair device.');
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatLastSeen = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-400" /> Paired Devices
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage real registered child devices and presence status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>

          <button
            onClick={handleGenerateCode}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs text-white font-semibold flex items-center gap-2 transition shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Generate Pairing Code
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Pairing Code Modal */}
      {pairingCode && (
        <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 bg-blue-950/20 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Temporary Pairing Code</span>
              <h3 className="text-base font-bold text-white mt-1">Enter this code on the Child Android App</h3>
            </div>
            <button
              onClick={() => setPairingCode(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-widest text-blue-400 flex-1 text-center">
              {pairingCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Expiration: <strong className="text-amber-300 font-mono">{formatSeconds(secondsLeft)}</strong>
            </span>
            <span>One-time use only. Invalidated immediately after pairing.</span>
          </div>
        </div>
      )}

      {/* Devices List */}
      {devices.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Registered Devices Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Generate Pairing Code" above, then open the Child Companion App on your child's phone and enter the 6-digit code.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    d.online ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{d.name}</h4>
                    <span className="text-[11px] font-mono text-slate-500">ID: {d.id}</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                  d.online
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {d.online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {d.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-800/80 pt-3 text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Last Seen:</span>
                  <span className="font-semibold text-slate-200">{formatLastSeen(d.lastSeen)}</span>
                </div>
                {d.pairedAt && (
                  <div className="flex items-center justify-between">
                    <span>Paired Date:</span>
                    <span className="text-slate-300">{new Date(d.pairedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                {unpairingId === d.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-400 font-semibold">Unpair device?</span>
                    <button
                      onClick={() => handleUnpair(d.id)}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Yes, Revoke
                    </button>
                    <button
                      onClick={() => setUnpairingId(null)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setUnpairingId(d.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Unpair Device
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
