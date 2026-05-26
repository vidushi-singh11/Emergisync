import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ClearanceOrder } from './ActiveOrders';

// Police Icon (Amber Diamond)
const policeIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="w-8 h-8 rounded-md bg-accent-amber flex items-center justify-center text-void-black shadow-glow-amber rotate-45">
      <Shield size={16} fill="currentColor" className="-rotate-45" />
    </div>
  ),
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

// Ambulance Icon (Cyan)
const ambulanceIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="w-6 h-6 rounded-full bg-accent-cyan flex items-center justify-center text-void-black shadow-glow-cyan">
      <Navigation size={14} fill="currentColor" />
    </div>
  ),
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Helper to recenter map
const RecenterMap = ({ pos }: { pos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(pos, map.getZoom(), { animate: true });
  }, [pos, map]);
  return null;
};

interface JunctionMapProps {
  policeCoords: [number, number];
  activeOrders: ClearanceOrder[];
  focusCoords: [number, number] | null;
}

export const JunctionMap: React.FC<JunctionMapProps> = ({ policeCoords, activeOrders, focusCoords }) => {
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});

  // Fetch approach vectors for active orders
  useEffect(() => {
    const fetchRoutes = async () => {
      const newRoutes: Record<string, [number, number][]> = {};
      
      for (const order of activeOrders) {
        if (order.ambCoords && order.status !== 'cleared') {
          try {
            // Using OSRM to get a realistic path from Ambulance to Junction
            const resp = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${order.ambCoords[1]},${order.ambCoords[0]};${order.coords[1]},${order.coords[0]}?overview=simplified&geometries=geojson`
            );
            const data = await resp.json();
            if (data.routes && data.routes[0]) {
              newRoutes[order.id] = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            }
          } catch (e) {
            console.error("Failed to fetch approach vector:", e);
          }
        }
      }
      setRoutes(newRoutes);
    };

    fetchRoutes();
  }, [activeOrders]);

  return (
    <div className="flex-1 relative bg-void-black">
      <MapContainer 
        center={focusCoords || policeCoords} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Dark theme tiles for tactical look */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        />
        
        <RecenterMap pos={focusCoords || policeCoords} />

        {/* Police Unit Location */}
        <Marker position={policeCoords} icon={policeIcon}>
          <Popup>
            <div className="text-void-black p-1 font-bold text-xs">YOUR POSITION</div>
          </Popup>
        </Marker>

        {/* Active Orders Overlays */}
        {activeOrders.map(order => {
          if (order.status === 'cleared') return null;

          const isAwaiting = order.status === 'awaiting';
          const color = isAwaiting ? '#ff2a5f' : '#ffb020'; // Crimson for awaiting, Amber for in progress

          return (
            <React.Fragment key={order.id}>
              {/* Junction Target Zone (Pulsing Circle) */}
              <CircleMarker 
                center={order.coords} 
                radius={30}
                pathOptions={{ 
                  color: color, 
                  fillColor: color, 
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
              {/* Core Junction Pin */}
              <CircleMarker 
                center={order.coords} 
                radius={5}
                pathOptions={{ color: color, fillColor: color, fillOpacity: 1 }}
              >
                <Popup>
                  <div className="text-void-black p-1">
                    <p className="font-bold text-xs">JUNCTION {order.junctionId}</p>
                    <p className="text-[10px]">Status: {order.status}</p>
                  </div>
                </Popup>
              </CircleMarker>

              {/* Ambulance Location */}
              {order.ambCoords && (
                <Marker position={order.ambCoords} icon={ambulanceIcon} />
              )}

              {/* Approach Vector (Path) */}
              {routes[order.id] && (
                <Polyline 
                  positions={routes[order.id]} 
                  color="#22d3ee" // Cyan approach line
                  weight={4} 
                  opacity={0.8}
                  dashArray="10, 10"
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
