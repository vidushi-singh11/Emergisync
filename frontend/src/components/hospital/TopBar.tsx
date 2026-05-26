import React, { useState } from 'react';
import { Activity, ShieldAlert, Users, User, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface TopBarProps {
  hospitalName: string;
  traumaLevel: string;
  loadStatus: 'Normal' | 'High' | 'Critical';
  staffCount: number;
  onViewProfile: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  hospitalName, traumaLevel, loadStatus, staffCount, onViewProfile 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getTraumaLevelDisplay = (level: string) => {
    if (level === '1') return 'Level I Trauma';
    if (level === '2') return 'Level II Trauma';
    if (level === '3') return 'Level III Trauma';
    return `Level ${level} Trauma`;
  };

  return (
    <div className="h-16 border-b border-border-glow bg-surface-primary flex items-center justify-between px-6 relative z-50">
      
      {/* Left side: branding & facility name */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-crimson/10 flex items-center justify-center text-accent-crimson border border-accent-crimson/20">
            <Activity size={18} />
          </div>
          <span className="font-bold tracking-tight text-text-primary uppercase flex items-center gap-1.5">
            EMERGISYNC <span className="font-bold tracking-tight uppercase flex items-center gap-1.5 text-accent-crimson">{hospitalName}</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-border-glow" />

        {/* Dynamic Trauma Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-void-black border border-border-glow">
          <ShieldAlert size={14} className="text-accent-amber animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-primary">
            {getTraumaLevelDisplay(traumaLevel)}
          </span>
        </div>
      </div>

      {/* Right side: stats & profile */}
      <div className="flex items-center gap-6">
        
        {/* Load Status Indicator */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Load Status:</span>
          <span className={cn(
            "text-[12px] font-bold uppercase tracking-wider px-3 py-1 rounded border transition-all duration-300",
            loadStatus === 'Normal' ? "bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan" :
            loadStatus === 'High' ? "bg-accent-amber/10 border-accent-amber/20 text-accent-amber" :
            "bg-accent-crimson/15 border-accent-crimson/30 text-accent-crimson shadow-glow-crimson animate-pulse"
          )}>
            {loadStatus}
          </span>
        </div>

        <div className="h-6 w-[1px] bg-border-glow" />

        {/* Staff Tracker */}
        <div className="flex items-center gap-2.5">
          <Users size={16} className="text-text-muted" />
          <div className="text-left">
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest leading-none">Staff Online</p>
            <p className="text-[12px] font-mono font-bold text-text-primary mt-1.5 leading-none">{staffCount}</p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border-glow" />

        {/* Profile Circle Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-surface-elevated border border-border-glow flex items-center justify-center text-text-primary hover:border-accent-crimson hover:shadow-glow-crimson/5 transition-all group relative"
          >
            <User size={20} className="group-hover:text-accent-crimson transition-colors" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-void-black bg-accent-crimson animate-pulse" />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0" onClick={() => setShowDropdown(false)} />
              <div className="absolute top-12 right-0 w-48 bg-surface-elevated border border-border-glow rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* View Profile Action */}
                <button 
                  onClick={() => {
                    onViewProfile();
                    setShowDropdown(false);
                  }}
                  className="w-full py-2.5 px-3 text-left rounded-lg text-xs font-bold text-text-secondary hover:text-accent-crimson hover:bg-void-black/40 flex items-center gap-2.5 transition-all outline-none"
                >
                  <User size={14} />
                  <span>View Profile</span>
                </button>

                {/* Logout Action */}
                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 text-left rounded-lg text-xs font-bold text-accent-crimson hover:bg-accent-crimson/10 flex items-center gap-2.5 transition-all mt-1 outline-none"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
