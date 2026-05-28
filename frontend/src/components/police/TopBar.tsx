import React, { useState } from 'react';
import { Shield, Power, AlertTriangle, User, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface TopBarProps {
  unitId: string;
  isOnline: boolean;
  onToggleOnline: () => void;
  activeAlerts: number;
  onViewProfile: () => void;
  onViewHistory: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  unitId, isOnline, onToggleOnline, activeAlerts, onViewProfile, onViewHistory 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="h-16 border-b border-border-glow bg-surface-primary flex items-center justify-between px-6 z-50 relative">
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
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border outline-none",
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-crimson/10 border border-accent-crimson/30 text-accent-crimson animate-pulse mr-2">
            <AlertTriangle size={14} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{activeAlerts} Active Clearances</span>
          </div>
        )}

        <div className="h-6 w-[1px] bg-border-glow" />

        {/* Profile Circle Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-surface-elevated border border-border-glow flex items-center justify-center text-text-primary hover:border-accent-amber hover:shadow-glow-amber/5 transition-all group relative outline-none"
          >
            <User size={20} className="group-hover:text-accent-amber transition-colors" />
            <div className={cn(
              "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-void-black animate-pulse",
              isOnline ? "bg-accent-amber" : "bg-text-muted"
            )} />
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
                  className="w-full py-2.5 px-3 text-left rounded-lg text-xs font-bold text-text-secondary hover:text-accent-amber hover:bg-void-black/40 flex items-center gap-2.5 transition-all outline-none"
                >
                  <User size={14} />
                  <span>View Profile</span>
                </button>

                {/* Mission History Action */}
                <button 
                  onClick={() => {
                    onViewHistory();
                    setShowDropdown(false);
                  }}
                  className="w-full py-2.5 px-3 text-left rounded-lg text-xs font-bold text-text-secondary hover:text-accent-amber hover:bg-void-black/40 flex items-center gap-2.5 transition-all outline-none mt-1"
                >
                  <Shield size={14} className="text-accent-amber" />
                  <span>Missions Log</span>
                </button>

                {/* Logout Action */}
                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 text-left rounded-lg text-xs font-bold text-accent-crimson hover:bg-accent-crimson/10 flex items-center gap-2.5 transition-all mt-1 outline-none border-t border-border-glow/40 pt-2"
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

