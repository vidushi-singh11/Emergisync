import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/hospital/TopBar';
import { CapacityPanel } from '../../components/hospital/CapacityPanel';
import { IncomingArrivals } from '../../components/hospital/IncomingArrivals';
import type { InboundCase, IntakeStatus } from '../../components/hospital/IncomingArrivals';
import { AdmissionsLog } from '../../components/hospital/AdmissionsLog';
import type { AdmissionEntry } from '../../components/hospital/AdmissionsLog';

import { supabase } from '../../lib/supabase';
import { useTripSync } from '../../hooks/useTripSync';

export const HospitalDashboard = () => {
  // --- STATE ---
  const [profile, setProfile] = useState({
    id: '',
    name: 'Metro General Central',
    traumaLevel: 'Level I',
  });

  const [erBeds, setErBeds] = useState({ total: 24, used: 18 });
  const [icuBeds, setIcuBeds] = useState({ total: 12, used: 9 });
  const [isDiversion, setIsDiversion] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionEntry[]>([]);

  // Use the realtime hook to fetch and sync trips for this specific hospital
  const { trips, updateTripStatus } = useTripSync(profile.id || undefined);

  // Map database trips to the local InboundCase format
  const [inboundCases, setInboundCases] = useState<InboundCase[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          const { data: hospData } = await supabase.from('hospital_profiles').select('*').eq('id', authData.user.id).single();
          
          if (profileData) {
            let tL = 'Level I';
            if (hospData?.trauma_level) {
              if (hospData.trauma_level === '1') tL = 'Level I';
              else if (hospData.trauma_level === '2') tL = 'Level II';
              else if (hospData.trauma_level === '3') tL = 'Level III';
            }
            setProfile({
              id: authData.user.id,
              name: profileData.full_name || 'Hospital',
              traumaLevel: tL,
            });
            
            if (profileData.updated_at) {
              setLastUpdated(new Date(profileData.updated_at));
            } else {
              setLastUpdated(new Date());
            }
          }
          
          if (hospData) {
            setErBeds({
              total: hospData.capacity_er_total || 24,
              used: Math.max(0, hospData.capacity_er_total - hospData.capacity_er_available),
            });
            setIcuBeds({
              total: hospData.capacity_icu_total || 12,
              used: Math.max(0, hospData.capacity_icu_total - hospData.capacity_icu_available),
            });
            setIsDiversion(!!hospData.is_diversion);
          }
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    // Convert real database trips to InboundCase format with full patient & flow state
    const cases: InboundCase[] = trips.map(t => ({
      id: t.id,
      ambulanceUnit: t.trip_ref || 'AMB-UNK',
      eta: t.eta || 'Unknown',
      etaSeconds: t.eta_seconds,
      patientName: t.patient_name || 'Unknown Patient',
      severity: t.severity, // 'CRITICAL_L1' | 'SEVERE_L2' | 'MODERATE_L3' | 'MINOR_L4'
      condition: t.condition || 'Unknown',
      status: t.er_status, // 'PENDING' | 'PREPARING' | 'READY' | 'PROCESSING' | 'RECEIVED'
      ageGroup: t.age_group,
      specialNeeds: t.special_needs || [],
      driverNote: t.driver_note,
      ackTime: t.ack_time,
      bayNote: t.bay_note,
      driverStatus: t.status // driver trip status
    }));
    setInboundCases(cases);
  }, [trips]);

  // Derived State
  const loadStatus = erBeds.used / erBeds.total > 0.9 ? 'Critical' : erBeds.used / erBeds.total > 0.75 ? 'High' : 'Normal';
  const staffCount = 42; // Mock live staff count

  // --- HANDLERS ---
  const handleToggleDiversion = async () => {
    const nextDiversion = !isDiversion;
    setIsDiversion(nextDiversion);
    
    if (profile.id) {
      try {
        await supabase
          .from('hospital_profiles')
          .update({ is_diversion: nextDiversion })
          .eq('id', profile.id);
      } catch (err) {
        console.error("Failed to sync diversion status:", err);
      }
    }
  };

  const handleUpdateBeds = async (type: 'er' | 'icu', action: 'inc' | 'dec') => {
    setLastUpdated(new Date());

    if (type === 'er') {
      const nextUsed = action === 'inc' ? Math.min(erBeds.used + 1, erBeds.total) : Math.max(erBeds.used - 1, 0);
      setErBeds(prev => ({ ...prev, used: nextUsed }));
      
      if (profile.id) {
        const available = erBeds.total - nextUsed;
        await supabase
          .from('hospital_profiles')
          .update({ capacity_er_available: available })
          .eq('id', profile.id);
      }
    } else {
      const nextUsed = action === 'inc' ? Math.min(icuBeds.used + 1, icuBeds.total) : Math.max(icuBeds.used - 1, 0);
      setIcuBeds(prev => ({ ...prev, used: nextUsed }));
      
      if (profile.id) {
        const available = icuBeds.total - nextUsed;
        await supabase
          .from('hospital_profiles')
          .update({ capacity_icu_available: available })
          .eq('id', profile.id);
      }
    }
  };

  const handleUpdateCaseStatus = async (id: string, newStatus: IntakeStatus, bayNote?: string) => {
    try {
      const updates: any = { er_status: newStatus };
      
      if (newStatus === 'PENDING') {
        updates.ack_time = new Date().toISOString();
      }
      if (bayNote !== undefined && bayNote !== null) {
        updates.bay_note = bayNote;
      }
      if (newStatus === 'RECEIVED') {
        updates.arrival_time = new Date().toISOString();
      }

      await updateTripStatus(id, updates);
      
      // If arrived (RECEIVED), do local side-effects for admissions log and bed count
      if (newStatus === 'RECEIVED') {
        const completedCase = trips.find(c => c.id === id);
        if (completedCase) {
          const newAdmission: AdmissionEntry = {
            id: Math.random().toString(),
            patientName: completedCase.patient_name || 'Unknown Patient',
            tripId: completedCase.id,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            condition: completedCase.condition || 'Unknown'
          };
          setAdmissions(prev => [newAdmission, ...prev]);
          handleUpdateBeds('er', 'inc');
        }
      }
    } catch (err) {
      console.error("Failed to update status in DB:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-void-black text-text-primary overflow-hidden">
      <TopBar 
        hospitalName={profile.name}
        traumaLevel={profile.traumaLevel}
        loadStatus={loadStatus}
        staffCount={staffCount}
      />

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 flex flex-col overflow-hidden">
          <IncomingArrivals 
            cases={inboundCases}
            onUpdateStatus={handleUpdateCaseStatus}
          />
          <AdmissionsLog entries={admissions} />
        </div>
        
        <CapacityPanel 
          erBeds={erBeds}
          icuBeds={icuBeds}
          isDiversion={isDiversion}
          onToggleDiversion={handleToggleDiversion}
          onUpdateBeds={handleUpdateBeds}
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  );
};
