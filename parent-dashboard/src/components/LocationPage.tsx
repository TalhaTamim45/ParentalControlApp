import React from 'react';
import { MapPin, Navigation, Clock, RefreshCw, Battery, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

const childIcon = L.divIcon({
  className: 'custom-child-marker',
  html: `
    <div style="
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    ">
      👶
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -22]
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

interface LocationPageProps {
  currentLocation: LocationFix | null;
  deviceName?: string;
  onRefresh?: () => void;
}

const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  React.useEffect(() => {
    map.panTo([lat, lng], { animate: true });
  }, [lat, lng, map]);
  return null;
};

export const LocationPage: React.FC<LocationPageProps> = ({
  currentLocation,
  deviceName = "Child Phone",
  onRefresh
}) => {
  const formatTime = (ts?: number) => {
    if (!ts) return 'Not available';
    return new Date(ts).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!currentLocation) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-xs max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-4 my-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <MapPin className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Location Unavailable</h3>
        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
          No genuine GPS location fix has been received for <strong className="text-slate-700">{deviceName}</strong> yet.
          Tap "Share Location Fix" in the Child app to transmit location.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Refresh Status
          </button>
        )}
      </div>
    );
  }

  const position: [number, number] = [currentLocation.lat, currentLocation.lng];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Location Bar Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900">Live Child Location</h2>
            {currentLocation.isStale ? (
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-200">
                STALE (&gt;15m)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200">
                FRESH
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Genuine location fix via Fused Location Provider for <strong>{deviceName}</strong>.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Manual Refresh</span>
          </button>
        )}
      </div>

      {/* Main Responsive Grid Layout (70% Map / 30% Info Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Large Prominent Map Canvas Container */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs overflow-hidden">
          <div 
            className="w-full rounded-2xl overflow-hidden relative z-10 border border-slate-100"
            style={{ height: '520px', minHeight: '520px' }}
          >
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

              {/* Accuracy Circle */}
              <Circle
                center={position}
                radius={currentLocation.accuracy || 20}
                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 1.5 }}
              />

              {/* Child Marker */}
              <Marker position={position} icon={childIcon}>
                <Popup>
                  <div className="p-2 font-sans text-xs space-y-1">
                    <strong className="text-blue-600 text-sm block font-bold">{deviceName}</strong>
                    <p className="m-0 text-slate-600">Accuracy: {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(1)}m` : 'Unknown'}</p>
                    <p className="m-0 text-slate-500 text-[10px]">Recorded: {formatTime(currentLocation.recordedAt)}</p>
                    <p className="m-0 text-slate-500 text-[10px]">Received: {formatTime(currentLocation.receivedAt)}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {/* Telemetry Sidebar Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Location Telemetry
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  <span>Accuracy</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(1)} meters` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <Battery className="w-4 h-4 text-slate-500" />
                  <span>Battery</span>
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  {currentLocation.batteryPercent !== undefined ? `${currentLocation.batteryPercent}%` : '—'}
                  {currentLocation.isCharging && <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Recorded Time</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {formatTime(currentLocation.recordedAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Received Time</span>
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {formatTime(currentLocation.receivedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 text-xs text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700 block mb-1">Privacy Notice</span>
            Coordinates and exact street addresses are protected under strict security guidelines and remain unexposed in non-administrative logs.
          </div>
        </div>
      </div>
    </div>
  );
};
