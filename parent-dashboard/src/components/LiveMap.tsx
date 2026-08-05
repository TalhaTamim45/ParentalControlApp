import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock } from 'lucide-react';

// Custom Marker Icon for Child Device
const childIcon = L.divIcon({
  className: 'custom-child-marker',
  html: `
    <div style="
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
    ">
      👶
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -20]
});

export interface LocationFix {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  batteryPercent?: number;
  isCharging?: boolean;
  recordedAt?: number;
  receivedAt?: number;
  isStale?: boolean;
  provider?: string;
}

interface LiveMapProps {
  currentLocation: LocationFix | null;
  deviceName?: string;
  onRefresh?: () => void;
}

const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {

  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true });
  }, [lat, lng, map]);
  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({
  currentLocation,
  deviceName = "Child Phone",
  onRefresh
}) => {
  if (!currentLocation) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-slate-800 h-[480px] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400">
          <MapPin className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">Location Unavailable</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          No genuine GPS location fix has been received for <strong className="text-slate-200">{deviceName}</strong> yet.
          Tap "Share Location Fix" in the Child app to send a fix.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition"
          >
            Refresh Location Status
          </button>
        )}
      </div>
    );
  }

  const position: [number, number] = [currentLocation.lat, currentLocation.lng];

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 h-[480px] relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Genuine Child GPS Location</h2>
          {currentLocation.isStale ? (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-md border border-amber-500/30">
              STALE (&gt;15m)
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-500/30">
              FRESH
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            Accuracy: {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(1)}m` : 'N/A'}
          </span>
          {currentLocation.batteryPercent !== undefined && (
            <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-200 font-medium">
              🔋 {currentLocation.batteryPercent}% {currentLocation.isCharging ? '(Charging)' : ''}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 w-full rounded-xl overflow-hidden z-10">
        <MapContainer
          center={position}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <RecenterMap lat={currentLocation.lat} lng={currentLocation.lng} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Location Accuracy Circle */}
          <Circle
            center={position}
            radius={currentLocation.accuracy || 20}
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1.5 }}
          />

          {/* Current Child Marker */}
          <Marker position={position} icon={childIcon}>
            <Popup>
              <div className="p-1 text-slate-900 font-sans text-xs space-y-1">
                <strong className="text-blue-600 text-sm block">{deviceName}</strong>
                <p className="m-0 text-slate-700 font-mono">Lat: {currentLocation.lat.toFixed(5)}, Lng: {currentLocation.lng.toFixed(5)}</p>
                <p className="m-0 text-slate-600">Accuracy: {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(1)} meters` : 'Unknown'}</p>
                {currentLocation.recordedAt && (
                  <p className="m-0 text-slate-500 text-[10px]">Recorded: {new Date(currentLocation.recordedAt).toLocaleString()}</p>
                )}
                {currentLocation.receivedAt && (
                  <p className="m-0 text-slate-500 text-[10px]">Received: {new Date(currentLocation.receivedAt).toLocaleString()}</p>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

