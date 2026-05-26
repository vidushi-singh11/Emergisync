import React from 'react';
import { Filter, Download, Activity, ShieldAlert, AlertOctagon, PhoneCall, Bed } from 'lucide-react';
import { MOCK_TRIPS, MOCK_HOSPITALS } from '../../lib/mockControlData';
import { cn } from '../../lib/utils';

export const HospitalCoordination = () => {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left 60% - Incoming Arrivals */}
      <div className="flex-[60] bg-surface-primary border-r border-border-glow p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[14px] font-bold tracking-widest uppercase flex items-center gap-3">
            <Activity size={18} className="text-accent-crimson" />
            Incoming Arrivals
          </h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border-glow bg-void-black text-xs font-bold text-text-muted hover:text-accent-crimson flex items-center gap-2">
              <Filter size={14} /> FILTER
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-border-glow bg-void-black text-xs font-bold text-text-muted hover:text-accent-crimson flex items-center gap-2">
              <Download size={14} /> EXPORT
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-glow text-[10px] text-text-muted uppercase tracking-widest">
              <th className="pb-3 font-medium">Trip / Unit</th>
              <th className="pb-3 font-medium">Hospital Dest</th>
              <th className="pb-3 font-medium">Severity</th>
              <th className="pb-3 font-medium">ETA</th>
              <th className="pb-3 font-medium">ER Status</th>
              <th className="pb-3 font-medium">ACK Time</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRIPS.map((trip) => (
              <tr key={trip.id} className="border-b border-border-glow/50 hover:bg-surface-elevated transition-colors cursor-pointer group">
                <td className="py-4">
                  <div className="font-mono font-bold text-xs group-hover:text-accent-crimson">{trip.id}</div>
                  <div className="text-[10px] text-text-muted font-bold">{trip.unitId}</div>
                </td>
                <td className="py-4 text-xs font-bold text-accent-cyan hover:underline">{trip.hospital}</td>
                <td className="py-4">
                  <span className={cn(
                    "text-[9px] px-2 py-1 rounded font-bold uppercase",
                    trip.severity.includes('L1') ? "bg-accent-crimson/20 text-accent-crimson" :
                    trip.severity.includes('L2') ? "bg-accent-amber/20 text-accent-amber" :
                    "bg-accent-cyan/20 text-accent-cyan"
                  )}>
                    {trip.severity}
                  </span>
                </td>
                <td className="py-4 text-xs font-mono">
                  <span className={cn(
                    "px-2 py-1 rounded",
                    trip.eta.startsWith('2m') ? "bg-accent-crimson/20 text-accent-crimson font-bold animate-pulse" : ""
                  )}>
                    {trip.eta}
                  </span>
                </td>
                <td className="py-4">
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    trip.erStatus === 'READY' ? "text-green-500" :
                    trip.erStatus === 'PREPARING' ? "text-accent-amber animate-pulse" :
                    "text-accent-cyan"
                  )}>
                    {trip.erStatus}
                  </span>
                </td>
                <td className="py-4 text-[10px] text-text-muted font-mono">{trip.ackTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right 40% - Facility Monitoring & Escalation */}
      <div className="flex-[40] flex flex-col bg-surface-elevated overflow-y-auto">
        {/* Facility Monitoring */}
        <div className="p-6 border-b border-border-glow flex-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Bed size={14} className="text-accent-cyan" /> Priority Facilities
            </h3>
            <span className="text-[10px] text-text-muted">SHOWING 3 OF 5</span>
          </div>

          <div className="space-y-4">
            {MOCK_HOSPITALS.map((hosp) => (
              <div key={hosp.id} className={cn(
                "p-4 rounded-xl border transition-all",
                hosp.diversion ? "bg-accent-crimson/5 border-accent-crimson/50" : "bg-void-black border-border-glow hover:border-accent-cyan/50"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-sm text-text-primary mb-1">{hosp.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-elevated border border-border-glow text-text-muted">{hosp.traumaLevel}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                        hosp.loadStatus === 'CRITICAL' ? "bg-accent-crimson/20 text-accent-crimson" :
                        hosp.loadStatus === 'HIGH LOAD' ? "bg-accent-amber/20 text-accent-amber" :
                        "bg-accent-cyan/20 text-accent-cyan"
                      )}>{hosp.loadStatus}</span>
                    </div>
                  </div>
                  {hosp.diversion && (
                    <span className="text-[10px] font-bold px-2 py-1 bg-accent-crimson text-void-black rounded uppercase animate-pulse">DIVERSION ON</span>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  {/* Mock Circular Gauge */}
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-[#2a2a3a]" />
                      <circle 
                        cx="24" cy="24" r="20" 
                        stroke={hosp.utilization > 90 ? '#ff2a5f' : hosp.utilization > 75 ? '#ffb020' : '#22d3ee'} 
                        strokeWidth="4" fill="transparent" 
                        strokeDasharray={125.6} strokeDashoffset={125.6 - (hosp.utilization / 100) * 125.6}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold font-mono">{hosp.utilization}%</span>
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase mb-1">ER BEDS</p>
                      <p className={cn("text-xs font-mono font-bold", hosp.erBeds.used / hosp.erBeds.total > 0.9 ? "text-accent-crimson" : "text-text-primary")}>
                        {hosp.erBeds.used} / {hosp.erBeds.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase mb-1">ICU BEDS</p>
                      <p className={cn("text-xs font-mono font-bold", hosp.icuBeds.used / hosp.icuBeds.total > 0.9 ? "text-accent-crimson" : "text-text-primary")}>
                        {hosp.icuBeds.used} / {hosp.icuBeds.total}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Escalation Monitor */}
        <div className="p-6 bg-accent-crimson/5 border-t border-accent-crimson/20">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-accent-crimson">
            <ShieldAlert size={14} /> 1 Critical Alert Active
          </h3>
          <div className="p-4 bg-void-black border border-accent-crimson/50 rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono font-bold text-accent-crimson">TRP-1042</span>
              <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-accent-crimson/20 text-accent-crimson rounded">CRITICAL L1</span>
            </div>
            <p className="text-[11px] font-bold text-text-primary mb-1">ETA {"<"}3m & ER Readiness Not Confirmed</p>
            <p className="text-[10px] text-text-muted mb-4">Destination: Metro General Central</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-accent-crimson hover:bg-accent-crimson/80 text-void-black text-[10px] font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2">
                <PhoneCall size={12} /> ESCALATE
              </button>
              <button className="flex-1 py-2 bg-surface-elevated border border-border-glow text-text-primary text-[10px] font-bold uppercase tracking-widest rounded transition-colors hover:text-accent-cyan hover:border-accent-cyan">
                RESOLVE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
