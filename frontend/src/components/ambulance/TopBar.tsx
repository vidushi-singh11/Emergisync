import React from 'react';
import { Power, User, Shield, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TopBarProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  profile: {
    name: string;
    email: string;
    unitId: string;
    vehicleReg: string;
    vehicleType: string;
  };
}

export const TopBar: React.FC<TopBarProps> = ({ isOnline, onToggleOnline, profile }) => {
  const [showProfile, setShowProfile] = React.useState(false);

  return (
    <div className="h-16 border-b border-border-glow bg-surface-primary flex items-center justify-between px-6 relative z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border border-accent-cyan/20">
            <Shield size={18} />
          </div>
          <span className="font-bold tracking-tight text-text-primary">EMERGISYNC <span className="text-accent-cyan">AMB</span></span>
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
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[13px] font-bold text-text-primary">{profile.unitId}</p>
          <p className="text-[11px] text-text-muted uppercase tracking-widest">{profile.vehicleType}</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full bg-surface-elevated border border-border-glow flex items-center justify-center text-text-primary hover:border-accent-cyan transition-colors group"
          >
            <User size={20} className="group-hover:text-accent-cyan transition-colors" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-void-black bg-accent-cyan" />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0" onClick={() => setShowProfile(false)} />
              <div className="absolute top-12 right-0 w-72 bg-surface-elevated border border-border-glow rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border-glow">
                  <div className="w-12 h-12 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary leading-none mb-1">{profile.name}</p>
                    <p className="text-[12px] text-text-muted truncate w-40">{profile.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-muted">Unit ID</span>
                    <span className="text-text-primary font-mono">{profile.unitId}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-muted">Vehicle Reg</span>
                    <span className="text-text-primary font-mono">{profile.vehicleReg}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-muted">Vehicle Type</span>
                    <span className="text-text-primary uppercase">{profile.vehicleType}</span>
                  </div>
                </div>
                <button className="w-full mt-5 py-2 rounded-lg bg-surface-primary border border-border-glow text-[12px] font-medium text-text-secondary hover:text-accent-cyan hover:border-accent-cyan transition-all">
                  Edit Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
