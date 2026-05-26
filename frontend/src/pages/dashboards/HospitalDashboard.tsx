import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/hospital/TopBar';
import { CapacityPanel } from '../../components/hospital/CapacityPanel';
import { IncomingArrivals } from '../../components/hospital/IncomingArrivals';
import type { InboundCase, IntakeStatus } from '../../components/hospital/IncomingArrivals';
import { AdmissionsLog } from '../../components/hospital/AdmissionsLog';
import type { AdmissionEntry } from '../../components/hospital/AdmissionsLog';
import { ProfileView } from '../../components/hospital/ProfileView';
import { Activity } from 'lucide-react';

import { supabase } from '../../lib/supabase';
import { useTripSync } from '../../hooks/useTripSync';

export const HospitalDashboard = () => {
  // --- STATE ---
  const [viewState, setViewState] = useState<'dashboard' | 'profile'>('dashboard');
  const [profile, setProfile] = useState({
    id: '',
    name: 'Metro General Central',
    phone: '',
    email: 'user@hospital.org',
    traumaLevel: '1',
    erTotal: 24,
    icuTotal: 12,
    staffCount: 42,
    emergencyLine: 'N/A',
    latitude: 40.7128,
    longitude: -74.0060
  });

  const [erBeds, setErBeds] = useState({ total: 24, used: 18 });
  const [icuBeds, setIcuBeds] = useState({ total: 12, used: 9 });
  const [isDiversion, setIsDiversion] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [admissions, setAdmissions] = useState<AdmissionEntry[]>([]);
  const [activeBroadcasts, setActiveBroadcasts] = useState<string[]>([]);

  // First Login / Setup States
  const [showFirstLoginSetup, setShowFirstLoginSetup] = useState(false);
  const [setupErTotal, setSetupErTotal] = useState(24);
  const [setupIcuTotal, setSetupIcuTotal] = useState(12);
  const [setupStaffCount, setSetupStaffCount] = useState(42);
  const [setupEmergencyLine, setSetupEmergencyLine] = useState('');

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
          
          if (profileData && hospData) {
            const hasZeroCapacities = 
              hospData.capacity_er_total === 0 || 
              hospData.capacity_icu_total === 0 || 
              hospData.staff_count === 0 || 
              hospData.emergency_line === 'N/A';

            setProfile({
              id: authData.user.id,
              name: profileData.full_name || 'Hospital',
              phone: profileData.phone || '',
              email: authData.user.email || 'N/A',
              traumaLevel: hospData.trauma_level || '3',
              erTotal: hospData.capacity_er_total || 24,
              icuTotal: hospData.capacity_icu_total || 12,
              staffCount: hospData.staff_count || 42,
              emergencyLine: hospData.emergency_line || 'N/A',
              latitude: hospData.latitude || 40.7128,
              longitude: hospData.longitude || -74.0060
            });
            
            // Sync erBeds used count
            setErBeds({
              total: hospData.capacity_er_total || 24,
              used: Math.max(0, hospData.capacity_er_total - hospData.capacity_er_available),
            });
            
            // Sync icuBeds used count
            setIcuBeds({
              total: hospData.capacity_icu_total || 12,
              used: Math.max(0, hospData.capacity_icu_total - hospData.capacity_icu_available),
            });

            setIsDiversion(!!hospData.is_diversion);

            if (profileData.updated_at) {
              setLastUpdated(new Date(profileData.updated_at));
            } else {
              setLastUpdated(new Date());
            }

            if (hasZeroCapacities) {
              setSetupErTotal(hospData.capacity_er_total || 24);
              setSetupIcuTotal(hospData.capacity_icu_total || 12);
              setSetupStaffCount(hospData.staff_count || 42);
              setSetupEmergencyLine(hospData.emergency_line === 'N/A' ? '' : hospData.emergency_line);
              setShowFirstLoginSetup(true);
            }
          }
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      }
    };
    fetchProfile();
  }, []);

  // Global broadcasts subscription
  useEffect(() => {
    const channel = supabase
      .channel('hospital-broadcasts')
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
      driverStatus: t.status, // driver trip status
      escalationTriggered: t.escalation_triggered,
      isBypass: t.is_bypass,
      nudgeSent: t.nudge_sent
    }));
    setInboundCases(cases);
  }, [trips]);

  // Derived State
  const loadStatus = erBeds.used / erBeds.total > 0.9 ? 'Critical' : erBeds.used / erBeds.total > 0.75 ? 'High' : 'Normal';

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

  const handleUpdateProfile = async (updatedData: any) => {
    if (!profile.id) return;

    try {
      // 1. Update profiles table
      const { error: pError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedData.name,
          phone: updatedData.phone
        })
        .eq('id', profile.id);

      if (pError) throw pError;

      // Adjust available counts dynamically
      const nextErAvailable = Math.max(0, updatedData.erTotal - erBeds.used);
      const nextIcuAvailable = Math.max(0, updatedData.icuTotal - icuBeds.used);

      // 2. Update hospital_profiles table
      const { error: hospError } = await supabase
        .from('hospital_profiles')
        .update({
          trauma_level: updatedData.traumaLevel,
          capacity_er_total: updatedData.erTotal,
          capacity_er_available: nextErAvailable,
          capacity_icu_total: updatedData.icuTotal,
          capacity_icu_available: nextIcuAvailable,
          staff_count: updatedData.staffCount,
          emergency_line: updatedData.emergencyLine,
          latitude: updatedData.latitude,
          longitude: updatedData.longitude
        })
        .eq('id', profile.id);

      if (hospError) throw hospError;

      // 3. Sync local state
      setProfile(prev => ({
        ...prev,
        name: updatedData.name,
        phone: updatedData.phone,
        traumaLevel: updatedData.traumaLevel,
        erTotal: updatedData.erTotal,
        icuTotal: updatedData.icuTotal,
        staffCount: updatedData.staffCount,
        emergencyLine: updatedData.emergencyLine,
        latitude: updatedData.latitude,
        longitude: updatedData.longitude
      }));

      setErBeds(prev => ({
        total: updatedData.erTotal,
        used: Math.min(prev.used, updatedData.erTotal)
      }));

      setIcuBeds(prev => ({
        total: updatedData.icuTotal,
        used: Math.min(prev.used, updatedData.icuTotal)
      }));

      setLastUpdated(new Date());

    } catch (err) {
      console.error("Failed to update database profile:", err);
      throw err;
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupEmergencyLine.trim()) {
      alert("Please enter a valid emergency line hotline.");
      return;
    }

    try {
      // 1. Update hospital_profiles table in Supabase
      const { error: hospError } = await supabase
        .from('hospital_profiles')
        .update({
          capacity_er_total: setupErTotal,
          capacity_er_available: setupErTotal,
          capacity_icu_total: setupIcuTotal,
          capacity_icu_available: setupIcuTotal,
          staff_count: setupStaffCount,
          emergency_line: setupEmergencyLine.trim()
        })
        .eq('id', profile.id);

      if (hospError) throw hospError;

      // 2. Sync local state
      setProfile(prev => ({
        ...prev,
        erTotal: setupErTotal,
        icuTotal: setupIcuTotal,
        staffCount: setupStaffCount,
        emergencyLine: setupEmergencyLine.trim()
      }));

      setErBeds({ total: setupErTotal, used: 0 });
      setIcuBeds({ total: setupIcuTotal, used: 0 });
      setShowFirstLoginSetup(false);
      setLastUpdated(new Date());
      alert("Operational capacity configured successfully!");
    } catch (err) {
      console.error("Failed to save operational setup:", err);
      alert("Operational readiness error: Failed to save capacity credentials.");
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

  const handleEscalateTrip = async (id: string) => {
    try {
      await updateTripStatus(id, { escalation_triggered: true });
    } catch (err) {
      console.error("Failed to escalate trip:", err);
    }
  };

  const activeNudges = inboundCases.filter(c => c.nudgeSent && !c.ackTime);

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

      {/* Control Room slow acknowledgement nudge banner */}
      {activeNudges.length > 0 && (
        <div className="bg-accent-amber text-void-black text-[11px] font-extrabold py-2 px-6 shrink-0 border-b border-accent-amber/40 animate-pulse text-center select-none z-40 shadow-glow-amber">
          ⚠️ COMMAND CENTER URGENT NUDGE: Critical Patient Inbound for Unit {activeNudges[0].ambulanceUnit}. Please acknowledge immediately!
        </div>
      )}

      <TopBar 
        hospitalName={profile.name}
        traumaLevel={profile.traumaLevel}
        loadStatus={loadStatus}
        staffCount={profile.staffCount}
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <IncomingArrivals 
              cases={inboundCases}
              onUpdateStatus={handleUpdateCaseStatus}
              onEscalate={handleEscalateTrip}
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
      )}
      {/* 🏥 Gorgeous Glassmorphic Onboarding Modal */}
      {showFirstLoginSetup && (
        <div className="fixed inset-0 bg-void-black/85 backdrop-blur-md flex items-center justify-center p-6 z-[9999]">
          <div className="w-full max-w-[480px] bg-surface-elevated border border-accent-cyan/35 shadow-[0_0_50px_rgba(34,211,238,0.15)] rounded-2xl p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-cyan to-accent-crimson" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border border-accent-cyan/20">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-text-primary tracking-tight uppercase">Operational Setup</h3>
                <p className="text-[11px] text-text-muted font-mono">EMERGISYNC CLINICAL READINESS</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              Welcome, Hospital Administrator. Please configure your live facility bounds before gaining access to the emergency grid corridor.
            </p>

            <form onSubmit={handleCompleteSetup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Total ER Beds</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:border-accent-cyan outline-none transition-all"
                    value={setupErTotal}
                    onChange={e => setSetupErTotal(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Total ICU Beds</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:border-accent-cyan outline-none transition-all"
                    value={setupIcuTotal}
                    onChange={e => setSetupIcuTotal(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Active Staff Count</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:border-accent-cyan outline-none transition-all"
                  value={setupStaffCount}
                  onChange={e => setSetupStaffCount(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Emergency Line Hotline</label>
                <input 
                  type="text"
                  placeholder="e.g. +1 555-9111"
                  className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all"
                  value={setupEmergencyLine}
                  onChange={e => setSetupEmergencyLine(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 border-t border-border-glow/50 mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent-cyan text-void-black text-xs font-extrabold uppercase tracking-widest rounded-lg hover:scale-[1.02] active:scale-[0.98] shadow-glow-cyan transition-all outline-none"
                >
                  Save Operational Schema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

