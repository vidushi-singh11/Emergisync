import React, { useState } from 'react';
import { Power, User, Shield, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

interface TopBarProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  profile: {
    name: string;
    email: string;
    unitId: string;
    vehicleType: string;
  };
  onViewProfile: () => void;
  isSos: boolean;
  onToggleSos: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  isOnline, onToggleOnline, profile, onViewProfile, isSos, onToggleSos 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getVehicleTypeDisplay = (type: string) => {
    return type === 'als' ? 'Advanced Life Support (ALS)' : 'Basic Life Support (BLS)';
  };

  return (
    <div className="h-16 border-b border-border-glow bg-surface-primary flex items-center justify-between px-6 relative z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border border-accent-cyan/20">
            <Shield size={18} />
          </div>
          <span className="font-bold tracking-tight text-text-primary">
            EMERGISYNC <span className="text-accent-cyan">AMBULANCE</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-border-glow" />

        <button 
          onClick={onToggleOnline}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border",
            isOnline 
              ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan shadow-glow-cyan" 
              : "bg-accent-crimson/10 border-accent-crimson text-accent-crimson"
          )}
        >
          <Power size={14} />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {isOnline ? "Unit Online" : "Unit Offline"}
          </span>
        </button>

        {isOnline && (
          <button 
            onClick={onToggleSos}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 border font-bold uppercase tracking-wider text-[11px]",
              isSos 
                ? "bg-accent-crimson text-void-black border-accent-crimson animate-pulse shadow-glow-crimson" 
                : "bg-transparent border-accent-crimson/30 text-accent-crimson hover:bg-accent-crimson/10 hover:border-accent-crimson/50"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full bg-current", isSos && "animate-ping")} />
            <span>{isSos ? "PANIC SOS ACTIVE" : "PANIC SOS"}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[13px] font-bold text-text-primary">{profile.unitId}</p>
          <p className="text-[11px] text-text-muted uppercase tracking-widest font-mono text-[9px]">
            {getVehicleTypeDisplay(profile.vehicleType)}
          </p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-surface-elevated border border-border-glow flex items-center justify-center text-text-primary hover:border-accent-cyan transition-colors group relative"
          >
            <User size={20} className="group-hover:text-accent-cyan transition-colors" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-void-black bg-accent-cyan" />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0" onClick={() => setShowDropdown(false)} />
              <div className="absolute top-12 right-0 w-44 bg-surface-elevated border border-border-glow rounded-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* View Profile Action */}
                <button 
                  onClick={() => {
                    onViewProfile();
                    setShowDropdown(false);
                  }}
                  className="w-full py-2.5 px-3 text-left rounded-lg text-xs font-bold text-text-secondary hover:text-accent-cyan hover:bg-void-black/40 flex items-center gap-2.5 transition-all outline-none"
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
