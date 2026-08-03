import React from 'react';
import { Bell, MessageSquare, AlertCircle } from 'lucide-react';

interface NotificationItem {
  id: number;
  app: string;
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationFeedProps {
  notifications: NotificationItem[];
}

export const NotificationFeed: React.FC<NotificationFeedProps> = ({ notifications }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-[480px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Live Notification Feed</h2>
        </div>
        <span className="text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-amber-400 font-semibold">
          {notifications.length} Alerts Logged
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Real-time mirrored notifications received on child's smartphone.
      </p>

      {/* Notification Stream */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {notifications.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No notifications received yet today.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400">{n.app}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {new Date(n.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white">{n.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
