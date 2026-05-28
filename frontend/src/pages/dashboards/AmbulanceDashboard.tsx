import React, { useState, useEffect, useMemo } from 'react';
import { TopBar } from '../../components/ambulance/TopBar';
import { StatusBar } from '../../components/ambulance/StatusBar';
import { DispatchSidebar } from '../../components/ambulance/DispatchSidebar';
import type { TripData, TripStatus } from '../../components/ambulance/DispatchSidebar';
import { TransferLog } from '../../components/ambulance/TransferLog';
import { MapView } from '../../components/ambulance/MapView';
import { ProfileView } from '../../components/ambulance/ProfileView';
import { supabase } from '../../lib/supabase';
import { useTripSync } from '../../hooks/useTripSync';
import type { HospitalInfo } from '../../types/models';
import { cn } from '../../lib/utils';

interface TransferEntry {
  id: string;
  patient: string;
  hospital: string;
  time: string;
  priority: string;
  condition: string;
  totalTime?: string;
}

export const AmbulanceDashboard = () => {
  // --- STATE ---
  const [viewState, setViewState] = useState<'dashboard' | 'profile'>('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<TripStatus>('idle');
  const [activeTrip, setActiveTrip] = useState<TripData | null>(null);
  const [currentPos, setCurrentPos] = useState<[number, number]>([40.7128, -74.0060]);
  const [history, setHistory] = useState<TransferEntry[]>([]);
  const [profile, setProfile] = useState({
    id: '',
    name: 'Personnel',
    phone: '',
    email: 'user@medishield.gov',
    unitId: 'AMB-UNK',
    vehicleReg: 'N/A',
    vehicleType: 'als',
    licenseNumber: '',
    emergencyContact: '',
    equipment: [] as string[]
  });
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  
  // Realtime Bridge states
  const [isSos, setIsSos] = useState(false);
  const [sosStatus, setSosStatus] = useState<'active' | 'acknowledged' | 'police_dispatched' | 'police_arrived' | 'resolved' | null>(null);
  const [sosAssignedPoliceId, setSosAssignedPoliceId] = useState<string | null>(null);
  const [sosAssignedPoliceName, setSosAssignedPoliceName] = useState<string | null>(null);
  const [sosAssignedPoliceBadge, setSosAssignedPoliceBadge] = useState<string | null>(null);
  const [activeBroadcasts, setActiveBroadcasts] = useState<string[]>([]);
  const [safetyPinged, setSafetyPinged] = useState(false);
  const [directNote, setDirectNote] = useState<string | null>(null);
  const [prevHospitalId, setPrevHospitalId] = useState<string | null>(null);
  
  // Custom hook for realtime DB sync
  const { trips, addTrip, updateTripStatus } = useTripSync();

  // --- HISTORY DB SYNC ---
  const fetchHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, hospital_profiles(profiles(full_name))')
        .eq('ambulance_id', userId)
        .in('status', ['COMPLETED', 'CANCELLED'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (data) {
        const mappedHistory: TransferEntry[] = data.map((t: any) => {
          const hospName = t.hospital_profiles?.profiles?.full_name || 'Hospital';
          const transitTime = t.arrival_time && t.created_at
            ? `${Math.round((new Date(t.arrival_time).getTime() - new Date(t.created_at).getTime()) / 60000)} min`
            : '12 min';
            
          return {
            id: t.id,
            patient: t.patient_name || 'Unknown Patient',
            hospital: hospName,
            time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            priority: t.severity === 'CRITICAL_L1' ? 'critical' : t.severity === 'SEVERE_L2' ? 'severe' : 'moderate',
            condition: t.condition || 'Emergency Run',
            totalTime: transitTime
          };
        });
        setHistory(mappedHistory);
      }
    } catch (err) {
      console.error("Failed to fetch history from DB:", err);
    }
  };

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        let currentProfileId = '';
        if (authData?.user) {
          currentProfileId = authData.user.id;
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          const { data: ambData } = await supabase.from('ambulance_profiles').select('*').eq('id', authData.user.id).single();
          
          if (profileData && ambData) {
            setProfile({
              id: authData.user.id,
              name: profileData.full_name || 'Personnel',
              phone: profileData.phone || '',
              email: authData.user.email || 'N/A',
              unitId: ambData.unit_id || 'AMB-UNK',
              vehicleReg: ambData.vehicle_reg || 'N/A',
              vehicleType: ambData.vehicle_type || 'als',
              licenseNumber: ambData.license_number || '',
              emergencyContact: ambData.emergency_contact || '',
              equipment: ambData.equipment || []
            });
          }

          // Fetch initial SOS and telemetry states
          const { data: unitData } = await supabase.from('ambulance_units').select('*').eq('id', authData.user.id).single();
          if (unitData) {
            setIsSos(!!unitData.is_sos);
            setSosStatus(unitData.sos_status || null);
            setSosAssignedPoliceId(unitData.sos_assigned_police_id || null);
          }

          // Fetch Completed Trips History for the logged-in driver
          fetchHistory(currentProfileId);
        }
        
        // Fetch hospitals with full stats for picker
        const { data: hospData } = await supabase
          .from('hospital_profiles')
          .select('id, latitude, longitude, trauma_level, capacity_er_total, capacity_er_available, capacity_icu_total, capacity_icu_available, is_diversion, emergency_line, profiles(full_name)');
        
        let mappedHospitals: HospitalInfo[] = [];
        if (hospData) {
          mappedHospitals = hospData.map((h: any) => ({
            id: h.id,
            name: h.profiles?.full_name || 'Unknown Hospital',
            coords: [h.latitude, h.longitude] as [number, number],
            traumaLevel: h.trauma_level || '3',
            erTotal: h.capacity_er_total || 0,
            erAvailable: h.capacity_er_available || 0,
            icuTotal: h.capacity_icu_total || 0,
            icuAvailable: h.capacity_icu_available || 0,
            isDiversion: h.is_diversion || false,
            emergencyLine: h.emergency_line || 'N/A'
          })).filter(h => h.coords[0] && h.coords[1]);
          setHospitals(mappedHospitals);
        }

      } catch (e) {
        console.error("Fetch error:", e);
      }
    };
    fetchData();
  }, []);

  // --- TELEMETRY & LOCATION STREAMING ---
  useEffect(() => {
    if (!profile.id) return;

    const streamLocation = async () => {
      try {
        await supabase
          .from('ambulance_units')
          .upsert({
            id: profile.id,
            current_lat: currentPos[0],
            current_lng: currentPos[1],
            speed: isOnline ? (status !== 'idle' ? 52 : 0) : 0,
            heading: 120,
            is_online: isOnline,
            is_sos: isSos,
            last_ping: new Date().toISOString()
          });
      } catch (err) {
        console.error("Failed to stream telemetry:", err);
      }
    };

    streamLocation();
    const timer = setInterval(streamLocation, 5000);
    return () => clearInterval(timer);
  }, [profile.id, currentPos, isOnline, isSos, status]);

  // --- REALTIME ALERTS SUBSCRIPTIONS ---
  useEffect(() => {
    if (!profile.id) return;

    // 1. Safety Ping & SOS updates subscription
    const pingChannel = supabase
      .channel(`safety-pings:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ambulance_units', filter: `id=eq.${profile.id}` },
        (payload) => {
          const unit = payload.new as any;
          if (unit.pinged_at) {
            setSafetyPinged(true);
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(880, audioCtx.currentTime);
              osc.connect(audioCtx.destination);
              osc.start();
              setTimeout(() => osc.stop(), 500);
            } catch (e) {
              console.error("Audio error:", e);
            }
          }

          if (unit.is_sos !== undefined) {
            setIsSos(unit.is_sos);
          }
          if (unit.sos_status !== undefined) {
            setSosStatus(unit.sos_status);
          }
          if (unit.sos_assigned_police_id !== undefined) {
            setSosAssignedPoliceId(unit.sos_assigned_police_id);
          }
        }
      )
      .subscribe();

    // 2. Global Broadcast subscription
    const broadcastChannel = supabase
      .channel('global-broadcasts')
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
      supabase.removeChannel(pingChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [profile.id]);

  // --- FETCH ASSIGNED POLICE DETAILS ---
  useEffect(() => {
    if (!sosAssignedPoliceId) {
      setSosAssignedPoliceName(null);
      setSosAssignedPoliceBadge(null);
      return;
    }

    const fetchPoliceDetails = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', sosAssignedPoliceId)
          .single();

        const { data: policeData } = await supabase
          .from('police_profiles')
          .select('unit_id, badge_number')
          .eq('id', sosAssignedPoliceId)
          .single();

        if (profileData && policeData) {
          setSosAssignedPoliceName(profileData.full_name);
          setSosAssignedPoliceBadge(policeData.unit_id || policeData.badge_number);
        }
      } catch (err) {
        console.error("Failed to fetch assigned police details:", err);
      }
    };

    fetchPoliceDetails();
  }, [sosAssignedPoliceId]);

  // --- REALTIME TRIP SYNC ---
  useEffect(() => {
    if (!profile.id) return;
    
    const myTrips = trips.filter(t => t.ambulance_id === profile.id);
    
    if (myTrips.length > 0) {
      const sorted = [...myTrips].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
      
      const myDbTrip = sorted[0];
      
      if (sorted.length > 1) {
        sorted.slice(1).forEach(staleTrip => {
          console.warn(`Defensive Sync: Auto-cancelling stale duplicate active trip ${staleTrip.id}`);
          updateTripStatus(staleTrip.id, { status: 'CANCELLED' }).catch(err => {
            console.error("Failed to auto-clean duplicate active trip", err);
          });
        });
      }

      // Voice routing triggers
      if (prevHospitalId && prevHospitalId !== myDbTrip.hospital_id) {
        try {
          const synth = window.speechSynthesis;
          if (synth) {
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance("Route updated by Control Room");
            utterance.rate = 0.95;
            synth.speak(utterance);
          }
        } catch (e) {
          console.error("TTS error:", e);
        }
        setDirectNote("Route updated by Control Room!");
        setTimeout(() => setDirectNote(null), 8000);
      }
      setPrevHospitalId(myDbTrip.hospital_id);

      const targetHosp = hospitals.find(h => h.id === myDbTrip.hospital_id);
      const destCoords = targetHosp?.coords || [40.7306, -73.9352];

      setActiveTrip(prev => ({
        id: myDbTrip.id,
        patientName: myDbTrip.patient_name || '',
        condition: myDbTrip.condition || '',
        priority: myDbTrip.severity || 'MODERATE_L3',
        location: 'Dispatch Point',
        destination: targetHosp?.name || 'Hospital',
        contact: 'N/A',
        eta: myDbTrip.eta || 'Fetching...',
        etaSeconds: myDbTrip.eta_seconds,
        startCoords: prev?.startCoords || currentPos,
        endCoords: destCoords,
        erStatus: myDbTrip.er_status,
        bayNote: myDbTrip.bay_note,
        ageGroup: myDbTrip.age_group,
        specialNeeds: myDbTrip.special_needs || [],
        driverNote: myDbTrip.driver_note,
        requestedHospitalId: myDbTrip.requested_hospital_id
      }));

      if (myDbTrip.status === 'EN_ROUTE') {
        setStatus('en_route');
      } else if (myDbTrip.status === 'ARRIVED_AT_HOSPITAL' || myDbTrip.status === 'PATIENT_HANDOFF_COMPLETE') {
        setStatus('at_scene');
      } else {
        setStatus('dispatched');
      }
    } else {
      if (status !== 'idle') {
        setActiveTrip(null);
        setStatus('idle');
      }
    }
  }, [trips, profile.id, hospitals]);

  const handleConfirmSafety = async () => {
    setSafetyPinged(false);
    if (profile.id) {
      try {
        await supabase
          .from('ambulance_units')
          .update({
            pinged_at: null,
            last_ping: new Date().toISOString()
          })
          .eq('id', profile.id);
      } catch (err) {
        console.error("Failed to clear safety ping:", err);
      }
    }
  };

  const handleRequestSwap = async (targetHospitalId: string) => {
    if (!activeTrip || !activeTrip.id) return;
    try {
      await supabase
        .from('trips')
        .update({ requested_hospital_id: targetHospitalId })
        .eq('id', activeTrip.id);
      
      // Update local state optimism
      setActiveTrip(prev => prev ? { ...prev, requestedHospitalId: targetHospitalId } : null);
    } catch (err) {
      console.error("Failed to request hospital swap:", err);
    }
  };

  // --- HANDLERS ---
  const handleToggleOnline = () => {
    if (status !== 'idle') {
      alert("Cannot go offline while on an active trip.");
      return;
    }
    setIsOnline(!isOnline);
  };

  const handleToggleSos = async () => {
    const nextSos = !isSos;
    setIsSos(nextSos);
    const nextStatus = nextSos ? 'active' : null;
    setSosStatus(nextStatus);
    if (!nextSos) {
      setSosAssignedPoliceId(null);
    }

    try {
      await supabase
        .from('ambulance_units')
        .update({
          is_sos: nextSos,
          sos_status: nextStatus,
          sos_assigned_police_id: nextSos ? sosAssignedPoliceId : null,
          sos_updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
    } catch (err) {
      console.error("Failed to update SOS status:", err);
    }
  };

  const handleUpdateProfile = async (updatedData: any) => {
    if (!profile.id) return;

    try {
      // 1. Update profiles table in Supabase
      const { error: pError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedData.name,
          phone: updatedData.phone
        })
        .eq('id', profile.id);

      if (pError) throw pError;

      // 2. Update ambulance_profiles table in Supabase
      const { error: ambError } = await supabase
        .from('ambulance_profiles')
        .update({
          unit_id: updatedData.unitId,
          vehicle_reg: updatedData.vehicleReg,
          vehicle_type: updatedData.vehicleType,
          license_number: updatedData.licenseNumber,
          emergency_contact: updatedData.emergencyContact,
          equipment: updatedData.equipment
        })
        .eq('id', profile.id);

      if (ambError) throw ambError;

      // 3. Sync local state
      setProfile(prev => ({
        ...prev,
        name: updatedData.name,
        phone: updatedData.phone,
        unitId: updatedData.unitId,
        vehicleReg: updatedData.vehicleReg,
        vehicleType: updatedData.vehicleType,
        licenseNumber: updatedData.licenseNumber,
        emergencyContact: updatedData.emergencyContact,
        equipment: updatedData.equipment
      }));
    } catch (err) {
      console.error("Failed to update database profile:", err);
      throw err;
    }
  };

  const handleUpdateTrip = async (updates: Partial<TripData>) => {
    if (!activeTrip || !activeTrip.id || activeTrip.id.length < 10) return;
    
    // Convert generic TripData to DB schema
    await updateTripStatus(activeTrip.id, {
      patient_name: updates.patientName,
      condition: updates.condition,
      severity: updates.priority as any,
      age_group: updates.ageGroup as any,
      special_needs: updates.specialNeeds,
      driver_note: updates.driverNote
    }).catch(err => console.error("Failed to sync trip update to DB", err));
  };

  const handleAcceptTrip = async () => {
    if (activeTrip?.id && activeTrip.id.length > 10) {
      await updateTripStatus(activeTrip.id, { status: 'EN_ROUTE' });
    }
    setStatus('en_route');
  };

  const handleRejectTrip = async () => {
    if (activeTrip?.id && activeTrip.id.length > 10) {
      await updateTripStatus(activeTrip.id, { status: 'CANCELLED' });
    }
    setStatus('idle');
    setActiveTrip(null);
  };

  const handleMarkArrived = async () => {
    if (activeTrip?.id && activeTrip.id.length > 10) {
      await updateTripStatus(activeTrip.id, { 
        status: 'ARRIVED_AT_HOSPITAL',
        arrival_time: new Date().toISOString()
      });
    }
    setStatus('at_scene');
  };

  const handleStartTransport = async () => {
    if (activeTrip?.id && activeTrip.id.length > 10) {
      await updateTripStatus(activeTrip.id, { status: 'EN_ROUTE' });
    }
    setStatus('en_route');
  };

  const handleCancelTrip = async () => {
    if (activeTrip?.id && activeTrip.id.length > 10) {
      await updateTripStatus(activeTrip.id, { status: 'CANCELLED' });
    }
    setStatus('idle');
    setActiveTrip(null);
  };

  const initiateTrip = async (targetHosp: HospitalInfo, extraData?: any) => {
    if (!profile.id) {
       alert("Profile not loaded yet.");
       return;
    }
    
    setStatus('en_route');

    try {
      // Create record in DB
      const dbTrip = await addTrip({
        trip_ref: 'TRP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        ambulance_id: profile.id,
        hospital_id: targetHosp.id,
        patient_name: extraData?.patientName || '',
        condition: extraData?.condition || 'Unknown Condition',
        severity: extraData?.priority || 'MODERATE_L3',
        status: 'EN_ROUTE',
        er_status: 'PENDING',
        eta: targetHosp.eta || 'Fetching...'
      });
      
      // Setup local optimism while DB propagates
      setActiveTrip({
        id: dbTrip.id,
        patientName: extraData?.patientName || '',
        condition: extraData?.condition || '',
        priority: extraData?.priority || 'MODERATE_L3',
        location: 'Current Position',
        destination: targetHosp.name,
        contact: 'N/A',
        eta: targetHosp.eta || 'Fetching...',
        startCoords: currentPos,
        endCoords: targetHosp.coords,
        erStatus: 'PENDING'
      });
    } catch (err) {
      console.error("Database insert failed.", err);
      setStatus('idle');
    }
  };

  const handleManualDispatch = async (data: any) => {
    if (!data.hospitalId) {
      alert("Please select a hospital destination.");
      return;
    }
    const targetHosp = hospitals.find(h => h.id === data.hospitalId);
    if (targetHosp) await initiateTrip(targetHosp, data);
  };


  const completeTrip = async () => {
    if (!activeTrip) {
      setStatus('idle');
      return;
    }

    if (activeTrip.id && activeTrip.id.length > 10) {
      await updateTripStatus(activeTrip.id, { status: 'COMPLETED' });
    }

    // Refresh history from DB after completion
    if (profile.id) {
      setTimeout(() => fetchHistory(profile.id), 800);
    }

    setActiveTrip(null);
    setStatus('idle');
  };

  // Enhance hospitals array with mocked distances/etas for picker demo purposes
  // (In real life, we would batch call OSRM for all hospitals from currentPos)
  const hospitalDisplayList = useMemo(() => {
    return hospitals.map(h => ({
      ...h,
      distance: (Math.random() * 5 + 1).toFixed(1) + 'km',
      eta: (Math.random() * 15 + 5).toFixed(0) + ' min',
    }));
  }, [hospitals]);

  return (
    <div className={cn(
      "flex flex-col h-screen bg-void-black text-text-primary overflow-hidden transition-all duration-300 relative",
      isSos && "border-[3px] border-accent-crimson shadow-[inset_0_0_20px_rgba(255,42,95,0.4)]"
    )}>
      <TopBar 
        isOnline={isOnline} 
        onToggleOnline={handleToggleOnline} 
        profile={profile} 
        onViewProfile={() => setViewState('profile')}
        isSos={isSos}
        onToggleSos={handleToggleSos}
      />

      {/* Global Command Broadcast marquee */}
      {activeBroadcasts.length > 0 && (
        <div className="bg-accent-crimson/90 text-void-black text-[11px] font-bold py-1.5 px-6 overflow-hidden relative shrink-0 border-b border-accent-crimson/40 select-none z-40">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <span>🚨 COMMAND CENTER BROADCAST:</span>
            <span className="font-mono tracking-wide">{activeBroadcasts[0]}</span>
          </div>
        </div>
      )}

      {/* 🚨 Panic SOS Reassurance Banner */}
      {isSos && sosStatus && (
        <div className={cn(
          "py-3 px-6 text-center text-xs font-bold uppercase tracking-widest transition-all z-35 flex items-center justify-center gap-3 border-b shrink-0",
          sosStatus === 'active' || sosStatus === 'acknowledged' ? "bg-accent-crimson/20 border-accent-crimson/30 text-accent-crimson animate-pulse" :
          sosStatus === 'police_dispatched' ? "bg-accent-amber/20 border-accent-amber/30 text-accent-amber animate-pulse" :
          "bg-green-500/20 border-green-500/30 text-green-400"
        )}>
          <span className="text-sm">🛡️</span>
          {sosStatus === 'active' && <span>Emergency signal broadcasted. Waiting for dispatcher response...</span>}
          {sosStatus === 'acknowledged' && <span>Signal Acknowledged by Command Center. Identifying closest unit...</span>}
          {sosStatus === 'police_dispatched' && (
            <span>
              Officer <span className="underline">{sosAssignedPoliceName || 'Patrol'}</span> ({sosAssignedPoliceBadge || 'P-Unit'}) has been dispatched. Hold position, help is en route!
            </span>
          )}
          {sosStatus === 'police_arrived' && (
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping inline-block" />
              Officer <span className="underline">{sosAssignedPoliceName || 'Patrol'}</span> has arrived. Location is SECURED and guarded.
            </span>
          )}
        </div>
      )}

      {/* Direct Route Override Banner */}
      {directNote && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[5000] bg-accent-cyan text-void-black font-extrabold uppercase tracking-widest text-[11px] px-6 py-2 rounded-full shadow-glow-cyan animate-bounce">
          {directNote}
        </div>
      )}

      {/* Safety Ping Modal Overlay */}
      {safetyPinged && (
        <div className="fixed inset-0 z-[9999] bg-void-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-accent-crimson rounded-2xl p-8 max-w-md w-full shadow-glow-crimson text-center">
            <div className="w-16 h-16 rounded-full bg-accent-crimson/15 flex items-center justify-center text-accent-crimson mx-auto mb-4 border border-accent-crimson/30">
              <span className="w-4 h-4 rounded-full bg-current animate-ping" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-accent-crimson mb-2">SAFETY VERIFICATION</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              The Command Center has sent a safety ping request. Please confirm you are okay and in normal status.
            </p>
            <button 
              onClick={handleConfirmSafety}
              className="w-full py-3.5 bg-accent-crimson text-void-black font-extrabold uppercase tracking-widest text-xs rounded-xl shadow-glow-crimson hover:bg-accent-crimson/90 active:scale-95 transition-all"
            >
              CONFIRM I AM OKAY
            </button>
          </div>
        </div>
      )}
      
      {viewState === 'profile' ? (
        <ProfileView 
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBack={() => setViewState('dashboard')}
        />
      ) : (
        <>
          <StatusBar 
            isOnline={isOnline && status === 'idle'} 
            hospitals={hospitalDisplayList}
            onManualDispatch={handleManualDispatch}
          />

          <div className="flex flex-1 overflow-hidden">
            <DispatchSidebar 
              status={status}
              trip={activeTrip}
              onAccept={handleAcceptTrip}
              onReject={handleRejectTrip}
              onMarkArrived={handleMarkArrived}
              onStartTransport={handleStartTransport}
              onComplete={completeTrip}
              onCancel={handleCancelTrip}
              onUpdateTrip={handleUpdateTrip}
              hospitals={hospitalDisplayList}
              onRequestSwap={handleRequestSwap}
            />

            <MapView 
              currentPos={currentPos}
              destination={activeTrip?.endCoords || null}
              isOnline={isOnline}
              onPosUpdate={setCurrentPos}
              erStatus={activeTrip?.erStatus}
              bayNote={activeTrip?.bayNote}
              etaSeconds={activeTrip?.etaSeconds}
              etaDisplay={activeTrip?.eta}
            />

            <TransferLog 
              entries={history}
              onClear={() => setHistory([])}
            />
          </div>
        </>
      )}
    </div>
  );
};
