import React, { useState, useEffect } from 'react';
import { Filter, Download, Activity, ShieldAlert, AlertOctagon, PhoneCall, Bed, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export const HospitalCoordination = () => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profData } = await supabase.from('profiles').select('id, full_name');
        if (profData) {
          const map: Record<string, any> = {};
          profData.forEach(p => { map[p.id] = p; });
          setProfiles(map);
        }

        const { data: hospData } = await supabase.from('hospital_profiles').select('*');
        if (hospData) setHospitals(hospData);

        const { data: tripData } = await supabase
          .from('trips')
          .select('*')
          .neq('status', 'COMPLETED')
          .neq('status', 'CANCELLED');
        if (tripData) setTrips(tripData);
      } catch (err) {
        console.error("Failed to fetch coordination details:", err);
      }
    };

    fetchData();

    // Subscribe to realtime updates
    const hospSub = supabase
      .channel('hospital-coord-hospitals')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'hospital_profiles' }, payload => {
        setHospitals(current => current.map(h => h.id === payload.new.id ? payload.new : h));
      })
      .subscribe();

    const tripsSub = supabase
      .channel('hospital-coord-trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        supabase
          .from('trips')
          .select('*')
          .neq('status', 'COMPLETED')
          .neq('status', 'CANCELLED')
          .then(({ data }) => { if (data) setTrips(data); });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(hospSub);
      supabase.removeChannel(tripsSub);
    };
  }, []);

  const handleNudge = async (tripId: string) => {
    try {
      await supabase.from('trips').update({ nudge_sent: true }).eq('id', tripId);
      alert("Nudge sent to hospital dashboard.");
    } catch (err) {
      console.error(err);
    }
  };

  const activeEscalations = trips.filter(t => t.escalation_triggered);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left 60% - Inbound Trips */}
      <div className="flex-[60] bg-surface-primary border-r border-border-glow p-6 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[13px] font-bold tracking-widest uppercase flex items-center gap-3">
            <Activity size={18} className="text-accent-crimson animate-pulse" />
            Live Inbound Facility Mesh
          </h2>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-glow text-[10px] text-text-muted uppercase tracking-widest">
              <th className="pb-3 font-medium">Trip ID</th>
              <th className="pb-3 font-medium">Hospital Dest</th>
              <th className="pb-3 font-medium">Severity</th>
              <th className="pb-3 font-medium">ETA</th>
              <th className="pb-3 font-medium">ER Status</th>
              <th className="pb-3 font-medium">Slow Overdue</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-text-muted uppercase font-bold tracking-widest">
                  No en route transfers active
                </td>
              </tr>
            ) : (
              trips.map((trip) => {
                const targetHosp = hospitals.find(h => h.id === trip.hospital_id);
                const hospName = targetHosp ? (profiles[targetHosp.id]?.full_name || 'Hospital') : 'Unknown';
                
                // Slow check: critical trip en route for > 3m (180000ms) with no ack
                const isOverdue = (trip.severity === 'CRITICAL_L1' || trip.severity === 'SEVERE_L2') && 
                                  !trip.ack_time && 
                                  (new Date().getTime() - new Date(trip.created_at).getTime() > 180000);

                return (
                  <tr key={trip.id} className="border-b border-border-glow/40 hover:bg-surface-elevated transition-colors cursor-pointer group">
                    <td className="py-4">
                      <div className="font-mono font-bold text-xs group-hover:text-accent-crimson">{trip.trip_ref}</div>
                      <div className="text-[9px] text-text-muted font-mono">{trip.id.slice(0,8)}</div>
                    </td>
                    <td className="py-4 text-xs font-bold text-accent-cyan hover:underline">{hospName}</td>
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
                    <td className="py-4 text-xs font-mono font-bold text-text-primary">{trip.eta || 'Unknown'}</td>
                    <td className="py-4">
                      <span className={cn(
                        "text-[9px] font-bold uppercase",
                        trip.er_status === 'READY' ? "text-green-500" :
                        trip.er_status === 'PREPARING' ? "text-accent-amber" :
                        "text-text-muted"
                      )}>
                        {trip.er_status}
                      </span>
                    </td>
                    <td className="py-4">
                      {isOverdue ? (
                        <button 
                          onClick={() => handleNudge(trip.id)}
                          className="px-2 py-0.5 bg-accent-amber text-void-black text-[9px] font-bold rounded uppercase animate-pulse"
                        >
                          Nudge Slow
                        </button>
                      ) : (
                        <span className="text-[9px] text-text-muted uppercase font-bold">NORMAL</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Right 40% - Facility Monitoring & Escalation */}
      <div className="flex-[40] flex flex-col bg-surface-elevated overflow-y-auto custom-scrollbar">
        
        {/* Live Facility Capacity Panel */}
        <div className="p-6 border-b border-border-glow flex-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Bed size={14} className="text-accent-cyan" /> Priority Facilities Load
            </h3>
            <span className="text-[9px] text-text-muted">ACTIVE TELEMETRY</span>
          </div>

          <div className="space-y-4">
            {hospitals.map((hosp) => {
              const name = profiles[hosp.id]?.full_name || 'Hospital';
              
              // Dynamic utilization percentage
              const erTotal = hosp.capacity_er_total || 1;
              const erUsed = hosp.capacity_er_total - hosp.capacity_er_available;
              const erUtilization = Math.round((erUsed / erTotal) * 100);

              // Predictive Load (Inbound Pressure)
              const inboundCount = trips.filter(t => t.hospital_id === hosp.id).length;
              
              return (
                <div key={hosp.id} className={cn(
                  "p-4 rounded-xl border transition-all bg-void-black/50",
                  hosp.is_diversion ? "border-accent-crimson bg-accent-crimson/5 shadow-[inset_0_0_10px_rgba(255,42,95,0.15)]" : "border-border-glow hover:border-accent-cyan/40"
                )}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-sm text-text-primary mb-1">{name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-surface-elevated border border-border-glow text-text-secondary">LEVEL {hosp.trauma_level} TRAUMA</span>
                        <span className={cn(
                          "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded",
                          erUtilization > 90 ? "bg-accent-crimson/25 text-accent-crimson" :
                          erUtilization > 75 ? "bg-accent-amber/25 text-accent-amber" :
                          "bg-accent-cyan/15 text-accent-cyan"
                        )}>
                          {erUtilization > 90 ? 'CRITICAL' : erUtilization > 75 ? 'HIGH LOAD' : 'NORMAL'}
                        </span>
                      </div>
                    </div>
                    {hosp.is_diversion && (
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-accent-crimson text-void-black rounded uppercase animate-pulse">DIVERSION ON</span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {/* circular gauge */}
                    <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-[#1a1a2a]" />
                        <circle 
                          cx="22" cy="22" r="18" 
                          stroke={erUtilization > 90 ? '#ff2a5f' : erUtilization > 75 ? '#ffb020' : '#22d3ee'} 
                          strokeWidth="3.5" fill="transparent" 
                          strokeDasharray={113.1} strokeDashoffset={113.1 - (Math.min(erUtilization, 100) / 100) * 113.1}
                        />
                      </svg>
                      <span className="absolute text-[9px] font-bold font-mono text-text-primary">{erUtilization}%</span>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[8px] text-text-muted font-bold uppercase mb-0.5">ER Beds</p>
                        <p className="text-xs font-mono font-bold text-text-primary">
                          {hosp.capacity_er_available} <span className="text-[9px] text-text-muted">/ {hosp.capacity_er_total}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-text-muted font-bold uppercase mb-0.5">ICU Beds</p>
                        <p className="text-xs font-mono font-bold text-text-primary">
                          {hosp.capacity_icu_available} <span className="text-[9px] text-text-muted">/ {hosp.capacity_icu_total}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-text-muted font-bold uppercase mb-0.5 text-accent-cyan">Inbound</p>
                        <p className="text-xs font-mono font-bold text-accent-cyan animate-pulse">
                          {inboundCount} units
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Escalation Monitor */}
        {activeEscalations.length > 0 && (
          <div className="p-6 bg-accent-crimson/5 border-t border-accent-crimson/20 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-accent-crimson">
              <ShieldAlert size={14} className="animate-pulse" /> Urgent Escalations Active
            </h3>
            <div className="space-y-3">
              {activeEscalations.map(trip => {
                const targetHosp = hospitals.find(h => h.id === trip.hospital_id);
                const hospName = targetHosp ? (profiles[targetHosp.id]?.full_name || 'Hospital') : 'Unknown';
                return (
                  <div key={trip.id} className="p-4 bg-void-black border border-accent-crimson/40 rounded-xl">
                    <p className="font-mono font-bold text-accent-crimson text-xs">{trip.trip_ref}</p>
                    <p className="text-[11px] text-text-primary mt-1 font-bold">ETA Under 3m & ER Preparing</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Facility: {hospName}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
