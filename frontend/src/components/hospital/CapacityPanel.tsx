import React, { useState, useEffect } from 'react';
import { Bed, Users, AlertOctagon, TrendingUp, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface CapacityPanelProps {
  erBeds: { total: number; used: number };
  icuBeds: { total: number; used: number };
  isDiversion: boolean;
  onToggleDiversion: () => void;
  onUpdateBeds: (type: 'er' | 'icu', action: 'inc' | 'dec') => void;
  lastUpdated: Date | null;
}

export const CapacityPanel: React.FC<CapacityPanelProps> = ({ 
  erBeds, icuBeds, isDiversion, onToggleDiversion, onUpdateBeds, lastUpdated
}) => {
  const erUtilization = Math.round((erBeds.used / erBeds.total) * 100) || 0;
  const icuUtilization = Math.round((icuBeds.used / icuBeds.total) * 100) || 0;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000); // refresh every 10s to keep stale state live
    return () => clearInterval(timer);
  }, []);

  const isStale = lastUpdated ? (now.getTime() - lastUpdated.getTime()) > 30 * 60 * 1000 : false;

  const formatTime = (date: Date | null) => {
    if (!date) return "NEVER";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusColor = (utilization: number) => {
    if (utilization >= 90) return 'text-accent-crimson';
    if (utilization >= 75) return 'text-accent-amber';
    return 'text-accent-cyan';
  };

  const getGaugeColor = (utilization: number) => {
    if (utilization >= 90) return '#ff2a5f';
    if (utilization >= 75) return '#ffb020';
    return '#22d3ee';
  };

  // Simple SVG Gauge
  const Gauge = ({ percentage, color }: { percentage: number, color: string }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" strokeWidth="8" fill="transparent" 
            className="text-[#2a2a3a]"
          />
          <circle 
            cx="48" cy="48" r={radius} 
            stroke={color} strokeWidth="8" fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-bold font-mono text-text-primary">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 border-l border-border-glow bg-surface-primary flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-border-glow">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-accent-cyan" /> 
          Live Capacity
        </h2>

        {/* Stale Warning / Last Updated */}
        <div className={cn(
          "flex items-center gap-2 mb-6 px-3 py-2 rounded-lg border transition-all duration-300",
          isStale 
            ? "bg-accent-crimson/10 border-accent-crimson/30 text-accent-crimson shadow-[0_0_10px_rgba(255,42,95,0.05)]" 
            : "bg-void-black border-border-glow text-text-secondary"
        )}>
          <Clock size={13} className={cn(isStale ? "text-accent-crimson animate-pulse" : "text-accent-cyan")} />
          <span className="text-[10px] font-mono tracking-wider font-bold">
            {isStale ? "STALE DATA (30M+ OUTDATED)" : `SYNCED: ${formatTime(lastUpdated)}`}
          </span>
        </div>

        <div className="flex justify-center mb-6">
          <Gauge percentage={erUtilization} color={getGaugeColor(erUtilization)} />
        </div>
        <p className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Overall ER Utilization</p>

        {/* Bed Controls */}
        <div className="space-y-4">
          <div className="bg-void-black border border-border-glow rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-bold text-text-secondary uppercase">ER Beds</span>
              <span className={cn("text-[11px] font-bold font-mono", getStatusColor(erUtilization))}>
                {erBeds.used} / {erBeds.total}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onUpdateBeds('er', 'dec')}
                disabled={erBeds.used <= 0}
                className="flex-1 py-1.5 rounded bg-surface-elevated border border-border-glow text-text-muted hover:text-text-primary hover:border-accent-cyan disabled:opacity-50 transition-colors font-bold font-mono"
              >-</button>
              <button 
                onClick={() => onUpdateBeds('er', 'inc')}
                disabled={erBeds.used >= erBeds.total}
                className="flex-1 py-1.5 rounded bg-surface-elevated border border-border-glow text-text-muted hover:text-text-primary hover:border-accent-cyan disabled:opacity-50 transition-colors font-bold font-mono"
              >+</button>
            </div>
          </div>

          <div className="bg-void-black border border-border-glow rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-bold text-text-secondary uppercase">ICU Beds</span>
              <span className={cn("text-[11px] font-bold font-mono", getStatusColor(icuUtilization))}>
                {icuBeds.used} / {icuBeds.total}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onUpdateBeds('icu', 'dec')}
                disabled={icuBeds.used <= 0}
                className="flex-1 py-1.5 rounded bg-surface-elevated border border-border-glow text-text-muted hover:text-text-primary hover:border-accent-cyan disabled:opacity-50 transition-colors font-bold font-mono"
              >-</button>
              <button 
                onClick={() => onUpdateBeds('icu', 'inc')}
                disabled={icuBeds.used >= icuBeds.total}
                className="flex-1 py-1.5 rounded bg-surface-elevated border border-border-glow text-text-muted hover:text-text-primary hover:border-accent-cyan disabled:opacity-50 transition-colors font-bold font-mono"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Diversion Control */}
      <div className="p-5 mt-auto bg-void-black/30 border-t border-border-glow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[12px] font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon size={14} className={isDiversion ? "text-accent-crimson" : "text-text-muted"} />
              Status Diversion
            </h3>
            <p className="text-[10px] text-text-muted mt-1 leading-tight">
              Blocks new critical inbound dispatches from Control Room.
            </p>
          </div>
        </div>
        
        <button
          onClick={onToggleDiversion}
          className={cn(
            "w-full py-4 rounded-xl font-bold tracking-widest uppercase transition-all duration-300 border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden",
            isDiversion 
              ? "bg-accent-crimson/20 border-accent-crimson text-accent-crimson shadow-glow-crimson" 
              : "bg-surface-elevated border-border-glow text-text-muted hover:border-accent-cyan hover:text-accent-cyan"
          )}
        >
          {isDiversion && <div className="absolute inset-0 bg-accent-crimson/10 animate-pulse pointer-events-none" />}
          <span className="text-[14px] z-10 relative">{isDiversion ? 'DIVERSION ACTIVE' : 'OPEN FOR INTAKE'}</span>
          <span className="text-[9px] z-10 relative opacity-80">{isDiversion ? 'Click to resume normal ops' : 'Click to activate diversion'}</span>
        </button>
      </div>
    </div>
  );
};
