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

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  timestamp: number;
  address?: string;
}

interface Geofence {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  active: boolean;
}

interface LiveMapProps {
  currentLocation: Location;
  locationHistory: Location[];
  geofences: Geofence[];
}

// Subcomponent to smoothly recalculate map center on location update
const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo([lat, lng], { animate: true });
  }, [lat, lng, map]);
  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({
  currentLocation,
  locationHistory,
  geofences
}) => {
  const position: [number, number] = [currentLocation.lat, currentLocation.lng];
  const polylineCoords: [number, number][] = locationHistory.map(l => [l.lat, l.lng]);

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 h-[480px] relative overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Live GPS Location & History</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            Speed: {currentLocation.speed || 0} km/h
          </span>
          <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
          </span>
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
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }}
          />

          {/* Breadcrumb Path History */}
          {polylineCoords.length > 1 && (
            <Polyline
              positions={polylineCoords}
              pathOptions={{ color: '#6366f1', weight: 4, dashArray: '6, 8', opacity: 0.8 }}
            />
          )}

          {/* Geofence Overlay Circles */}
          {geofences.map(gf => (
            <Circle
              key={gf.id}
              center={[gf.lat, gf.lng]}
              radius={gf.radiusMeters}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '4, 4'
              }}
            >
              <Popup>
                <div className="p-1 text-slate-100 font-sans">
                  <strong className="text-emerald-400 text-sm">Safe Zone: {gf.name}</strong>
                  <p className="text-xs text-slate-300 m-0 mt-1">Radius: {gf.radiusMeters}m</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Current Child Marker */}
          <Marker position={position} icon={childIcon}>
            <Popup>
              <div className="p-1 text-slate-100 font-sans">
                <strong className="text-blue-400 text-sm">Child's Phone Location</strong>
                <p className="text-xs text-slate-300 mt-1 mb-0">
                  {currentLocation.address || `${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};
