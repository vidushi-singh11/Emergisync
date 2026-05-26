import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, Download, AlertTriangle, CheckCircle2, Navigation, 
  Map as MapIcon, ShieldAlert, PhoneCall, Bed, Radio, Send, Bell, User, Clock, Check, X, Shield
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix Leaflet Default Icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


const JUNCTION_COORDINATES: Record<string, [number, number]> = {
  'JN-402': [40.7138, -74.0040],
  'JN-112': [40.7160, -74.0020],
  'JN-210': [40.7148, -74.0080],
  'JN-301': [40.7110, -74.0060]
};

// Custom Icons
const cyanAmbulanceIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative">
      <div className="absolute -inset-2 bg-accent-cyan/20 rounded-full animate-ping" />
      <div className="w-7 h-7 rounded-lg bg-accent-cyan flex items-center justify-center text-void-black shadow-glow-cyan relative z-10">
        <Navigation size={14} className="transform rotate-45" fill="currentColor" />
      </div>
    </div>
  ),
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const redAmbulanceIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative animate-bounce">
      <div className="absolute -inset-3 bg-accent-crimson/40 rounded-full animate-ping" />
      <div className="w-8 h-8 rounded-lg bg-accent-crimson flex items-center justify-center text-void-black shadow-glow-crimson relative z-10">
        <AlertTriangle size={16} fill="currentColor" />
      </div>
    </div>
  ),
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const hospitalMarkerIcon = (isDiversion: boolean) => L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center text-void-black border shadow-lg",
        isDiversion ? "bg-accent-crimson border-accent-crimson" : "bg-accent-cyan border-accent-cyan"
      )}>
        <Bed size={16} fill="currentColor" />
      </div>
    </div>
  ),
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const policeMarkerIcon = (isOnline: boolean) => L.divIcon({
  html: renderToStaticMarkup(
    <div className="relative">
      <div className={cn(
        "absolute -inset-1 bg-accent-amber/20 rounded-full animate-ping",
        !isOnline && "hidden"
      )} />
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center text-void-black border shadow-lg relative z-10",
        isOnline ? "bg-accent-amber border-accent-amber shadow-glow-amber rotate-45" : "bg-surface-elevated border-border-glow text-text-muted"
      )}>
        <Shield size={14} className={cn(isOnline && "-rotate-45")} fill="currentColor" />
      </div>
    </div>
  ),
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// GIS Bounding-Box Fitter Component
const FitBounds = ({ units, hospitals, trips, policeProfiles }: { units: any[], hospitals: any[], trips: any[], policeProfiles: any[] }) => {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    // Add active units
    units.forEach(u => {
      const activeTrip = trips.some(t => t.ambulance_id === u.id);
      const isActive = u.is_online || activeTrip;
      if (u.current_lat && u.current_lng && isActive) {
        points.push([u.current_lat, u.current_lng]);
      }
    });

    // Add hospitals
    hospitals.forEach(h => {
      if (h.latitude && h.longitude) {
        points.push([h.latitude, h.longitude]);
      }
    });

    // Add online police officers
    policeProfiles.forEach(p => {
      if (p.latitude && p.longitude && p.is_online) {
        points.push([p.latitude, p.longitude]);
      }
    });

    if (points.length > 0) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (err) {
        console.error("Failed to fit bounds:", err);
      }
    }
  }, [units, hospitals, trips, policeProfiles, map]);

  return null;
};


