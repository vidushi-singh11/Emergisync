import React from 'react';
import { Activity, ShieldAlert, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TopBarProps {
  hospitalName: string;
  traumaLevel: string;
  loadStatus: 'Normal' | 'High' | 'Critical';
  staffCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({ hospitalName, traumaLevel, loadStatus, staffCount }) => {
  return (
    <div className="h-16 border-b border-border-glow bg-surface-primary flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-crimson/10 flex items-center justify-center text-accent-crimson border border-accent-crimson/20">
            <Activity size={18} />
          </div>
          <span className="font-bold tracking-tight text-text-primary uppercase">{hospitalName}</span>
        </div>

        <div className="h-4 w-[1px] bg-border-glow" />

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-void-black border border-border-glow">
          <ShieldAlert size={14} className="text-accent-amber" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-primary">
            Trauma Level {traumaLevel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-text-muted" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">Active Staff</p>
            <p className="text-[13px] font-mono text-text-primary leading-none mt-1">{staffCount}</p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border-glow" />

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Load:</span>
          <span className={cn(
            "text-[12px] font-bold uppercase tracking-wider px-3 py-1 rounded",
            loadStatus === 'Normal' ? "bg-accent-cyan/10 text-accent-cyan" :
            loadStatus === 'High' ? "bg-accent-amber/10 text-accent-amber" :
            "bg-accent-crimson/10 text-accent-crimson animate-pulse"
          )}>
            {loadStatus}
          </span>
        </div>
      </div>
    </div>
  );
};
