import React from 'react';
import { Filter, Download, Navigation, AlertTriangle, Shield, Clock } from 'lucide-react';
import { MOCK_POLICE_CLEARANCES } from '../../lib/mockControlData';
import { cn } from '../../lib/utils';

export const PoliceCoordination = () => {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left 65% - Overview Table */}
      <div className="flex-[65] bg-surface-primary border-r border-border-glow p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[14px] font-bold tracking-widest uppercase flex items-center gap-3">
            <Shield size={18} className="text-accent-amber" />
            Corridor Clearances
          </h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border-glow bg-void-black text-xs font-bold text-text-muted hover:text-accent-amber flex items-center gap-2">
              <Filter size={14} /> FILTER
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-border-glow bg-void-black text-xs font-bold text-text-muted hover:text-accent-amber flex items-center gap-2">
              <Download size={14} /> EXPORT
            </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-glow text-[10px] text-text-muted uppercase tracking-widest">
              <th className="pb-3 font-medium">Trip ID</th>
              <th className="pb-3 font-medium">Severity</th>
              <th className="pb-3 font-medium">Junction</th>
              <th className="pb-3 font-medium">Police Unit</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Est. Clearance</th>
              <th className="pb-3 font-medium">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_POLICE_CLEARANCES.map((c, i) => (
              <tr key={i} className="border-b border-border-glow/50 hover:bg-surface-elevated transition-colors cursor-pointer group">
                <td className="py-4 text-xs font-mono font-bold group-hover:text-accent-amber">{c.tripId}</td>
                <td className="py-4">
                  <span className={cn(
                    "text-[9px] px-2 py-1 rounded font-bold uppercase",
                    c.severity === 'CRITICAL' ? "bg-accent-crimson/20 text-accent-crimson" :
                    c.severity === 'HIGH' ? "bg-accent-amber/20 text-accent-amber" :
                    "bg-accent-cyan/20 text-accent-cyan"
                  )}>
                    {c.severity}
                  </span>
                </td>
                <td className="py-4 text-xs font-mono font-bold text-text-secondary">{c.junctionId}</td>
                <td className="py-4 text-xs font-bold text-accent-cyan hover:underline">{c.policeUnit}</td>
                <td className="py-4">
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    c.status === 'CLEARED' ? "text-green-500" :
                    c.status === 'ACKNOWLEDGED' ? "text-accent-cyan" :
                    "text-accent-amber"
                  )}>
                    {c.status}
                  </span>
                </td>
                <td className="py-4 text-xs font-mono">
                  <span className={cn(
                    "px-2 py-1 rounded",
                    c.estClearance.startsWith('-') ? "bg-accent-crimson/20 text-accent-crimson font-bold animate-pulse" : ""
                  )}>
                    {c.estClearance}
                  </span>
                </td>
                <td className="py-4 text-[10px] text-text-muted font-mono">{c.lastUpdate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right 35% - Hotspots & Escalation */}
      <div className="flex-[35] flex flex-col bg-surface-elevated overflow-y-auto">
        {/* Hotspots */}
        <div className="p-6 border-b border-border-glow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Navigation size={14} className="text-accent-amber" /> Tactical Hotspots
            </h3>
            <span className="px-2 py-0.5 bg-accent-amber/20 text-accent-amber text-[9px] font-bold rounded">1 ACTIVE</span>
          </div>

          <div className="p-4 bg-void-black border border-accent-amber/30 rounded-xl cursor-pointer hover:border-accent-amber transition-all">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-mono font-bold text-lg text-text-primary leading-none">JN-210</p>
                <p className="text-[10px] text-text-muted">Downtown / 5th Ave</p>
              </div>
              <span className="text-[9px] font-bold uppercase px-2 py-1 bg-accent-crimson/20 text-accent-crimson rounded">CRITICAL</span>
            </div>
            
            <div className="flex justify-between text-xs mb-3">
              <span className="text-text-secondary">Approaching: <strong className="text-accent-cyan">3 AMB</strong></span>
              <span className="text-text-secondary">Assigned: <strong className="text-accent-amber">1 POLICE</strong></span>
            </div>

            <div className="h-1.5 w-full bg-void-black rounded-full overflow-hidden border border-border-glow">
              <div className="h-full w-[85%] bg-gradient-to-r from-accent-amber to-accent-crimson" />
            </div>
          </div>
        </div>

        {/* Escalation Monitor */}
        <div className="p-6 flex-1 bg-surface-primary">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-accent-crimson">
            <AlertTriangle size={14} /> Escalation Monitor
          </h3>

          <div className="p-4 border border-accent-crimson/50 bg-accent-crimson/5 rounded-xl">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono font-bold text-accent-crimson">JN-210</span>
              <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock size={10} /> {MOCK_POLICE_CLEARANCES[2].lastUpdate}</span>
            </div>
            <p className="text-sm font-bold text-text-primary mb-1">ETA Exceeded</p>
            <p className="text-xs text-text-muted mb-4">Unit P-304 crossed estimated clearance time by 2m 15s. Traffic heavily congested.</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-accent-crimson hover:bg-accent-crimson/80 text-void-black text-xs font-bold rounded transition-colors">
                ESCALATE
              </button>
              <button className="flex-1 py-2 bg-surface-elevated border border-border-glow text-text-primary text-xs font-bold rounded transition-colors hover:text-accent-cyan">
                REASSIGN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
