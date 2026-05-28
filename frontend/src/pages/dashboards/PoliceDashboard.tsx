import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/police/TopBar';
import { ActiveOrders } from '../../components/police/ActiveOrders';
import type { ClearanceOrder, ClearanceStatus } from '../../components/police/ActiveOrders';
import { JunctionMap } from '../../components/police/JunctionMap';
import { HotspotAlerts } from '../../components/police/HotspotAlerts';
import type { HotspotAlert } from '../../components/police/HotspotAlerts';
import { ProfileView } from '../../components/police/ProfileView';
import { HistoryView } from '../../components/police/HistoryView';
import { supabase } from '../../lib/supabase';
import { useTripSync } from '../../hooks/useTripSync';

const JUNCTION_COORDINATES: Record<string, [number, number]> = {
  'JN-402': [40.7138, -74.0040],
  'JN-112': [40.7160, -74.0020],
  'JN-210': [40.7148, -74.0080],
  'JN-301': [40.7110, -74.0060]
};

// Haversine GPS Distance Calculator
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 'N/A';
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d.toFixed(2) + ' km';
};

export const PoliceDashboard = () => {
  // --- STATE ---
  const [viewState, setViewState] = useState<'dashboard' | 'profile' | 'history'>('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [unitId, setUnitId] = useState('P-105');
  const [policeCoords, setPoliceCoords] = useState<[number, number]>([40.7128, -74.0060]);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);

  const [profile, setProfile] = useState({
    id: '',
    name: 'Officer Personnel',
    phone: '',
    email: 'officer@precinct.gov',
    unitId: 'P-UNK',
    badgeNumber: 'N/A',
    rank: 'constable',
    assignedJunctions: [] as string[]
  });

  const [clearances, setClearances] = useState<any[]>([]);
  const [allAmbulanceUnits, setAllAmbulanceUnits] = useState<any[]>([]);
  const [activeBroadcasts, setActiveBroadcasts] = useState<string[]>([]);
  
  // Custom hook for en-route trips database sync
  const { trips } = useTripSync();

  // --- 1. AUTH & PROFILE FETCH ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          const { data: policeData } = await supabase.from('police_profiles').select('*').eq('id', authData.user.id).single();
          
          if (profileData && policeData) {
            const initialProfile = {
              id: authData.user.id,
              name: profileData.full_name || 'Officer',
              phone: profileData.phone || '',
              email: authData.user.email || 'N/A',
              unitId: policeData.unit_id || 'P-UNK',
              badgeNumber: policeData.badge_number || 'N/A',
              rank: policeData.rank || 'constable',
              assignedJunctions: policeData.assigned_junctions || []
            };
            setProfile(initialProfile);
            setUnitId(initialProfile.unitId);
            setIsOnline(!!policeData.is_online);
          }
        }
      } catch (err) {
        console.error("Failed to load police profile credentials:", err);
      }
    };

    fetchProfile();
  }, []);

  // --- 2. GPS GEOLOCATION SCANNING ---
  useEffect(() => {
    if (!isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPoliceCoords([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline]);

  // --- 3. TELEMETRY GPS & STATUS STREAMING ---
  useEffect(() => {
    if (!profile.id) return;

    const streamLocation = async () => {
      try {
        await supabase
          .from('police_profiles')
          .update({
            latitude: policeCoords[0],
            longitude: policeCoords[1],
            is_online: isOnline
          })
          .eq('id', profile.id);
      } catch (err) {
        console.error("Telemetry streaming offline error:", err);
      }
    };

    streamLocation();
    const timer = setInterval(streamLocation, 5000);
    return () => clearInterval(timer);
  }, [profile.id, policeCoords, isOnline]);

  // --- 4. REAL-TIME AMBULANCE GPS SUBSCRIPTION ---
  useEffect(() => {
    const fetchAmbUnits = async () => {
      const { data } = await supabase.from('ambulance_units').select('*');
      if (data) setAllAmbulanceUnits(data);
    };
    fetchAmbUnits();

    const channel = supabase
      .channel('police-ambulance-telemetry')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulance_units' }, (payload) => {
        setAllAmbulanceUnits(current => {
          if (payload.eventType === 'INSERT') return [payload.new, ...current];
          if (payload.eventType === 'UPDATE') {
            return current.map(u => u.id === payload.new.id ? payload.new : u);
          }
          if (payload.eventType === 'DELETE') return current.filter(u => u.id !== payload.old.id);
          return current;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- 5. REAL-TIME CLEARANCES SUBSCRIPTION ---
  useEffect(() => {
    if (!profile.id) return;

    const fetchClearances = async () => {
      const { data } = await supabase
        .from('police_clearances')
        .select('*')
        .eq('police_unit_id', profile.id)
        .neq('status', 'RELEASED');
      if (data) setClearances(data);
    };
    fetchClearances();

    const channel = supabase
      .channel(`police-clearances:${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'police_clearances', filter: `police_unit_id=eq.${profile.id}` },
        (payload) => {
          setClearances(current => {
            if (payload.eventType === 'INSERT') {
              if (payload.new.status === 'RELEASED') return current;
              return [payload.new, ...current];
            }
            if (payload.eventType === 'UPDATE') {
              if (payload.new.status === 'RELEASED') {
                return current.filter(c => c.id !== payload.new.id);
              }
              return current.map(c => c.id === payload.new.id ? payload.new : c);
            }
            if (payload.eventType === 'DELETE') {
              return current.filter(c => c.id !== payload.old.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  // --- 6. GLOBAL BROADCAST SUBSCRIPTION ---
  useEffect(() => {
    const channel = supabase
      .channel('police-broadcasts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'broadcasts' },
        (payload) => {
          const newAlert = payload.new as any;
          setActiveBroadcasts(prev => [newAlert.message, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- SOS EMERGENCY RESCUE ESCORT LIFE CYCLE ---
  const activeRescueUnit = allAmbulanceUnits.find(u => u.is_sos && u.sos_assigned_police_id === profile.id);
  const rescueDistance = activeRescueUnit && activeRescueUnit.current_lat && activeRescueUnit.current_lng
    ? calculateDistance(policeCoords[0], policeCoords[1], activeRescueUnit.current_lat, activeRescueUnit.current_lng)
    : 'Calculating...';

  // --- 7. MAPPING DYNAMIC CLEARANCE ORDERS ---
  const [activeClearedTrips, setActiveClearedTrips] = useState<string[]>([]);
  
  const orders: ClearanceOrder[] = clearances.map(c => {
    const trip = trips.find(t => t.id === c.trip_id);
    const ambUnit = trip ? trip.trip_ref : 'AMB-UNK';
    const etaDisplay = trip ? (trip.eta || 'Calculating...') : 'Calculating...';
    
    // Find approach ambulance GPS coords
    const ambProfile = allAmbulanceUnits.find(u => u.id === trip?.ambulance_id);
    const ambCoords: [number, number] | undefined = ambProfile?.current_lat && ambProfile?.current_lng
      ? [ambProfile.current_lat, ambProfile.current_lng]
      : undefined;

    const statusMap: Record<string, 'awaiting' | 'in_progress' | 'cleared'> = {
      'PENDING': 'awaiting',
      'SENT': 'awaiting',
      'ACKNOWLEDGED': 'in_progress',
      'ESCALATED': 'in_progress',
      'CLEARED': 'cleared'
    };

    return {
      id: c.trip_id, // Maps to trip_id to query geometry approche polylines
      clearanceId: c.id,
      ambulanceId: ambUnit,
      junctionId: c.junction_id,
      status: statusMap[c.status] || 'awaiting',
      eta: etaDisplay,
      coords: JUNCTION_COORDINATES[c.junction_id] || [40.7128, -74.0060],
      ambCoords: ambCoords
    };
  }).filter(order => order.status !== 'cleared' || activeClearedTrips.includes(order.id));

  // --- 8. TACTICAL HOTSPOT DETECTOR ---
  const alerts: HotspotAlert[] = profile.assignedJunctions
    .map(jId => {
      // Find approaching L1/L2 en-route units
      const count = trips.filter(t => {
        const matchingClearance = clearances.find(c => c.trip_id === t.id && c.junction_id === jId);
        return matchingClearance && matchingClearance.status !== 'CLEARED' && (t.severity === 'CRITICAL_L1' || t.severity === 'SEVERE_L2');
      }).length;

      return { id: jId, junctionId: jId, unitCount: count };
    })
    .filter(a => a.unitCount >= 2);

  // --- 9. EVENT HANDLERS ---
  const handleToggleOnline = async () => {
    const nextOnline = !isOnline;
    if (!nextOnline && orders.some(o => o.status === 'in_progress')) {
      alert("Operational Lock: Cannot go offline while coordinating an active junction clearance.");
      return;
    }
    
    setIsOnline(nextOnline);
    if (profile.id) {
      try {
        await supabase
          .from('police_profiles')
          .update({ is_online: nextOnline })
          .eq('id', profile.id);
      } catch (err) {
        console.error("Failed to toggle online status:", err);
      }
    }
  };

  const handleAcknowledgeSosRescue = async (unitId: string) => {
    try {
      const activeTrip = trips.find(t => t.ambulance_id === unitId);
      
      // 1. Update status
      await supabase
        .from('ambulance_units')
        .update({
          sos_status: 'police_dispatched',
          sos_updated_at: new Date().toISOString()
        })
        .eq('id', unitId);

      // 2. Insert persistent audit log
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: activeTrip ? activeTrip.id : null,
          actor_id: profile.id,
          action_type: 'SOS_ESCORT_DEPLOYED',
          new_state: { ambulance_id: unitId, timestamp: new Date().toISOString() }
        });
    } catch (err) {
      console.error("Failed to ACK SOS rescue:", err);
    }
  };

  const handleConfirmArrivalSosRescue = async (unitId: string) => {
    try {
      const activeTrip = trips.find(t => t.ambulance_id === unitId);

      // 1. Update status
      await supabase
        .from('ambulance_units')
        .update({
          sos_status: 'police_arrived',
          sos_updated_at: new Date().toISOString()
        })
        .eq('id', unitId);

      // 2. Insert persistent audit log
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: activeTrip ? activeTrip.id : null,
          actor_id: profile.id,
          action_type: 'SOS_ESCORT_ARRIVED',
          new_state: { ambulance_id: unitId, timestamp: new Date().toISOString() }
        });
    } catch (err) {
      console.error("Failed to confirm arrival at SOS rescue:", err);
    }
  };

  const handleResolveSosRescue = async (unitId: string) => {
    try {
      const activeTrip = trips.find(t => t.ambulance_id === unitId);

      // 1. Reset columns
      await supabase
        .from('ambulance_units')
        .update({
          is_sos: false,
          sos_status: 'resolved',
          sos_assigned_police_id: null,
          sos_updated_at: new Date().toISOString()
        })
        .eq('id', unitId);

      // 2. Insert persistent audit log
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: activeTrip ? activeTrip.id : null,
          actor_id: profile.id,
          action_type: 'SOS_ESCORT_RESOLVED',
          new_state: { ambulance_id: unitId, timestamp: new Date().toISOString() }
        });

      alert("SOS rescue escort cleared. Scene secured successfully!");
    } catch (err) {
      console.error("Failed to resolve SOS rescue:", err);
    }
  };

  const handleAcknowledge = async (tripId: string) => {
    const order = orders.find(o => o.id === tripId);
    if (!order) return;
    try {
      await supabase
        .from('police_clearances')
        .update({ status: 'ACKNOWLEDGED' })
        .eq('id', order.clearanceId);
    } catch (err) {
      console.error("Failed to ACK clearance:", err);
    }
  };

  const handleMarkCleared = async (tripId: string) => {
    const order = orders.find(o => o.id === tripId);
    if (!order) return;
    try {
      // 1. Update status
      await supabase
        .from('police_clearances')
        .update({ 
          status: 'CLEARED',
          actual_clearance_time: new Date().toISOString()
        })
        .eq('id', order.clearanceId);

      // 2. Insert persistent audit log
      await supabase
        .from('trip_logs')
        .insert({
          trip_id: order.id,
          actor_id: profile.id,
          action_type: 'JUNCTION_CLEARED',
          new_state: { junction_id: order.junctionId, cleared_at: new Date().toISOString() }
        });

      // Keep in local UI for 5 seconds as requested by checkpoint spec
      setActiveClearedTrips(prev => [...prev, tripId]);
      setTimeout(() => {
        setActiveClearedTrips(prev => prev.filter(id => id !== tripId));
      }, 5000);

    } catch (err) {
      console.error("Failed to clear junction:", err);
    }
  };

  const handleEscalate = async (tripId: string) => {
    const order = orders.find(o => o.id === tripId);
    if (!order) return;
    try {
      await supabase
        .from('police_clearances')
        .update({ status: 'ESCALATED' })
        .eq('id', order.clearanceId);

      await supabase
        .from('trips')
        .update({ escalation_triggered: true })
        .eq('id', order.id);

      alert(`Escalation request sent for Trip ${order.ambulanceId}. Backup dispatched.`);
    } catch (err) {
      console.error("Failed to escalate clearance corridor:", err);
    }
  };

  const handleRequestBackup = (junctionId: string) => {
    alert(`Tactical corridor backup requested for ${junctionId}. Control Room dispatcher notified.`);
  };

  const handleUpdateProfile = async (updatedData: any) => {
    if (!profile.id) return;
    try {
      // 1. Update profiles table
      const { error: pError } = await supabase
        .from('profiles')
        .update({ full_name: updatedData.name, phone: updatedData.phone })
        .eq('id', profile.id);

      if (pError) throw pError;

      // 2. Update police_profiles table
      const { error: polError } = await supabase
        .from('police_profiles')
        .update({
          unit_id: updatedData.unitId,
          badge_number: updatedData.badgeNumber,
          rank: updatedData.rank,
          assigned_junctions: updatedData.assignedJunctions
        })
        .eq('id', profile.id);

      if (polError) throw polError;

      // 3. Sync local state
      setProfile(prev => ({
        ...prev,
        name: updatedData.name,
        phone: updatedData.phone,
        unitId: updatedData.unitId,
        badgeNumber: updatedData.badgeNumber,
        rank: updatedData.rank,
        assignedJunctions: updatedData.assignedJunctions
      }));
      setUnitId(updatedData.unitId);

      alert("Operational patrol credentials updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update database profile. Try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-void-black text-text-primary overflow-hidden">
      {/* Global Command Broadcast marquee */}
      {activeBroadcasts.length > 0 && (
        <div className="bg-accent-crimson/95 text-void-black text-[11px] font-bold py-1.5 px-6 overflow-hidden relative shrink-0 border-b border-accent-crimson/40 select-none z-40">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <span>🚨 COMMAND CENTER BROADCAST:</span>
            <span className="font-mono tracking-wide">{activeBroadcasts[0]}</span>
          </div>
        </div>
      )}

      {/* 🚨 Flashing Rescue Dispatch Banner */}
      {activeRescueUnit && (
        <div className="bg-accent-crimson text-void-black text-xs font-black py-2.5 px-6 overflow-hidden relative shrink-0 border-b border-accent-crimson/40 select-none z-40 animate-pulse text-center uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow-crimson">
          <span>🚨 URGENT DISPATCH: ESCORT AMBULANCE SOS ACTIVE • LIVE DISTANCE: {rescueDistance} 🚨</span>
        </div>
      )}

      <TopBar 
        unitId={unitId}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        activeAlerts={orders.filter(o => o.status !== 'cleared').length}
        onViewProfile={() => setViewState('profile')}
        onViewHistory={() => setViewState('history')}
      />

      {viewState === 'profile' ? (
        <ProfileView 
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBack={() => setViewState('dashboard')}
        />
      ) : viewState === 'history' ? (
        <HistoryView 
          officerId={profile.id}
          onBack={() => setViewState('dashboard')}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row animate-in fade-in duration-300">
          
          <div className="w-[420px] border-r border-border-glow bg-surface-primary flex flex-col overflow-y-auto shrink-0">
            {activeRescueUnit && (
              <div className="p-5 bg-accent-crimson/15 border-b border-accent-crimson/30 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-accent-crimson tracking-widest flex items-center gap-1.5 mb-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                    SOS RESCUE ACTIVE
                  </span>
                  <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                    AMB ESCORT MISSION
                  </h3>
                  <p className="text-[11px] text-text-muted mt-1 uppercase font-mono">
                    Target: {activeRescueUnit.id.substring(0, 8).toUpperCase()} (SPEED: {activeRescueUnit.speed} KM/H)
                  </p>
                </div>

                <div className="py-2.5 px-3 rounded bg-void-black/60 border border-border-glow/50 flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Distance:</span>
                    <span className="text-lg font-mono font-bold text-accent-cyan">{rescueDistance}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">State:</span>
                    <span className="text-xs font-bold text-accent-amber uppercase tracking-wider">
                      {(!activeRescueUnit.sos_status || activeRescueUnit.sos_status === 'active') && "Triggered"}
                      {activeRescueUnit.sos_status === 'acknowledged' && "Dispatched"}
                      {activeRescueUnit.sos_status === 'police_dispatched' && "En Route"}
                      {activeRescueUnit.sos_status === 'police_arrived' && "Guarding"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {(!activeRescueUnit.sos_status || activeRescueUnit.sos_status === 'active' || activeRescueUnit.sos_status === 'acknowledged') && (
                    <button 
                      onClick={() => handleAcknowledgeSosRescue(activeRescueUnit.id)}
                      className="w-full py-3 bg-accent-amber text-void-black text-xs font-extrabold rounded-lg uppercase tracking-wider hover:bg-accent-amber/90 active:scale-95 transition-all shadow-glow-amber"
                    >
                      Acknowledge & Deploy
                    </button>
                  )}
                  {activeRescueUnit.sos_status === 'police_dispatched' && (
                    <button 
                      onClick={() => handleConfirmArrivalSosRescue(activeRescueUnit.id)}
                      className="w-full py-3 bg-green-500 text-void-black text-xs font-extrabold rounded-lg uppercase tracking-wider hover:bg-green-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      Confirm Arrival & Secure
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleResolveSosRescue(activeRescueUnit.id)}
                    className="w-full py-2 bg-surface-elevated border border-border-glow text-text-primary text-[10px] font-bold rounded-lg uppercase tracking-wider hover:text-accent-crimson hover:border-accent-crimson transition-colors"
                  >
                    Clear SOS & Stand Down
                  </button>
                </div>
              </div>
            )}

            <ActiveOrders 
              orders={orders}
              onAcknowledge={handleAcknowledge}
              onMarkCleared={handleMarkCleared}
              onEscalate={handleEscalate}
              onFocusJunction={(coords) => setFocusCoords(coords)}
            />
          </div>
          
          <div className="flex-1 relative">
            <HotspotAlerts 
              alerts={alerts}
              onRequestBackup={handleRequestBackup}
            />
            <JunctionMap 
              policeCoords={policeCoords}
              activeOrders={orders}
              focusCoords={focusCoords}
            />
          </div>
        </div>
      )}
    </div>
  );
};
