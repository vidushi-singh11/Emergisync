import React from 'react';
import { Shield, Power, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TopBarProps {
  unitId: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  activeAlerts: number;
}

export const TopBar: React.FC<TopBarProps> = ({ unitId, isOnline, onToggleOnline, activeAlerts }) => {
  return (
    <div className="h-16 border-b border-border-glow bg-surface-primary flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center text-accent-amber border border-accent-amber/20">
            <Shield size={18} />
          </div>
          <span className="font-bold tracking-tight text-text-primary uppercase">UNIT {unitId}</span>
        </div>

        <div className="h-4 w-[1px] bg-border-glow" />

        <button 
          onClick={onToggleOnline}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border",
            isOnline 
              ? "bg-accent-amber/10 border-accent-amber text-accent-amber shadow-glow-amber" 
              : "bg-surface-elevated border-border-glow text-text-muted hover:text-text-primary"
          )}
        >
          <Power size={14} />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {isOnline ? "Patrol Online" : "Patrol Offline"}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {activeAlerts > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-crimson/10 border border-accent-crimson/30 text-accent-crimson animate-pulse">
            <AlertTriangle size={14} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{activeAlerts} Active Clearances</span>
          </div>
        )}
      </div>
    </div>
  );
};
