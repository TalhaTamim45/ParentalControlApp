import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, MapPin } from 'lucide-react';

interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  active: boolean;
}

interface GeofenceManagerProps {
  geofences: Geofence[];
  currentLat: number;
  currentLng: number;
  onAddGeofence: (name: string, lat: number, lng: number, radiusMeters: number) => void;
  onDeleteGeofence: (id: string) => void;
}

export const GeofenceManager: React.FC<GeofenceManagerProps> = ({
  geofences,
  currentLat,
  currentLng,
  onAddGeofence,
  onDeleteGeofence
}) => {
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('250');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddGeofence(name.trim(), currentLat, currentLng, parseInt(radius) || 250);
    setName('');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-[480px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Geofence Safe Zones</h2>
        </div>
        <span className="text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-400 font-semibold">
          {geofences.length} Active Zones
        </span>
      </div>

      {/* Add New Geofence Form */}
      <form onSubmit={handleSubmit} className="mb-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
        <h3 className="text-xs font-semibold text-slate-300">Set Safe Zone at Child's Current Location</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Zone Name (e.g. Grandma's)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="150">150m Radius</option>
            <option value="250">250m Radius</option>
            <option value="500">500m Radius</option>
            <option value="1000">1km Radius</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-3.5 h-3.5" /> Save Safe Zone
        </button>
      </form>

      {/* Active Geofence List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {geofences.map((gf) => (
          <div
            key={gf.id}
            className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white">{gf.name}</h4>
                <p className="text-[10px] text-slate-400">Radius: {gf.radiusMeters} meters</p>
              </div>
            </div>

            <button
              onClick={() => onDeleteGeofence(gf.id)}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
