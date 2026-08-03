import React, { useState } from 'react';
import { Camera, Monitor, Mic, MicOff, RefreshCw, CameraOff, Play, Square, Eye } from 'lucide-react';

interface RemoteStreamerProps {
  onStartStream: (type: 'front_camera' | 'back_camera' | 'screen_mirror' | 'audio_only') => void;
  onStopStream: () => void;
}

export const RemoteStreamer: React.FC<RemoteStreamerProps> = ({ onStartStream, onStopStream }) => {
  const [activeStream, setActiveStream] = useState<'none' | 'front_camera' | 'back_camera' | 'screen_mirror' | 'audio_only'>('none');
  const [micActive, setMicActive] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const handleStart = (type: 'front_camera' | 'back_camera' | 'screen_mirror' | 'audio_only') => {
    setActiveStream(type);
    onStartStream(type);
  };

  const handleStop = () => {
    setActiveStream('none');
    setMicActive(false);
    onStopStream();
  };

  const takeSnapshot = () => {
    // Generate simulated snapshot representation
    setSnapshotUrl(`https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=600&auto=format&fit=crop&q=60`);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-[480px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Live Remote Inspection</h2>
        </div>
        {activeStream !== 'none' && (
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            LIVE STREAMING: {activeStream.toUpperCase().replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Stream Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <button
          onClick={() => handleStart('front_camera')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition-all border ${
            activeStream === 'front_camera'
              ? 'bg-blue-600 border-blue-400 text-white glow-blue'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4 text-blue-400" />
          Front Camera
        </button>

        <button
          onClick={() => handleStart('back_camera')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition-all border ${
            activeStream === 'back_camera'
              ? 'bg-indigo-600 border-indigo-400 text-white glow-blue'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          Rear Camera
        </button>

        <button
          onClick={() => handleStart('screen_mirror')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition-all border ${
            activeStream === 'screen_mirror'
              ? 'bg-purple-600 border-purple-400 text-white glow-blue'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Monitor className="w-4 h-4 text-purple-400" />
          Screen Mirror
        </button>

        <button
          onClick={() => setMicActive(!micActive)}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition-all border ${
            micActive
              ? 'bg-emerald-600 border-emerald-400 text-white glow-green'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {micActive ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-slate-400" />}
          {micActive ? 'Mic Active' : 'Listen Mic'}
        </button>
      </div>

      {/* Viewport Display Container */}
      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center">
        {activeStream === 'none' ? (
          <div className="text-center p-6 text-slate-500 flex flex-col items-center">
            <CameraOff className="w-12 h-12 mb-3 text-slate-700 stroke-1" />
            <p className="text-sm font-medium text-slate-400">Remote Inspection Idle</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xs">
              Select a camera mode, screen mirror, or audio listener above to request instant WebRTC feed.
            </p>
          </div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
            {/* Visual indicator / Stream simulation frame */}
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              {activeStream === 'screen_mirror' ? (
                <div className="w-48 h-80 bg-slate-950 rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden relative flex flex-col justify-between p-3 text-center">
                  <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto mb-2"></div>
                  <div className="flex-1 bg-gradient-to-b from-indigo-950 to-slate-900 rounded-xl p-3 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">📱</span>
                    <p className="text-xs font-bold text-indigo-300">TikTok Active</p>
                    <p className="text-[10px] text-slate-400 mt-1">Screen Mirroring 1080p</p>
                  </div>
                  <div className="w-8 h-1 bg-slate-700 rounded-full mx-auto"></div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center relative">
                  <img
                    src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=60"
                    alt="Camera Feed"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs text-slate-200">
                    Live Feed (30 FPS)
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 shadow-2xl">
              <button
                onClick={takeSnapshot}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Take Snapshot
              </button>
              <button
                onClick={handleStop}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                Stop Feed
              </button>
            </div>
          </div>
        )}
      </div>

      {snapshotUrl && (
        <div className="mt-3 p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <span>📸 Snapshot Captured: {new Date().toLocaleTimeString()}</span>
          <button onClick={() => setSnapshotUrl(null)} className="text-blue-400 hover:underline">Dismiss</button>
        </div>
      )}
    </div>
  );
};
