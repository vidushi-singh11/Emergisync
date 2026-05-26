import React, { useState } from 'react';
import { User, Activity, MapPin, Clock, ShieldAlert, AlertOctagon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { HospitalInfo } from '../../types/models';

interface StatusBarProps {
  isOnline: boolean;
  hospitals: HospitalInfo[];
  onManualDispatch: (data: {
    patientName: string;
    priority: string;
    hospitalId: string;
    condition: string;
  }) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isOnline, hospitals, onManualDispatch }) => {
  const [patientName, setPatientName] = useState('');
  const [priority, setPriority] = useState('MODERATE_L3');
  const [condition, setCondition] = useState('');

  const handleSelectHospital = (h: HospitalInfo) => {
    if (h.isDiversion) return;
    
    // Dispatch immediately with filled-in parameter states
    onManualDispatch({
      patientName: patientName.trim() || 'Unknown Patient',
      priority: priority,
      hospitalId: h.id,
      condition: condition.trim() || 'Medical Emergency'
    });

    // Reset inputs for next run after successful dispatch
    setPatientName('');
    setCondition('');
    setPriority('MODERATE_L3');
  };

  const getPriorityBorderClass = (lvl: string) => {
    switch (lvl) {
      case 'CRITICAL_L1': return 'border-accent-crimson/50 focus:border-accent-crimson text-accent-crimson';
      case 'SEVERE_L2': return 'border-accent-amber/50 focus:border-accent-amber text-accent-amber';
      case 'MODERATE_L3': return 'border-accent-cyan/50 focus:border-accent-cyan text-accent-cyan';
      default: return 'border-border-glow focus:border-text-secondary text-text-primary';
    }
  };

  return (
    <div className={cn(
      "bg-surface-elevated border-b border-border-glow transition-all duration-500 relative z-20",
      !isOnline && "opacity-50 pointer-events-none grayscale"
    )}>
      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-glow">
        
        {/* Left Side: Dispatch Parameters Input Pane */}
        <div className="p-4 lg:w-[480px] shrink-0 bg-void-black/30 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-accent-cyan animate-pulse" />
            <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest font-mono">
              Patient Dispatch Parameters
            </span>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {/* Patient Name Input */}
              <div className="relative flex-1">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Patient Name (e.g. John Doe)" 
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="w-full bg-void-black border border-border-glow rounded-lg pl-9 pr-3 py-2 text-xs focus:border-accent-cyan outline-none text-text-primary placeholder:text-text-muted transition-all"
                />
              </div>

              {/* Priority Severity Dropdown */}
              <select 
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={cn(
                  "bg-void-black border rounded-lg px-3 py-2 text-xs outline-none w-40 font-bold font-mono transition-all",
                  getPriorityBorderClass(priority)
                )}
              >
                <option value="CRITICAL_L1" className="text-accent-crimson font-mono bg-void-black">L1 - Critical</option>
                <option value="SEVERE_L2" className="text-accent-amber font-mono bg-void-black">L2 - Severe</option>
                <option value="MODERATE_L3" className="text-accent-cyan font-mono bg-void-black">L3 - Moderate</option>
                <option value="MINOR_L4" className="text-text-secondary font-mono bg-void-black">L4 - Minor</option>
              </select>
            </div>

            {/* Condition Input */}
            <input 
              type="text"
              placeholder="Initial Condition Details (e.g. Trauma, Chest Pain...)" 
              value={condition}
              onChange={e => setCondition(e.target.value)}
              className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs focus:border-accent-cyan outline-none text-text-primary placeholder:text-text-muted transition-all"
            />
          </div>
        </div>

        {/* Right Side: Hospital Live Stream Selector */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col justify-center min-w-0 bg-void-black/10">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono">
              Live Facility Mesh — Tap Card to Initiate Transfer
            </span>
            {isOnline && (
              <span className="text-[9px] font-mono text-accent-cyan animate-pulse tracking-wider">
                ● ACTIVE ROUTING MESH
              </span>
            )}
          </div>

          {/* Horizontal Hospital Grid */}
          <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar scroll-smooth">
            {hospitals.map(h => {
              const erUtilization = h.erTotal > 0 ? (h.erAvailable / h.erTotal) : 1;
              const isCriticallyFull = erUtilization < 0.1;
              
              return (
                <button
                  key={h.id}
                  onClick={() => handleSelectHospital(h)}
                  disabled={h.isDiversion}
                  className={cn(
                    "flex-shrink-0 w-[290px] p-3 rounded-xl border transition-all text-left group relative overflow-hidden flex flex-col justify-between",
                    h.isDiversion 
                      ? "bg-surface-primary border-border-glow opacity-50 cursor-not-allowed" 
                      : "bg-void-black border-border-glow hover:border-accent-cyan hover:shadow-glow-cyan hover:-translate-y-0.5"
                  )}
                >
                  {h.isDiversion && (
                    <div className="absolute inset-0 bg-accent-crimson/5 pointer-events-none" />
                  )}
                  
                  <div className="w-full">
                    {/* Facility Name & Trauma Badge */}
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] font-bold text-text-primary block truncate group-hover:text-accent-cyan transition-colors">
                          {h.name}
                        </span>
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block mt-0.5">
                          L{h.traumaLevel} Trauma Center
                        </span>
                      </div>
                      
                      {h.isDiversion ? (
                        <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-crimson/25 text-accent-crimson border border-accent-crimson/40">
                          <AlertOctagon size={10} /> DIVERSION
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 font-mono">
                          {h.eta || '0m'}
                        </span>
                      )}
                    </div>

                    {/* Distance & ETA */}
                    {!h.isDiversion && (
                      <div className="flex items-center gap-2.5 text-[10px] text-text-secondary font-mono mb-3 bg-surface-primary/80 px-2 py-0.5 rounded border border-border-glow/50 w-max">
                        <span className="flex items-center gap-1"><MapPin size={9} className="text-text-muted" /> {h.distance || '0km'}</span>
                        <span className="flex items-center gap-1 text-accent-cyan"><Clock size={9} /> {h.eta || '0m'}</span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic Capacity Stat Boxes */}
                  <div className="flex gap-2 w-full mt-auto">
                    <div className={cn(
                      "flex-1 p-1.5 rounded-lg border text-center transition-all",
                      isCriticallyFull && !h.isDiversion 
                        ? "bg-accent-crimson/15 border-accent-crimson/40" 
                        : "bg-surface-primary border-border-glow"
                    )}>
                      <p className="text-[8px] font-bold text-text-muted uppercase mb-0.5">ER Beds</p>
                      <p className={cn(
                        "text-[11px] font-bold font-mono",
                        isCriticallyFull && !h.isDiversion ? "text-accent-crimson" : "text-text-primary"
                      )}>
                        {h.erAvailable} <span className="text-[9px] text-text-muted">/ {h.erTotal}</span>
                      </p>
                    </div>
                    
                    <div className="flex-1 p-1.5 rounded-lg bg-surface-primary border border-border-glow text-center">
                      <p className="text-[8px] font-bold text-text-muted uppercase mb-0.5">ICU Beds</p>
                      <p className="text-[11px] font-bold font-mono text-text-primary">
                        {h.icuAvailable} <span className="text-[9px] text-text-muted">/ {h.icuTotal}</span>
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
