import React, { useState, useEffect, useMemo } from 'react';
import { TopBar } from '../../components/ambulance/TopBar';
import { StatusBar } from '../../components/ambulance/StatusBar';
import { DispatchSidebar } from '../../components/ambulance/DispatchSidebar';
import type { TripData, TripStatus } from '../../components/ambulance/DispatchSidebar';
import { TransferLog } from '../../components/ambulance/TransferLog';
import { MapView } from '../../components/ambulance/MapView';
import { supabase } from '../../lib/supabase';
import { useTripSync } from '../../hooks/useTripSync';
import type { HospitalInfo } from '../../types/models';

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
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<TripStatus>('idle');
  const [activeTrip, setActiveTrip] = useState<TripData | null>(null);
  const [currentPos, setCurrentPos] = useState<[number, number]>([40.7128, -74.0060]);
  const [history, setHistory] = useState<TransferEntry[]>([]);
  const [profile, setProfile] = useState({
    id: '',
    name: 'Personnel',
    email: 'user@medishield.gov',
    unitId: 'AMB-UNK',
    vehicleReg: 'N/A',
    vehicleType: 'Advanced Life Support (ALS)'
  });
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  
  // Custom hook for realtime DB sync
  const { trips, addTrip, updateTripStatus } = useTripSync();

  // --- PERSISTENCE & INITIAL FETCH ---
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('amb_transfer_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
      localStorage.removeItem('amb_transfer_history');
    }

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
              email: authData.user.email || 'N/A',
              unitId: ambData.unit_id || 'AMB-UNK',
              vehicleReg: ambData.vehicle_reg || 'N/A',
              vehicleType: ambData.vehicle_type === 'als' ? 'Advanced Life Support' : 'Basic Life Support'
            });
          }
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

  useEffect(() => {
    localStorage.setItem('amb_transfer_history', JSON.stringify(history));
  }, [history]);

  // --- REALTIME TRIP SYNC ---
  // Keep activeTrip in sync with DB state
  useEffect(() => {
    if (!profile.id) return;
    
    // Find all my active trips from the realtime pool
    const myTrips = trips.filter(t => t.ambulance_id === profile.id);
    
    if (myTrips.length > 0) {
      // Sort by created_at descending (latest first) to ensure we always map the most recent mission
      const sorted = [...myTrips].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
      
      const myDbTrip = sorted[0];
      
      // Auto-cancel any stale duplicate active trips in background to preserve database state integrity
      if (sorted.length > 1) {
        sorted.slice(1).forEach(staleTrip => {
          console.warn(`Defensive Sync: Auto-cancelling stale duplicate active trip ${staleTrip.id}`);
          updateTripStatus(staleTrip.id, { status: 'CANCELLED' }).catch(err => {
            console.error("Failed to auto-clean duplicate active trip", err);
          });
        });
      }

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
        driverNote: myDbTrip.driver_note
      }));

      if (myDbTrip.status === 'EN_ROUTE') {
        setStatus('en_route');
      } else if (myDbTrip.status === 'ARRIVED_AT_HOSPITAL' || myDbTrip.status === 'PATIENT_HANDOFF_COMPLETE') {
        setStatus('at_scene');
      } else {
        setStatus('dispatched');
      }
    } else {
      // Safe wipe: Reset local active states if there are no active trips in the DB
      if (status !== 'idle') {
        setActiveTrip(null);
        setStatus('idle');
      }
    }
  }, [trips, profile.id, hospitals]);


  // --- HANDLERS ---
  const handleToggleOnline = () => {
    if (status !== 'idle') {
      alert("Cannot go offline while on an active trip.");
      return;
    }
    setIsOnline(!isOnline);
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

    const newEntry: TransferEntry = {
      id: activeTrip.id,
      patient: activeTrip.patientName || 'Unknown Patient',
      hospital: activeTrip.destination,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: activeTrip.priority,
      condition: activeTrip.condition,
      totalTime: '12 min 45 sec' 
    };

    setHistory(prev => [newEntry, ...prev]);
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
    <div className="flex flex-col h-screen bg-void-black text-text-primary overflow-hidden">
      <TopBar 
        isOnline={isOnline} 
        onToggleOnline={handleToggleOnline} 
        profile={profile} 
      />
      
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
    </div>
  );
};
