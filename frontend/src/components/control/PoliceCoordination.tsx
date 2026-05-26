import React, { useState, useEffect } from 'react';
import { Filter, Download, Navigation, AlertTriangle, Shield, Clock, RotateCcw, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export const PoliceCoordination = () => {
  // --- REAL-TIME STATES ---
  const [clearances, setClearances] = useState<any[]>([]);
  const [policeProfiles, setPoliceProfiles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  
  // UI States
  const [reassigningClearanceId, setReassigningClearanceId] = useState<string | null>(null);
  const [isFilterClearedOnly, setIsFilterClearedOnly] = useState(false);

  // --- INITIAL DATA FETCH & SUBSCRIPTIONS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch police profiles joining user full_name
        const { data: polData } = await supabase
          .from('police_profiles')
          .select('*, profiles(full_name)');
        if (polData) setPoliceProfiles(polData);

        // 2. Fetch en-route/active trips
        const { data: tripData } = await supabase
          .from('trips')
          .select('*')
          .neq('status', 'COMPLETED')
          .neq('status', 'CANCELLED');
        if (tripData) setTrips(tripData);

        // 3. Fetch clearances
        const { data: clearData } = await supabase
          .from('police_clearances')
          .select('*')
          .neq('status', 'RELEASED');
        if (clearData) setClearances(clearData);

      } catch (err) {
        console.error("Failed to load Control Room police data:", err);
      }
    };

    fetchData();

    // Subscribe to police clearances
    const clearanceChannel = supabase
      .channel('control-police-clearances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'police_clearances' }, (payload) => {
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
      })
      .subscribe();

    // Subscribe to police profiles (updates to GPS and online statuses)
    const profileChannel = supabase
      .channel('control-police-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'police_profiles' }, async (payload) => {
        // Fetch specific profile name to keep details updated
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.id)
            .single();
          
          const profileWithJoinedName = {
            ...payload.new,
            profiles: prof ? { full_name: prof.full_name } : { full_name: 'Officer' }
          };

          setPoliceProfiles(current => {
            const exists = current.some(p => p.id === payload.new.id);
            if (exists) {
              return current.map(p => p.id === payload.new.id ? profileWithJoinedName : p);
            }
            return [profileWithJoinedName, ...current];
          });
        }
      })
      .subscribe();

    // Subscribe to trips
    const tripChannel = supabase
      .channel('control-police-trips')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
        setTrips(current => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.status === 'COMPLETED' || payload.new.status === 'CANCELLED') return current;
            return [payload.new, ...current];
          }
          if (payload.eventType === 'UPDATE') {
            if (payload.new.status === 'COMPLETED' || payload.new.status === 'CANCELLED') {
              return current.filter(t => t.id !== payload.new.id);
            }
            return current.map(t => t.id === payload.new.id ? payload.new : t);
          }
          if (payload.eventType === 'DELETE') return current.filter(t => t.id !== payload.old.id);
          return current;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(clearanceChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(tripChannel);
    };
  }, []);

  // --- ACTIONS ---
  const handleReassignOfficer = async (clearanceId: string, newOfficerId: string) => {
    try {
      const { error } = await supabase
        .from('police_clearances')
        .update({ 
          police_unit_id: newOfficerId,
          status: 'SENT', // reset to sent for the new officer to ACK!
          updated_at: new Date().toISOString()
        })
        .eq('id', clearanceId);

      if (error) throw error;
      setReassigningClearanceId(null);
      alert("Corridor reassigned successfully. New unit notified.");
    } catch (err) {
      console.error("Failed to reassign officer:", err);
      alert("Failed to reassign officer. Try again.");
    }
  };

  const handleRequestBackup = async (junctionId: string, tripId: string) => {
    // Finds nearest online officer who is NOT currently assigned to this trip
    const assignedOfficerIds = clearances.filter(c => c.trip_id === tripId).map(c => c.police_unit_id);
    const availableBackup = policeProfiles.find(p => p.is_online && !assignedOfficerIds.includes(p.id));

    if (!availableBackup) {
      alert("No alternate patrol officers are online to receive backup dispatch requests.");
      return;
    }

    try {
      await supabase
        .from('police_clearances')
        .insert({
          trip_id: tripId,
          police_unit_id: availableBackup.id,
          junction_id: junctionId,
          status: 'SENT'
        });
      alert(`Backup units dispatched! Officer ${availableBackup.unit_id} assigned to adjacent junction.`);
    } catch (err) {
      console.error("Failed to dispatch backup officer:", err);
    }
  };

  const handleDismissEscalation = async (clearanceId: string) => {
    try {
      const clearance = clearances.find(c => c.id === clearanceId);
      if (!clearance) return;
      
      // Update status back to ACKNOWLEDGED or CLEAR
      await supabase
        .from('police_clearances')
        .update({ status: 'ACKNOWLEDGED' })
        .eq('id', clearanceId);

      // Dismiss trip level escalation if active
      await supabase
        .from('trips')
        .update({ escalation_triggered: false })
        .eq('id', clearance.trip_id);

    } catch (err) {
      console.error("Failed to dismiss escalation:", err);
    }
  };

  // --- DERIVED TACTICAL COMPUTATIONS ---

  // 1. Live Clearances Joined Dataset
  const joinedClearances = clearances.map(c => {
    const trip = trips.find(t => t.id === c.trip_id);
    const officer = policeProfiles.find(p => p.id === c.police_unit_id);
    const officerName = officer?.profiles?.full_name || 'Assigned Officer';
    const officerCallsign = officer?.unit_id || 'P-UNK';
    
    // Check if ACK is stale (>3 mins en route without ACK)
    const isStale = (c.status === 'PENDING' || c.status === 'SENT') &&
      ((new Date().getTime() - new Date(c.created_at).getTime()) > 180000);

    const severityMap: Record<string, string> = {
      'CRITICAL_L1': 'CRITICAL',
      'SEVERE_L2': 'HIGH',
      'MODERATE_L3': 'MEDIUM',
      'MINOR_L4': 'LOW'
    };

    return {
      id: c.id,
      tripId: trip?.trip_ref || 'TRP-UNK',
      tripDbId: c.trip_id,
      severity: severityMap[trip?.severity || ''] || 'MEDIUM',
      junctionId: c.junction_id,
      policeUnit: officerCallsign,
      policeName: officerName,
      status: isStale ? 'STALE ALERT' : c.status,
      estClearance: trip?.eta || 'Calculating...',
      lastUpdate: new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdAt: c.created_at,
      isStale: isStale
    };
  }).filter(c => !isFilterClearedOnly || c.status !== 'CLEARED');

  // 2. Dynamic Corridor Hotspots
  // Group active en-route trips approaching the same junctions
  const junctionHotspots = Object.entries(
    trips.reduce((acc: Record<string, number>, t) => {
      const tripClearances = clearances.filter(c => c.trip_id === t.id && c.status !== 'CLEARED');
      tripClearances.forEach(tc => {
        acc[tc.junction_id] = (acc[tc.junction_id] || 0) + 1;
      });
      return acc;
    }, {})
  ).map(([junctionId, count]) => {
    const assignedOfficers = clearances
      .filter(c => c.junction_id === junctionId && c.status !== 'CLEARED')
      .map(c => {
        const p = policeProfiles.find(prof => prof.id === c.police_unit_id);
        return p?.unit_id || 'P-UNK';
      });

    return {
      junctionId,
      unitCount: count,
      assignedUnits: Array.from(new Set(assignedOfficers)),
      isCritical: count >= 2
    };
  }).filter(h => h.unitCount > 0);

  // 3. Stale & Escalated Clearances for the Monitor
  const escalations = joinedClearances.filter(c => c.status === 'ESCALATED' || c.isStale);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left 65% - Live Corridor Grid */}
      <div className="flex-[65] bg-surface-primary border-r border-border-glow p-6 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[14px] font-bold tracking-widest uppercase flex items-center gap-3">
            <Shield size={18} className="text-accent-amber animate-pulse" />
            Live Corridor Clearances
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFilterClearedOnly(!isFilterClearedOnly)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 outline-none",
                isFilterClearedOnly 
                  ? "bg-accent-amber/10 border-accent-amber text-accent-amber" 
                  : "border-border-glow bg-void-black text-text-muted hover:text-accent-amber"
              )}
            >
              <Filter size={14} /> {isFilterClearedOnly ? "ACTIVE ONLY" : "SHOW ALL"}
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-glow text-[10px] text-text-muted uppercase tracking-widest">
              <th className="pb-3 font-medium">Trip Ref</th>
              <th className="pb-3 font-medium">Severity</th>
              <th className="pb-3 font-medium">Target Junction</th>
              <th className="pb-3 font-medium">Police Unit</th>
              <th className="pb-3 font-medium">Junction Status</th>
              <th className="pb-3 font-medium">Corridor ETA</th>
              <th className="pb-3 font-medium">Last Ping</th>
            </tr>
          </thead>
          <tbody>
            {joinedClearances.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-text-muted uppercase font-bold tracking-widest">
                  No active traffic corridors assigned
                </td>
              </tr>
            ) : (
              joinedClearances.map((c) => (
                <tr key={c.id} className="border-b border-border-glow/50 hover:bg-surface-elevated transition-colors cursor-pointer group relative">
                  <td className="py-4 text-xs font-mono font-bold group-hover:text-accent-amber">{c.tripId}</td>
                  <td className="py-4">
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded font-bold uppercase border",
                      c.severity === 'CRITICAL' ? "bg-accent-crimson/20 text-accent-crimson border-accent-crimson/30" :
                      c.severity === 'HIGH' ? "bg-accent-amber/20 text-accent-amber border-accent-amber/30" :
                      "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30"
                    )}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="py-4 text-xs font-mono font-bold text-text-secondary">{c.junctionId}</td>
                  <td className="py-4 text-xs font-bold text-accent-cyan relative">
                    {reassigningClearanceId === c.id ? (
                      <div className="absolute left-0 top-1.5 bg-surface-elevated border border-border-glow rounded-xl p-2 z-50 shadow-2xl flex flex-col gap-1 w-44 animate-in fade-in zoom-in-95 duration-150">
                        <p className="text-[9px] text-text-muted font-bold uppercase mb-1">Reassign officer:</p>
                        {policeProfiles.filter(p => p.is_online && p.unit_id !== c.policeUnit).map(p => (
                          <button
                            key={p.id}
                            onClick={(e) => { e.stopPropagation(); handleReassignOfficer(c.id, p.id); }}
                            className="text-left px-2 py-1 text-[10px] text-text-primary rounded hover:bg-accent-amber hover:text-void-black font-bold uppercase"
                          >
                            {p.unit_id} ({p.profiles?.full_name || 'Officer'})
                          </button>
                        ))}
                        {policeProfiles.filter(p => p.is_online && p.unit_id !== c.policeUnit).length === 0 && (
                          <p className="text-[9px] text-accent-crimson italic p-1">No available units</p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setReassigningClearanceId(null); }}
                          className="text-center text-[9px] text-text-muted hover:text-text-primary mt-1 border-t border-border-glow pt-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                    <button
                      onClick={(e) => { e.stopPropagation(); setReassigningClearanceId(c.id); }}
                      className="hover:underline flex items-center gap-1.5 uppercase outline-none"
                    >
                      {c.policeUnit} <RotateCcw size={11} className="text-text-muted group-hover:text-accent-amber transition-colors" />
                    </button>
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5",
                      c.status === 'CLEARED' ? "text-green-500" :
                      c.status === 'ACKNOWLEDGED' ? "text-accent-cyan animate-pulse" :
                      c.status === 'STALE ALERT' ? "text-accent-amber font-extrabold animate-bounce" :
                      c.status === 'ESCALATED' ? "text-accent-crimson font-extrabold animate-pulse" :
                      "text-accent-amber"
                    )}>
                      {c.status === 'STALE ALERT' && "⚠️ "}
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 text-xs font-mono font-bold text-text-primary">{c.estClearance}</td>
                  <td className="py-4 text-[10px] text-text-muted font-mono">{c.lastUpdate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Right 35% - Conflict Corridor Hotspots & Escalation Monitor */}
      <div className="flex-[35] flex flex-col bg-surface-elevated overflow-y-auto custom-scrollbar">
        
        {/* Hotspots Panel */}
        <div className="p-6 border-b border-border-glow shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-text-primary">
              <Navigation size={14} className="text-accent-amber" /> Corridor Hotspots
            </h3>
            {junctionHotspots.filter(h => h.isCritical).length > 0 && (
              <span className="px-2 py-0.5 bg-accent-crimson/20 text-accent-crimson text-[9px] font-bold rounded animate-pulse">
                {junctionHotspots.filter(h => h.isCritical).length} DETECTED
              </span>
            )}
          </div>

          <div className="space-y-4">
            {junctionHotspots.map(h => (
              <div 
                key={h.junctionId} 
                className={cn(
                  "p-4 bg-void-black border rounded-xl transition-all",
                  h.isCritical ? "border-accent-crimson/40 bg-accent-crimson/5" : "border-border-glow"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono font-bold text-lg text-text-primary leading-none">{h.junctionId}</p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase font-bold tracking-wider">Tactical Corridor Junction</p>
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold uppercase px-2 py-1 rounded",
                    h.isCritical ? "bg-accent-crimson/25 text-accent-crimson shadow-glow-crimson animate-pulse" : "bg-accent-amber/20 text-accent-amber"
                  )}>
                    {h.isCritical ? "CONFLICT MONITOR" : "ACTIVE ROUTE"}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs mb-3 font-mono">
                  <span className="text-text-secondary">En-Route: <strong className="text-accent-cyan">{h.unitCount} AMB</strong></span>
                  <span className="text-text-secondary">Assigned: <strong className="text-accent-amber">{h.assignedUnits.length} POLICE</strong></span>
                </div>

                <div className="h-1.5 w-full bg-void-black rounded-full overflow-hidden border border-border-glow/50">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      h.isCritical ? "bg-gradient-to-r from-accent-amber to-accent-crimson w-[90%]" : "bg-accent-cyan w-[45%]"
                    )} 
                  />
                </div>
              </div>
            ))}

            {junctionHotspots.length === 0 && (
              <p className="text-[11px] text-text-muted text-center py-6 uppercase font-bold tracking-wider">
                No active corridor bottlenecks
              </p>
            )}
          </div>
        </div>

        {/* Escalation Monitor */}
        <div className="p-6 flex-1 bg-surface-primary flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-accent-crimson shrink-0">
            <AlertTriangle size={14} className="animate-pulse" /> Escalation Monitor
          </h3>

          <div className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pb-4">
            {escalations.map(esc => (
              <div 
                key={esc.id} 
                className={cn(
                  "p-4 border rounded-xl animate-in slide-in-from-right-3 duration-250",
                  esc.status === 'ESCALATED' 
                    ? "border-accent-crimson/50 bg-accent-crimson/5" 
                    : "border-accent-amber/50 bg-accent-amber/5"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-bold text-sm text-text-primary">{esc.junctionId}</span>
                  <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
                    <Clock size={10} /> {esc.lastUpdate}
                  </span>
                </div>
                
                <p className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wide">
                  {esc.status === 'ESCALATED' ? "🚨 Officer Triggered Escalation" : "⚠️ Telemetry ACK Overdue"}
                </p>
                
                <p className="text-xs text-text-muted mb-4 leading-relaxed">
                  {esc.status === 'ESCALATED' 
                    ? `Officer ${esc.policeUnit} reports heavy intersection blocks or road accidents. Alternates suggested.`
                    : `Officer ${esc.policeUnit} has neglected assignment dispatch details for over 3 minutes. Reassign immediately!`
                  }
                </p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDismissEscalation(esc.id)}
                    className="flex-1 py-2 bg-surface-elevated border border-border-glow hover:border-text-secondary text-text-primary text-[10px] font-bold uppercase rounded-lg transition-colors outline-none"
                  >
                    DISMISS
                  </button>
                  <button 
                    onClick={() => setReassigningClearanceId(esc.id)}
                    className="flex-1 py-2 bg-accent-crimson hover:bg-accent-crimson/80 text-void-black text-[10px] font-extrabold uppercase rounded-lg shadow-glow-crimson transition-all outline-none"
                  >
                    REASSIGN
                  </button>
                  <button 
                    onClick={() => handleRequestBackup(esc.junctionId, esc.tripDbId)}
                    className="py-2 px-2.5 bg-surface-elevated border border-border-glow hover:text-accent-cyan text-text-muted hover:border-accent-cyan text-[10px] font-bold uppercase rounded-lg transition-colors outline-none flex items-center justify-center gap-1.5"
                    title="Dispatch backup units"
                  >
                    <UserPlus size={12} /> BACKUP
                  </button>
                </div>
              </div>
            ))}

            {escalations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40 flex-1">
                <Shield size={36} className="text-text-muted stroke-[1] mb-2" />
                <p className="text-[11px] text-text-muted uppercase font-bold tracking-widest font-mono">
                  Clearance Grid Stable
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
