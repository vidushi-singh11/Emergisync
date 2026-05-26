import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Activity, Clock, AlertOctagon } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cn } from '../../lib/utils';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Ambulance Icon
const ambulanceIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative">
      <div className="absolute -inset-2 bg-accent-cyan/20 rounded-full animate-ping" />
      <div className="w-8 h-8 rounded-lg bg-accent-cyan flex items-center justify-center text-void-black shadow-glow-cyan relative z-10">
        <Navigation size={18} fill="currentColor" />
      </div>
    </div>
  ),
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Custom Hospital Icon generator based on ER status
const getHospitalIcon = (erStatus?: string) => {
  let colorClass = 'bg-surface-elevated border-text-secondary';
  let pulseClass = '';

  if (erStatus === 'PREPARING') {
    colorClass = 'bg-accent-amber border-accent-amber';
  } else if (erStatus === 'READY') {
    colorClass = 'bg-accent-cyan border-accent-cyan';
  } else if (erStatus === 'PROCESSING' || erStatus === 'RECEIVED') {
    colorClass = 'bg-accent-violet border-accent-violet';
  } else {
    colorClass = 'bg-accent-crimson border-accent-crimson'; // Default destination
  }

  return L.divIcon({
    html: renderToStaticMarkup(
      <div className="relative">
        <div className={cn("absolute -inset-3 rounded-full opacity-30", colorClass, pulseClass)} />
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-void-black shadow-lg border-2", colorClass)}>
          <Activity size={20} fill="currentColor" />
        </div>
      </div>
    ),
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
};


interface MapViewProps {
  currentPos: [number, number];
  destination: [number, number] | null;
  isOnline: boolean;
  onPosUpdate: (pos: [number, number]) => void;
  erStatus?: string;
  bayNote?: string | null;
  etaSeconds?: number | null;
  etaDisplay?: string | null;
}

// Component to handle map view updates
const RecenterMap = ({ pos }: { pos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(pos);
  }, [pos, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  currentPos, destination, isOnline, onPosUpdate, erStatus, bayNote, etaSeconds, etaDisplay 
}) => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const mapRef = useRef<L.Map | null>(null);

  // --- REAL GEOLOCATION TRACKING ---
  useEffect(() => {
    if (!isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        onPosUpdate(newPos);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, onPosUpdate]);

  // --- REAL ROUTE FETCHING (NO SIMULATION) ---
  useEffect(() => {
    if (!destination || !isOnline) {
      setRoute([]);
      return;
    }

    const fetchRoute = async () => {
      try {
        const resp = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${currentPos[1]},${currentPos[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`
        );
        const data = await resp.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setRoute(coords);
        } else {
          // Fallback to straight line
          setRoute([currentPos, destination]);
        }
      } catch (e) {
        console.error("Routing error, falling back to straight line:", e);
        setRoute([currentPos, destination]);
      }
    };

    fetchRoute();
  }, [destination, isOnline, currentPos]);

  const isCriticalETA = (etaSeconds ?? 999) < 180; // Less than 3 minutes

  return (
    <div className="flex-1 relative bg-void-black">
      <MapContainer 
        center={currentPos} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <RecenterMap pos={currentPos} />
 
        {/* Route Polyline - Only shown when navigating */}
        {route.length > 0 && destination && (
          <>
            {/* Glowing Backdrop Polyline */}
            <Polyline 
              positions={route} 
              color="#00f3ff" 
              weight={10} 
              opacity={0.3} 
            />
            {/* Core Polyline */}
            <Polyline 
              positions={route} 
              color="#06b6d4" 
              weight={5} 
              opacity={1} 
            />
          </>
        )}

        {/* Ambulance Marker - Always follows device position */}
        <Marker position={currentPos} icon={ambulanceIcon}>
          <Popup>
            <div className="text-void-black p-1">
              <p className="font-bold text-xs">YOUR LOCATION</p>
              <p className="text-[10px]">Lat: {currentPos[0].toFixed(5)}</p>
              <p className="text-[10px]">Lng: {currentPos[1].toFixed(5)}</p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        {destination && (
          <Marker position={destination} icon={getHospitalIcon(erStatus)}>
            <Popup>
              <div className="text-void-black p-1">
                <p className="font-bold text-xs text-accent-crimson uppercase">{erStatus || 'DESTINATION'}</p>
                {bayNote && <p className="text-[10px] mt-1 font-bold">Bay: {bayNote}</p>}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Overlay info */}
      <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none flex flex-col gap-3">
        
        {/* ETA Countdown Overlay */}
        {destination && etaDisplay && (
          <div className={cn(
            "backdrop-blur border p-4 rounded-xl shadow-2xl flex items-center gap-4 transition-all duration-300",
            isCriticalETA ? "bg-accent-crimson/20 border-accent-crimson shadow-glow-crimson animate-pulse" : "bg-surface-elevated/90 border-border-glow"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2",
              isCriticalETA ? "bg-accent-crimson/20 border-accent-crimson text-accent-crimson" : "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan"
            )}>
              <Clock size={20} />
            </div>
            <div>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                isCriticalETA ? "text-accent-crimson" : "text-text-muted"
              )}>
                {isCriticalETA ? "ARRIVING SHORTLY" : "ESTIMATED TIME"}
              </p>
              <p className={cn(
                "text-2xl font-bold font-mono tracking-tighter",
                isCriticalETA ? "text-text-primary" : "text-text-primary"
              )}>
                {etaDisplay}
              </p>
            </div>
          </div>
        )}

        {/* Coordinates Feed */}
        <div className="bg-surface-elevated/90 backdrop-blur border border-border-glow p-4 rounded-xl shadow-2xl w-fit">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Live Navigation Feed</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-text-primary tracking-tighter">
              {currentPos[0].toFixed(5)}
            </span>
            <span className="text-accent-cyan font-mono text-xs">N</span>
            <span className="text-xl font-bold font-mono text-text-primary tracking-tighter ml-2">
              {currentPos[1].toFixed(5)}
            </span>
            <span className="text-accent-cyan font-mono text-xs">W</span>
          </div>
        </div>
      </div>

      {/* Bay Note Top Banner Overlay */}
      {destination && bayNote && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-[400px]">
          <div className="bg-surface-elevated/95 backdrop-blur-md border border-accent-amber/50 p-4 rounded-xl shadow-2xl flex items-start gap-4 animate-in slide-in-from-top-4">
            <div className="w-10 h-10 rounded-full bg-accent-amber/20 flex items-center justify-center text-accent-amber shrink-0 border border-accent-amber/30">
              <AlertOctagon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-accent-amber uppercase tracking-widest mb-1">
                Hospital Bay Assignment
              </p>
              <p className="text-sm text-text-primary font-medium leading-tight">
                {bayNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="absolute inset-0 bg-void-black/60 backdrop-blur-[2px] z-[2000] flex items-center justify-center pointer-events-auto">
          <div className="px-6 py-3 bg-surface-elevated border border-accent-crimson/30 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-crimson animate-pulse" />
            <span className="text-sm font-bold text-accent-crimson uppercase tracking-widest">System Offline</span>
          </div>
        </div>
      )}
    </div>
  );
};