export const LiveOperations = () => {
  // --- REAL-TIME STATES ---
  const [trips, setTrips] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [policeProfiles, setPoliceProfiles] = useState<any[]>([]);
  const [policeClearances, setPoliceClearances] = useState<any[]>([]);
  
  // UI states
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [directNoteMessage, setDirectNoteMessage] = useState('');
  const [directNoteTripId, setDirectNoteTripId] = useState<string | null>(null);

  // Siren Audio Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  // --- INITIAL DATA FETCH & REALTIME CHANNELS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch profiles to map ID to display name
        const { data: profileData } = await supabase.from('profiles').select('id, full_name, role');
        if (profileData) {
          const profileMap: Record<string, any> = {};
          profileData.forEach(p => {
            profileMap[p.id] = p;
          });
          setProfiles(profileMap);
        }

        // 2. Fetch and subscribe to trips (non-completed)
        const { data: tripData } = await supabase
          .from('trips')
          .select('*')
          .neq('status', 'COMPLETED')
          .neq('status', 'CANCELLED');
        if (tripData) setTrips(tripData);

        // 3. Fetch and subscribe to hospital profiles
        const { data: hospData } = await supabase.from('hospital_profiles').select('*');
        if (hospData) setHospitals(hospData);

        // 4. Fetch and subscribe to ambulance units
        const { data: unitData } = await supabase.from('ambulance_units').select('*');
        if (unitData) setUnits(unitData);

        // 5. Fetch police profiles
        const { data: policeData } = await supabase.from('police_profiles').select('*');
        if (policeData) setPoliceProfiles(policeData);

        // 6. Fetch police clearances
        const { data: clearanceData } = await supabase.from('police_clearances').select('*');
        if (clearanceData) setPoliceClearances(clearanceData);

      } catch (err) {
        console.error("Fetch initial Command data failed:", err);
      }
    };

    fetchData();

    // Setup Realtime Channels
    const tripChannel = supabase
      .channel('control-trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
        setTrips(current => {
          if (payload.eventType === 'INSERT') {
            const newTrip = payload.new;
            if (newTrip.status === 'COMPLETED' || newTrip.status === 'CANCELLED') return current;
            return [newTrip, ...current];
          }
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            if (updated.status === 'COMPLETED' || updated.status === 'CANCELLED') {
              return current.filter(t => t.id !== updated.id);
            }
            return current.map(t => t.id === updated.id ? updated : t);
          }
          if (payload.eventType === 'DELETE') {
            return current.filter(t => t.id !== payload.old.id);
          }
          return current;
        });
      })
      .subscribe();

    const unitChannel = supabase
      .channel('control-units')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulance_units' }, (payload) => {
        setUnits(current => {
          if (payload.eventType === 'INSERT') return [payload.new, ...current];
          if (payload.eventType === 'UPDATE') {
            return current.map(u => u.id === payload.new.id ? payload.new : u);
          }
          if (payload.eventType === 'DELETE') return current.filter(u => u.id !== payload.old.id);
          return current;
        });
      })
      .subscribe();

    const hospitalChannel = supabase
      .channel('control-hospitals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospital_profiles' }, (payload) => {
        setHospitals(current => {
          if (payload.eventType === 'INSERT') return [payload.new, ...current];
          if (payload.eventType === 'UPDATE') {
            return current.map(h => h.id === payload.new.id ? payload.new : h);
          }
          if (payload.eventType === 'DELETE') return current.filter(h => h.id !== payload.old.id);
          return current;
        });
      })
      .subscribe();

    const policeChannel = supabase
      .channel('control-police-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'police_profiles' }, (payload) => {
        setPoliceProfiles(current => {
          if (payload.eventType === 'INSERT') return [payload.new, ...current];
          if (payload.eventType === 'UPDATE') {
            return current.map(p => p.id === payload.new.id ? payload.new : p);
          }
          if (payload.eventType === 'DELETE') return current.filter(p => p.id !== payload.old.id);
          return current;
        });
      })
      .subscribe();

    const clearanceChannel = supabase
      .channel('control-police-clearances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'police_clearances' }, (payload) => {
        setPoliceClearances(current => {
          if (payload.eventType === 'INSERT') return [payload.new, ...current];
          if (payload.eventType === 'UPDATE') {
            return current.map(c => c.id === payload.new.id ? payload.new : c);
          }
          if (payload.eventType === 'DELETE') return current.filter(c => c.id !== payload.old.id);
          return current;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tripChannel);
      supabase.removeChannel(unitChannel);
      supabase.removeChannel(hospitalChannel);
      supabase.removeChannel(policeChannel);
      supabase.removeChannel(clearanceChannel);
    };
  }, []);


  // --- SOS SIREN ALARM PLAYBACK SYSTEM ---
  const activeSosUnit = units.find(u => u.is_sos && u.is_online);

  useEffect(() => {
    if (activeSosUnit) {
      // Start Siren audio
      if (!audioContextRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          
          let oscToggle = true;
          sirenIntervalRef.current = setInterval(() => {
            if (!audioContextRef.current) return;
            const osc = audioContextRef.current.createOscillator();
            const gain = audioContextRef.current.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(oscToggle ? 660 : 880, audioContextRef.current.currentTime);
            osc.connect(gain);
            gain.connect(audioContextRef.current.destination);
            gain.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
            osc.start();
            osc.stop(audioContextRef.current.currentTime + 0.4);
            oscToggle = !oscToggle;
          }, 500);
        } catch (e) {
          console.error("Failed to start siren audio context:", e);
        }
      }
    } else {
      // Clear Siren interval and close audio context
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    }

    return () => {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [activeSosUnit]);

  // --- EVENT HANDLERS ---
  const handleResolveSos = async (unitId: string) => {
    // Optimistic local state clearing to keep interface fast and panic-free
    setUnits(current => current.map(u => u.id === unitId ? { ...u, is_sos: false } : u));

    try {
      const { error } = await supabase
        .from('ambulance_units')
        .update({ is_sos: false })
        .eq('id', unitId);
      if (error) {
        console.error("Supabase SOS resolution failed:", error);
      }
    } catch (err) {
      console.error("Failed to resolve SOS alarm:", err);
    }
  };

  const handleSendSafetyPing = async (unitId: string) => {
    try {
      await supabase
        .from('ambulance_units')
        .update({ pinged_at: new Date().toISOString() })
        .eq('id', unitId);
      alert("Safety verification ping sent successfully. Driver device will buzz.");
    } catch (err) {
      console.error("Failed to safety ping unit:", err);
    }
  };

  const handleNudgeSlowHospital = async (tripId: string) => {
    try {
      await supabase
        .from('trips')
        .update({ nudge_sent: true })
        .eq('id', tripId);
      alert("Nudge alert triggered! Flashing warning sent to the hospital portal.");
    } catch (err) {
      console.error("Failed to send nudge:", err);
    }
  };

  const handleApproveSwap = async (trip: any) => {
    try {
      await supabase
        .from('trips')
        .update({ 
          hospital_id: trip.requested_hospital_id,
          requested_hospital_id: null,
          nudge_sent: false
        })
        .eq('id', trip.id);
    } catch (err) {
      console.error("Failed to approve alternate swap:", err);
    }
  };

  const handleDenySwap = async (trip: any) => {
    try {
      await supabase
        .from('trips')
        .update({ 
          requested_hospital_id: null,
          driver_note: "Swap request denied by Control: alternate route unavailable."
        })
        .eq('id', trip.id);
    } catch (err) {
      console.error("Failed to deny alternate swap:", err);
    }
  };

  const handleSendMassBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    try {
      const { error } = await supabase
        .from('broadcasts')
        .insert({ message: broadcastMessage.trim() });
        
      if (error) throw error;
      setBroadcastMessage('');
      setShowBroadcastModal(false);
      alert("Mass emergency broadcast sent to all drivers and hospitals successfully.");
    } catch (err) {
      console.error("Broadcast failed:", err);
    }
  };

  const handleDirectNoteSubmit = async () => {
    if (!directNoteTripId || !directNoteMessage.trim()) return;
    try {
      await supabase
        .from('trips')
        .update({ notes: directNoteMessage.trim() })
        .eq('id', directNoteTripId);
      
      setDirectNoteTripId(null);
      setDirectNoteMessage('');
      alert("Direct text note dispatched to the driver's display.");
    } catch (err) {
      console.error("Direct note failed:", err);
    }
  };

  const handleResolveEscalation = async (tripId: string) => {
    try {
      await supabase
        .from('trips')
        .update({ escalation_triggered: false })
        .eq('id', tripId);
    } catch (err) {
      console.error("Failed to resolve escalation:", err);
    }
  };

  const handleForceDiversionBypass = async (trip: any, targetHospId: string) => {
    try {
      await supabase
        .from('trips')
        .update({ 
          hospital_id: targetHospId,
          is_bypass: true 
        })
        .eq('id', trip.id);
      alert("Bypass Force-Route overrides submitted. Hospital alerted.");
    } catch (err) {
      console.error("Diversion bypass override failed:", err);
    }
  };

  // --- DATA CALCULATORS & DERIVATION ---
  const activeSwapTrips = trips.filter(t => t.requested_hospital_id);
  const activeEscalations = trips.filter(t => t.escalation_triggered);

  // Ghost Units: active trip, is_online = true, last_ping older than 45 seconds
  const ghostUnits = units.filter(u => {
    const isEnRoute = trips.some(t => t.ambulance_id === u.id);
    if (!isEnRoute || !u.is_online) return false;
    const diff = new Date().getTime() - new Date(u.last_ping).getTime();
    return diff > 45000; // 45 seconds without ping
  });

  // Slow Hospitals: L1 or L2 trip, erStatus is PENDING or PREPARING, ack_time is null, created_at older than 3 minutes
  const slowHospTrips = trips.filter(t => {
    if (t.er_status !== 'PENDING' && t.er_status !== 'PREPARING') return false;
    if (t.ack_time) return false;
    if (t.severity !== 'CRITICAL_L1' && t.severity !== 'SEVERE_L2') return false;
    const diff = new Date().getTime() - new Date(t.created_at).getTime();
    return diff > 180000; // >3 minutes en route
  });

  return (
    <div className="flex flex-1 h-full overflow-hidden relative">
      
      {/* 🚨 Fullscreen SOS alarm overlay */}
      {activeSosUnit && (
        <div className="fixed inset-0 z-[10000] bg-accent-crimson/35 backdrop-blur-md border-[8px] border-accent-crimson flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="w-24 h-24 rounded-full bg-accent-crimson flex items-center justify-center text-void-black mb-6 shadow-glow-crimson animate-bounce">
            <AlertTriangle size={48} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-widest text-text-primary mb-2 uppercase animate-pulse">CRITICAL PANIC SOS ACTIVE</h1>
          <p className="text-xl text-text-primary font-bold uppercase tracking-wider mb-6">
            UNIT: {profiles[activeSosUnit.id]?.full_name || 'Ambulance Unit'} • SPEED: {activeSosUnit.speed} KM/H
          </p>
          <p className="text-sm max-w-lg text-text-secondary mb-8 leading-relaxed">
            The ambulance driver has hit the physical panic triggers. The Command air traffic tower has locked down coordinates. Corridors are cleared.
          </p>
          <button 
            onClick={() => handleResolveSos(activeSosUnit.id)}
            className="px-8 py-4 bg-text-primary text-void-black font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-glow-cyan hover:scale-105 active:scale-95 transition-all"
          >
            ACKNOWLEDGE & CLEAR ALARM
          </button>
        </div>
      )}

      {/* Left 70% - Table & Real Leaflet Map */}
      <div className="flex-[7] flex flex-col border-r border-border-glow">
        
        {/* Active Trips Table Section */}
        <div className="flex-1 bg-surface-primary p-6 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[13px] font-bold tracking-widest uppercase flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-cyan"></span>
              </span>
              Active Emergency Grid: {trips.length} units en route
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowBroadcastModal(true)}
                className="px-3.5 py-1.5 rounded-lg border border-accent-crimson/40 bg-accent-crimson/10 text-xs font-bold text-accent-crimson hover:bg-accent-crimson hover:text-void-black shadow-glow-crimson transition-all flex items-center gap-2"
              >
                <Radio size={14} /> MASS BROADCAST
              </button>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-glow text-[10px] text-text-muted uppercase tracking-widest">
                <th className="pb-3 font-medium">Trip Ref</th>
                <th className="pb-3 font-medium">Personnel / Unit</th>
                <th className="pb-3 font-medium">Severity</th>
                <th className="pb-3 font-medium">Dest Hospital</th>
                <th className="pb-3 font-medium">ER Intake</th>
                <th className="pb-3 font-medium">ETA</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-text-muted uppercase font-bold tracking-widest">
                    No active emergency runs en route
                  </td>
                </tr>
              ) : (
                trips.map(trip => {
                  const targetHosp = hospitals.find(h => h.id === trip.hospital_id);
                  const hospName = targetHosp ? (profiles[targetHosp.id]?.full_name || 'Hospital') : 'Unknown';
                  const driverName = profiles[trip.ambulance_id]?.full_name || 'Personnel';
                  
                  return (
                    <tr key={trip.id} className="border-b border-border-glow/40 hover:bg-surface-elevated transition-colors cursor-pointer group">
                      <td className="py-4 text-xs font-mono font-bold group-hover:text-accent-cyan">{trip.trip_ref}</td>
                      <td className="py-4">
                        <div className="text-xs font-bold text-text-primary">{driverName}</div>
                        <div className="text-[9px] text-text-muted font-mono">ID: {trip.ambulance_id.slice(0,8)}</div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[9px] px-2 py-0.5 rounded font-bold uppercase",
                          trip.severity === 'CRITICAL_L1' ? "bg-accent-crimson/20 text-accent-crimson border border-accent-crimson/30" :
                          trip.severity === 'SEVERE_L2' ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/30" :
                          "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                        )}>
                          {trip.severity.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="text-xs font-bold text-accent-cyan">{hospName}</div>
                        {trip.is_bypass && <span className="text-[8px] font-bold text-accent-crimson bg-accent-crimson/10 px-1 py-0.2 rounded mt-0.5 inline-block">BYPASS ACTIVE</span>}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[9px] font-bold uppercase",
                          trip.er_status === 'READY' ? "text-accent-cyan animate-pulse" :
                          trip.er_status === 'PREPARING' ? "text-accent-amber" :
                          "text-text-muted"
                        )}>
                          {trip.er_status}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-mono font-bold text-text-primary">{trip.eta || 'Fetching'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 🗺️ Tactical Leaflet Map Integration */}
        <div className="h-[45%] bg-void-black border-t border-border-glow relative">
          <MapContainer 
            center={[40.7306, -73.9352]} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Dynamic GIS Bounds Scaling */}
            <FitBounds units={units} hospitals={hospitals} trips={trips} policeProfiles={policeProfiles} />
            
            {/* 🏥 Hospital Markers */}
            {hospitals.map(hosp => {
              const name = profiles[hosp.id]?.full_name || 'Hospital';
              return (
                <Marker 
                  key={hosp.id} 
                  position={[hosp.latitude || 40.7128, hosp.longitude || -74.0060]} 
                  icon={hospitalMarkerIcon(hosp.is_diversion)}
                >
                  <Popup>
                    <div className="text-void-black p-1 text-xs">
                      <p className="font-extrabold uppercase mb-0.5">{name}</p>
                      <p className="font-bold text-[10px] text-text-muted uppercase">Trauma L{hosp.trauma_level}</p>
                      <p className="mt-1 font-mono">ER: {hosp.capacity_er_available} available / {hosp.capacity_er_total} total</p>
                      <p className="font-mono">ICU: {hosp.capacity_icu_available} available / {hosp.capacity_icu_total} total</p>
                      {hosp.is_diversion && <p className="text-accent-crimson font-extrabold mt-1 uppercase animate-pulse">● Diversion protocols active</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 🚑 Ambulance Markers & Routing Polylines */}
            {units.map(unit => {
              const name = profiles[unit.id]?.full_name || 'Ambulance';
              const activeTrip = trips.find(t => t.ambulance_id === unit.id);
              const isSos = unit.is_sos;
              const isOnline = unit.is_online;
              const isActive = isOnline || !!activeTrip;
              
              if (!unit.current_lat || !unit.current_lng || !isActive) return null;

              return (
                <React.Fragment key={unit.id}>
                  <Marker 
                    position={[unit.current_lat, unit.current_lng]} 
                    icon={isSos ? redAmbulanceIcon : cyanAmbulanceIcon}
                  >
                    <Popup>
                      <div className="text-void-black p-2 text-xs max-w-[200px]">
                        <p className="font-extrabold uppercase border-b pb-1 mb-1">{name}</p>
                        <p className="font-mono text-[10px]">Lat: {unit.current_lat.toFixed(5)}</p>
                        <p className="font-mono text-[10px]">Lng: {unit.current_lng.toFixed(5)}</p>
                        <p className="font-mono text-[10px] text-accent-cyan font-bold">Speed: {unit.speed} km/h</p>
                        
                        <div className="mt-2 pt-2 border-t flex flex-col gap-1">
                          <button 
                            onClick={() => handleSendSafetyPing(unit.id)}
                            className="w-full py-1 bg-surface-elevated hover:bg-void-black/20 text-void-black border border-border-glow rounded font-bold uppercase tracking-wider text-[9px] transition-colors"
                          >
                            Ping Safety Verified
                          </button>
                          
                          {activeTrip && (
                            <button 
                              onClick={() => setDirectNoteTripId(activeTrip.id)}
                              className="w-full py-1 bg-accent-cyan text-void-black rounded font-bold uppercase tracking-wider text-[9px] hover:bg-accent-cyan/90 transition-colors"
                            >
                              Direct Text Note
                            </button>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Draw routing corridors to destination hospital */}
                  {activeTrip && (() => {
                    const targetHosp = hospitals.find(h => h.id === activeTrip.hospital_id);
                    if (targetHosp?.latitude && targetHosp?.longitude) {
                      return (
                        <Polyline 
                          positions={[
                            [unit.current_lat, unit.current_lng],
                            [targetHosp.latitude, targetHosp.longitude]
                          ]}
                          color={isSos ? '#ff2a5f' : '#22d3ee'}
                          weight={2}
                          dashArray="5, 10"
                        />
                      );
                    }
                  })()}
                </React.Fragment>
              );
            })}

            {/* 🛡️ Police Unit Markers (Amber Shields) */}
            {policeProfiles.map(officer => {
              if (!officer.latitude || !officer.longitude || !officer.is_online) return null;
              
              const officerName = profiles[officer.id]?.full_name || 'Police Officer';
              const assignedClearances = policeClearances.filter(c => c.police_unit_id === officer.id && c.status !== 'RELEASED');
              const activeCorridor = assignedClearances.length > 0 ? assignedClearances[0].junction_id : 'PATROL';

              return (
                <Marker 
                  key={officer.id} 
                  position={[officer.latitude, officer.longitude]} 
                  icon={policeMarkerIcon(officer.is_online)}
                >
                  <Popup>
                    <div className="text-void-black p-2 text-xs max-w-[200px]">
                      <p className="font-extrabold uppercase border-b pb-1 mb-1">{officerName}</p>
                      <p className="font-mono text-[10px]">Callsign: <strong>{officer.unit_id}</strong></p>
                      <p className="font-mono text-[10px]">Badge ID: {officer.badge_number}</p>
                      <p className="font-mono text-[10px]">Rank: {officer.rank.toUpperCase()}</p>
                      <p className="mt-2 text-accent-amber font-extrabold text-[9px] uppercase tracking-wide">
                        ● STATUS: {activeCorridor === 'PATROL' ? 'Patrolling' : `CLEARING ${activeCorridor}`}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* 🟢 Glowing Green Halos for Cleared Junctions */}
            {policeClearances.filter(c => c.status === 'CLEARED').map(c => {
              const coords = JUNCTION_COORDINATES[c.junction_id];
              if (!coords) return null;
              
              return (
                <React.Fragment key={c.id}>
                  {/* Outer Pulsing Green Halo */}
                  <CircleMarker 
                    center={coords} 
                    radius={22}
                    pathOptions={{ 
                      color: '#10b981', 
                      fillColor: '#10b981', 
                      fillOpacity: 0.15,
                      weight: 1.5
                    }}
                  />
                  {/* Central Secured Core */}
                  <CircleMarker 
                    center={coords} 
                    radius={4}
                    pathOptions={{ 
                      color: '#10b981', 
                      fillColor: '#10b981', 
                      fillOpacity: 1,
                      weight: 1
                    }}
                  >
                    <Popup>
                      <div className="text-void-black p-2 text-xs max-w-[200px]">
                        <p className="font-extrabold uppercase text-green-600 mb-0.5">🟢 Corridor Secured</p>
                        <p className="font-mono text-[10px]">Junction: <strong>{c.junction_id}</strong></p>
                        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">Traffic halted and corridor cleared. Priority signals forced to GREEN.</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </div>


      {/* Right 30% - Command Panels */}
      <div className="flex-[3] flex flex-col bg-surface-primary overflow-y-auto custom-scrollbar">
        
        {/* 1. Conflict & Reroute Monitor */}
        <div className="p-6 border-b border-border-glow">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-accent-cyan">
            <Bed size={14} /> Conflict Monitor
          </h3>

          <div className="space-y-3">
            {/* Hospital Swap Requests */}
            {activeSwapTrips.map(trip => {
              const driverName = profiles[trip.ambulance_id]?.full_name || 'Ambulance';
              const sourceHosp = hospitals.find(h => h.id === trip.hospital_id);
              const destHosp = hospitals.find(h => h.id === trip.requested_hospital_id);
              
              return (
                <div key={trip.id} className="p-3 bg-accent-amber/5 border border-accent-amber/30 rounded-xl">
                  <span className="text-[9px] font-bold text-accent-amber uppercase tracking-wider animate-pulse">ROUTE REDIRECT REQUESTED</span>
                  <p className="text-xs font-bold text-text-primary mt-1">{driverName} requests reroute:</p>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted mt-2">
                    <span className="line-through">{profiles[sourceHosp?.id || '']?.full_name || 'Hospital'}</span>
                    <span>➜</span>
                    <span className="text-accent-cyan font-bold">{profiles[destHosp?.id || '']?.full_name || 'New Hospital'}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => handleApproveSwap(trip)}
                      className="flex-1 py-1 bg-accent-cyan text-void-black text-[9px] font-bold uppercase rounded hover:bg-accent-cyan/90"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleDenySwap(trip)}
                      className="flex-1 py-1 bg-surface-elevated text-text-primary border border-border-glow text-[9px] font-bold uppercase rounded hover:text-accent-crimson"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Inbound capacity bottlenecks */}
            {hospitals.map(hosp => {
              const inboundCount = trips.filter(t => t.hospital_id === hosp.id).length;
              const name = profiles[hosp.id]?.full_name || 'Hospital';
              
              if (inboundCount >= 3 && hosp.capacity_er_available <= 2) {
                return (
                  <div key={hosp.id} className="p-3 bg-accent-crimson/5 border border-accent-crimson/30 rounded-xl">
                    <span className="text-[9px] font-bold text-accent-crimson uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={11} className="animate-pulse" /> Bottleneck Alert
                    </span>
                    <p className="text-xs font-bold text-text-primary mt-1">{name} at high capacity ({hosp.capacity_er_available} ER beds left)</p>
                    <p className="text-[10px] text-text-muted mt-1">{inboundCount} units inbound. Recommend route overrides.</p>
                  </div>
                );
              }
              return null;
            })}

            {activeSwapTrips.length === 0 && trips.filter(t => hospitals.find(h => h.id === t.hospital_id)?.capacity_er_available <= 2).length === 0 && (
              <p className="text-[11px] text-text-muted text-center py-4 uppercase font-bold tracking-wider">No routing bottlenecks detected</p>
            )}
          </div>
        </div>

        {/* 2. Flagged Cases Panel */}
        <div className="p-6 border-b border-border-glow flex-1">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-accent-crimson">
            <ShieldAlert size={14} /> Flagged Monitor
          </h3>

          <div className="space-y-4">
            {/* SOS Alerts */}
            {activeSosUnit && (
              <div className="p-4 bg-accent-crimson/15 border border-accent-crimson rounded-xl shadow-glow-crimson">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-accent-crimson uppercase font-mono">PANIC ACTIVATE</span>
                  <span className="text-[9px] text-text-muted font-mono">{new Date().toLocaleTimeString()}</span>
                </div>
                <p className="text-sm font-bold text-text-primary">AMBULANCE SOS</p>
                <p className="text-xs text-text-muted mt-1 mb-3">Unit: {profiles[activeSosUnit.id]?.full_name || 'Ambulance'}</p>
                <button 
                  onClick={() => handleResolveSos(activeSosUnit.id)}
                  className="w-full py-2 bg-accent-crimson text-void-black text-xs font-bold rounded-lg uppercase tracking-wider hover:bg-accent-crimson/90 shadow-glow-crimson"
                >
                  DISMISS ALARM
                </button>
              </div>
            )}

            {/* Ghost Units losing GPS */}
            {ghostUnits.map(unit => {
              const name = profiles[unit.id]?.full_name || 'Ambulance';
              return (
                <div key={unit.id} className="p-4 bg-void-black border border-border-glow rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-accent-amber uppercase text-xs">GHOST DETECTED</span>
                    <span className="text-[9px] text-text-muted">Lost &gt;45s</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary">Signal Anomaly: {name}</p>
                  <p className="text-xs text-text-muted mt-1 mb-3">GPS packets dropping. Ping device safety confirm.</p>
                  <button 
                    onClick={() => handleSendSafetyPing(unit.id)}
                    className="w-full py-2 bg-surface-elevated border border-border-glow text-xs font-bold text-text-primary rounded-lg uppercase tracking-widest hover:text-accent-cyan hover:border-accent-cyan"
                  >
                    SEND SAFETY PING
                  </button>
                </div>
              );
            })}

            {/* Hospital Escalation Cases */}
            {activeEscalations.map(trip => {
              const driverName = profiles[trip.ambulance_id]?.full_name || 'Ambulance';
              const hospName = profiles[trip.hospital_id]?.full_name || 'Hospital';
              
              return (
                <div key={trip.id} className="p-4 bg-accent-crimson/5 border border-accent-crimson/30 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono font-bold text-accent-crimson uppercase text-[10px]">Hospital Escalation</span>
                    <span className="text-[9px] text-text-muted">{trip.trip_ref}</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary">{hospName} triggered Escalation</p>
                  <p className="text-xs text-text-muted mt-1 mb-3">Inbound critical {driverName} (ETA: {trip.eta}) bay preparation bottleneck.</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleResolveEscalation(trip.id)}
                      className="flex-1 py-1.5 bg-accent-crimson text-void-black text-[9px] font-bold uppercase rounded hover:bg-accent-crimson/90"
                    >
                      RESOLVE
                    </button>
                    {/* Force Bypass Redirect alternate */}
                    <button 
                      onClick={() => {
                        const alt = hospitals.find(h => h.id !== trip.hospital_id && !h.is_diversion);
                        if (alt) {
                          handleForceDiversionBypass(trip, alt.id);
                        } else {
                          alert("No alternate non-diversion facility available.");
                        }
                      }}
                      className="flex-1 py-1.5 bg-surface-elevated text-text-primary text-[9px] font-bold uppercase rounded border border-border-glow hover:text-accent-cyan"
                    >
                      FORCE BYPASS
                    </button>
                  </div>
                </div>
              );
            })}

            {!activeSosUnit && ghostUnits.length === 0 && activeEscalations.length === 0 && (
              <p className="text-[11px] text-text-muted text-center py-4 uppercase font-bold tracking-wider">No active flagged anomalies</p>
            )}
          </div>
        </div>

        {/* 3. "Hospital is Slow" Nudge Alert */}
        {slowHospTrips.length > 0 && (
          <div className="p-6 bg-accent-amber/5 border-t border-accent-amber/20 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 text-accent-amber flex items-center gap-2 animate-pulse">
              <Clock size={14} /> Hospital ACK Overdue
            </h3>
            <div className="p-4 bg-void-black border border-accent-amber/40 rounded-xl space-y-3">
              {slowHospTrips.map(trip => {
                const hospName = profiles[trip.hospital_id]?.full_name || 'Hospital';
                return (
                  <div key={trip.id} className="flex justify-between items-center border-b border-border-glow/50 pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-text-primary">{hospName}</p>
                      <p className="text-[9px] text-text-muted font-mono">Trip: {trip.trip_ref} • ETA: {trip.eta}</p>
                    </div>
                    <button 
                      onClick={() => handleNudgeSlowHospital(trip.id)}
                      className="px-2.5 py-1 bg-accent-amber text-void-black text-[9px] font-bold uppercase rounded hover:bg-accent-amber/80 transition-colors"
                    >
                      NUDGE
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 📬 Direct Text Note Popup Trigger Modal */}
      {directNoteTripId && (
        <div className="fixed inset-0 z-[11000] bg-void-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border-glow rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Send size={16} className="text-accent-cyan" /> Direct Text note to unit
            </h3>
            <textarea 
              placeholder="Type notes (e.g. Use South Entrance — North Bay closed)..."
              value={directNoteMessage}
              onChange={e => setDirectNoteMessage(e.target.value)}
              className="w-full bg-void-black border border-border-glow rounded-xl p-3 text-xs text-text-primary focus:border-accent-cyan outline-none resize-none h-24 mb-4"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setDirectNoteTripId(null)}
                className="flex-1 py-2 border border-border-glow text-text-secondary rounded-lg font-bold text-xs uppercase hover:text-text-primary"
              >
                Cancel
              </button>
              <button 
                onClick={handleDirectNoteSubmit}
                className="flex-1 py-2 bg-accent-cyan text-void-black rounded-lg font-bold text-xs uppercase hover:bg-accent-cyan/90 shadow-glow-cyan"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📬 Mass Emergency Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[11000] bg-void-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-accent-crimson/50 rounded-2xl p-6 max-w-md w-full shadow-glow-crimson">
            <h3 className="text-sm font-bold text-accent-crimson uppercase tracking-wider mb-4 flex items-center gap-2">
              <Radio size={16} /> Send Emergency City-wide alert
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed mb-4">
              Sends a high-priority marquee banner alert to all active ambulance drivers and hospital admin portals simultaneously.
            </p>
            <textarea 
              placeholder="Type broadcast alert (e.g. Downtown flooded, all units use alternate routes)..."
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
              className="w-full bg-void-black border border-border-glow rounded-xl p-3 text-xs text-text-primary focus:border-accent-cyan outline-none resize-none h-24 mb-4"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 py-2 border border-border-glow text-text-secondary rounded-lg font-bold text-xs uppercase hover:text-text-primary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendMassBroadcast}
                className="flex-1 py-2 bg-accent-crimson text-void-black rounded-lg font-bold text-xs uppercase hover:bg-accent-crimson/95 shadow-glow-crimson"
              >
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
