import React from 'react';
import { AppWindow, Lock, Unlock, Clock, AlertTriangle } from 'lucide-react';

interface AppItem {
  packageName: string;
  appName: string;
  icon: string;
  usageTodayMin: number;
  isBlocked: boolean;
}

interface AppLockManagerProps {
  apps: AppItem[];
  onToggleBlock: (packageName: string, isBlocked: boolean) => void;
}

export const AppLockManager: React.FC<AppLockManagerProps> = ({ apps, onToggleBlock }) => {
  const totalScreenTime = apps.reduce((acc, a) => acc + a.usageTodayMin, 0);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-[480px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AppWindow className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">App Rules & Screen Time</h2>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Today: <strong>{Math.floor(totalScreenTime / 60)}h {totalScreenTime % 60}m</strong></span>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Toggle to instantly block apps on your child's phone when time limits are reached.
      </p>

      {/* App List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {apps.map((app) => (
          <div
            key={app.packageName}
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              app.isBlocked
                ? 'bg-rose-950/20 border-rose-500/30'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{app.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{app.appName}</h3>
                  {app.isBlocked && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" /> BLOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Usage today: <strong className="text-slate-200">{app.usageTodayMin} mins</strong>
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => onToggleBlock(app.packageName, !app.isBlocked)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                app.isBlocked
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
              }`}
            >
              {app.isBlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unblock</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Block App</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
