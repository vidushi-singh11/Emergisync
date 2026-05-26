import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/police/TopBar';
import { ActiveOrders } from '../../components/police/ActiveOrders';
import type { ClearanceOrder, ClearanceStatus } from '../../components/police/ActiveOrders';
import { JunctionMap } from '../../components/police/JunctionMap';
import { HotspotAlerts } from '../../components/police/HotspotAlerts';
import type { HotspotAlert } from '../../components/police/HotspotAlerts';
import { ProfileView } from '../../components/police/ProfileView';
import { supabase } from '../../lib/supabase';
import { useTripSync } from '../../hooks/useTripSync';

const JUNCTION_COORDINATES: Record<string, [number, number]> = {
  'JN-402': [40.7138, -74.0040],
  'JN-112': [40.7160, -74.0020],
  'JN-210': [40.7148, -74.0080],
  'JN-301': [40.7110, -74.0060]
};

export const PoliceDashboard = () => {
  // --- STATE ---
  const [viewState, setViewState] = useState<'dashboard' | 'profile'>('dashboard');
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
      await supabase
        .from('police_clearances')
        .update({ 
          status: 'CLEARED',
          actual_clearance_time: new Date().toISOString()
        })
        .eq('id', order.clearanceId);

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

      <TopBar 
        unitId={unitId}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        activeAlerts={orders.filter(o => o.status !== 'cleared').length}
        onViewProfile={() => setViewState('profile')}
      />

      {viewState === 'profile' ? (
        <ProfileView 
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBack={() => setViewState('dashboard')}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          <ActiveOrders 
            orders={orders}
            onAcknowledge={handleAcknowledge}
            onMarkCleared={handleMarkCleared}
            onEscalate={handleEscalate}
            onFocusJunction={(coords) => setFocusCoords(coords)}
          />
          
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
