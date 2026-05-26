import React from 'react';
import { Filter, Download, AlertTriangle, CheckCircle2, Navigation, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { MOCK_TRIPS } from '../../lib/mockControlData';
import { cn } from '../../lib/utils';

export const LiveOperations = () => {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Left 70% - Table & Map */}
      <div className="flex-[7] flex flex-col border-r border-border-glow">
        {/* Table Section */}
        <div className="flex-1 bg-surface-primary p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[14px] font-bold tracking-widest uppercase flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-cyan"></span>
              </span>
              Live Mesh Active: {MOCK_TRIPS.length} Units
            </h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-border-glow bg-void-black text-xs font-bold text-text-muted hover:text-accent-cyan flex items-center gap-2">
                <Filter size={14} /> FILTER
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-border-glow bg-void-black text-xs font-bold text-text-muted hover:text-accent-cyan flex items-center gap-2">
                <Download size={14} /> EXPORT
              </button>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-glow text-[10px] text-text-muted uppercase tracking-widest">
                <th className="pb-3 font-medium">Trip ID</th>
                <th className="pb-3 font-medium">Unit</th>
                <th className="pb-3 font-medium">Severity</th>
                <th className="pb-3 font-medium">Verification</th>
                <th className="pb-3 font-medium">Police Clearance</th>
                <th className="pb-3 font-medium">Priority Score</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRIPS.map(trip => (
                <tr key={trip.id} className="border-b border-border-glow/50 hover:bg-surface-elevated transition-colors cursor-pointer group">
                  <td className="py-4 text-xs font-mono font-bold group-hover:text-accent-cyan">{trip.id}</td>
                  <td className="py-4 text-xs font-bold text-text-secondary">{trip.unitId}</td>
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
                  <td className="py-4">
                    {trip.verification === 'verified' && <CheckCircle2 size={16} className="text-green-500" />}
                    {trip.verification === 'pending' && <AlertTriangle size={16} className="text-accent-amber animate-pulse" />}
                    {trip.verification === 'flagged' && <ShieldAlert size={16} className="text-accent-crimson" />}
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      trip.policeStatus === 'CLEARED' ? "text-green-500" :
                      trip.policeStatus === 'ACK' ? "text-accent-cyan" :
                      trip.policeStatus === 'SENT' ? "text-accent-amber" : "text-text-muted"
                    )}>
                      {trip.policeStatus}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-void-black rounded-full overflow-hidden">
                        <div 
                          className="h-full" 
                          style={{ 
                            width: `${trip.priorityScore}%`,
                            background: trip.priorityScore > 90 ? '#ff2a5f' : trip.priorityScore > 70 ? '#ffb020' : '#22d3ee'
                          }} 
                        />
                      </div>
                      <span className="text-xs font-mono">{trip.priorityScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tactical Map Placeholder */}
        <div className="h-[40%] bg-void-black border-t border-border-glow relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <MapIcon size={120} strokeWidth={0.5} className="text-accent-cyan opacity-20" />
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="px-3 py-1.5 bg-surface-elevated/80 backdrop-blur rounded border border-border-glow text-[10px] font-bold text-accent-cyan uppercase">Ambulance Nodes: 14</div>
            <div className="px-3 py-1.5 bg-surface-elevated/80 backdrop-blur rounded border border-border-glow text-[10px] font-bold text-accent-amber uppercase">Police Nodes: 8</div>
          </div>
        </div>
      </div>

      {/* Right 30% - Panels */}
      <div className="flex-[3] flex flex-col bg-surface-primary overflow-y-auto">
        {/* Conflict Monitor */}
        <div className="p-6 border-b border-border-glow">
          <div className="flex items-center gap-2 mb-4 text-accent-crimson">
            <AlertTriangle size={18} className="animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Junction 105 Conflict</h3>
          </div>
          
          <div className="p-4 bg-accent-crimson/10 border border-accent-crimson/30 rounded-xl mb-4">
            <p className="text-[11px] text-accent-crimson font-bold uppercase tracking-widest mb-1">AI Recommendation</p>
            <p className="text-sm font-bold">Grant priority to AMB-204 (Score: 94)</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-surface-elevated border border-accent-cyan rounded-lg flex justify-between items-center">
              <div>
                <p className="font-mono font-bold">AMB-204</p>
                <p className="text-[10px] text-text-muted">Score: 94 • Police: CLEARED</p>
              </div>
              <button className="text-[10px] font-bold px-3 py-1.5 bg-accent-cyan text-void-black rounded hover:bg-accent-cyan/90">PRIORITIZE</button>
            </div>
            <div className="p-3 bg-surface-elevated border border-border-glow rounded-lg flex justify-between items-center opacity-70">
              <div>
                <p className="font-mono font-bold text-text-muted">AMB-105</p>
                <p className="text-[10px] text-text-muted">Score: 76 • Police: ACK</p>
              </div>
              <button className="text-[10px] font-bold px-3 py-1.5 border border-border-glow text-text-muted rounded hover:text-text-primary">HOLD</button>
            </div>
          </div>
        </div>

        {/* Flagged Cases */}
        <div className="p-6 flex-1">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldAlert size={14} className="text-text-muted" /> Flagged Cases
          </h3>
          <div className="p-4 bg-void-black border border-border-glow rounded-xl hover:border-accent-crimson/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono font-bold text-accent-crimson">AMB-402</span>
              <span className="text-[10px] text-text-muted">14:10:00</span>
            </div>
            <p className="text-sm font-bold text-text-primary mb-1">ETA Anomaly Detected</p>
            <p className="text-xs text-text-muted mb-3">Unit stopped for &gt;4 mins outside hospital zone.</p>
            <button className="w-full py-2 bg-surface-elevated border border-border-glow text-xs font-bold rounded hover:bg-accent-crimson/20 hover:text-accent-crimson hover:border-accent-crimson/50 transition-colors">
              REVIEW CASE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
