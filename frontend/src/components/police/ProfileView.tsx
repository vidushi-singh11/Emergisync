import React, { useState } from 'react';
import { ArrowLeft, User, Shield, Info, Pencil, Eye, Loader2, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProfileViewProps {
  profile: {
    id: string;
    name: string;
    phone: string;
    email: string;
    unitId: string;
    badgeNumber: string;
    rank: string;
    assignedJunctions: string[];
  };
  onUpdateProfile: (updatedProfile: any) => Promise<void>;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form states
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editUnitId, setEditUnitId] = useState(profile.unitId);
  const [editBadgeNumber, setEditBadgeNumber] = useState(profile.badgeNumber);
  const [editRank, setEditRank] = useState(profile.rank);
  const [editJunctions, setEditJunctions] = useState(profile.assignedJunctions.join(', '));

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditUnitId(profile.unitId);
    setEditBadgeNumber(profile.badgeNumber);
    setEditRank(profile.rank);
    setEditJunctions(profile.assignedJunctions.join(', '));
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUnitId.trim() || !editBadgeNumber.trim() || !editRank.trim()) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const junctionArray = editJunctions
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);

      await onUpdateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        unitId: editUnitId.trim().toUpperCase(),
        badgeNumber: editBadgeNumber.trim().toUpperCase(),
        rank: editRank.trim(),
        assignedJunctions: junctionArray
      });
      setIsEditing(false); // Return to read-only view on success
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRankDisplay = (rank: string) => {
    if (rank === 'constable') return 'Patrol Officer / Constable';
    if (rank === 'si') return 'Sub-Inspector (SI)';
    if (rank === 'inspector') return 'Precinct Inspector';
    return rank.charAt(0).toUpperCase() + rank.slice(1);
  };

  return (
    <div className="flex-1 bg-void-black overflow-y-auto p-8 custom-scrollbar">
      
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-accent-amber transition-colors mb-6 uppercase tracking-wider font-mono outline-none group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
        Back to Dashboard
      </button>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Side: Summary Card */}
        <div className="w-full md:w-80 bg-surface-elevated border border-border-glow rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-accent-amber animate-pulse" />
          
          <div className="w-20 h-20 rounded-full bg-accent-amber/10 flex items-center justify-center text-accent-amber border-2 border-accent-amber/20 mb-4 shadow-[0_0_20px_rgba(255,176,32,0.1)]">
            <Shield size={40} />
          </div>

          <h3 className="font-bold text-lg text-text-primary mb-1 tracking-tight">{profile.name}</h3>
          <p className="text-xs text-text-muted mb-4 font-mono truncate w-full">{profile.email}</p>

          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-mono mb-6">
            Police Coordinator
          </span>

          <div className="w-full space-y-3 pt-6 border-t border-border-glow/50">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Unit Callsign</span>
              <span className="text-accent-amber font-mono font-bold">{profile.unitId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Badge ID</span>
              <span className="text-text-primary font-mono">{profile.badgeNumber}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Rank</span>
              <span className="text-text-primary uppercase font-mono text-[9px]">{profile.rank}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Info Pane (Read-Only / Edit mode toggler) */}
        <div className="flex-1 w-full bg-surface-elevated border border-border-glow rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative min-h-[480px]">
          
          {/* Header Action Bar */}
          <div className="flex justify-between items-center pb-4 border-b border-border-glow">
            <div className="flex items-center gap-2.5">
              <Shield className="text-accent-amber" size={18} />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">
                {isEditing ? "Configure Patrol Profile" : "Detailed Profile Info"}
              </h3>
            </div>

            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else {
                  handleOpenEdit();
                }
              }}
              disabled={isLoading}
              className={cn(
                "px-4 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all duration-300 outline-none",
                isEditing 
                  ? "bg-accent-amber/15 border-accent-amber text-accent-amber shadow-glow-amber" 
                  : "bg-surface-primary border border-border-glow text-text-secondary hover:text-accent-amber hover:border-accent-amber hover:shadow-glow-amber/5"
              )}
            >
              {isEditing ? (
                <>
                  <Eye size={14} /> View Mode
                </>
              ) : (
                <>
                  <Pencil size={14} /> Edit Details
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-accent-crimson/15 border border-accent-crimson/30 rounded-lg p-3 text-[11px] text-accent-crimson flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* --- MODE 1: EDIT FORM MODE --- */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Section 1: Officer Info */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  1. Personnel Profile
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Full Name *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-amber outline-none transition-all"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Sgt. James Miller"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Phone Number</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-amber outline-none transition-all"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="e.g. +1 555-0192"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Badge & Role specs */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  2. Patrol Telemetry & Credentials
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Unit Callsign (Unit ID) *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-amber outline-none transition-all uppercase font-mono"
                      value={editUnitId}
                      onChange={e => setEditUnitId(e.target.value)}
                      placeholder="e.g. P-105"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Badge Number *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-amber outline-none transition-all uppercase font-mono"
                      value={editBadgeNumber}
                      onChange={e => setEditBadgeNumber(e.target.value)}
                      placeholder="e.g. 88219"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Rank *</label>
                    <select 
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-amber outline-none transition-all font-mono"
                      value={editRank}
                      onChange={e => setEditRank(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="constable">Patrol Officer / Constable</option>
                      <option value="si">Sub-Inspector (SI)</option>
                      <option value="inspector">Precinct Inspector</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Assigned Junctions (Comma separated) *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-amber outline-none transition-all uppercase font-mono"
                      value={editJunctions}
                      onChange={e => setEditJunctions(e.target.value)}
                      placeholder="e.g. JN-102, JN-210, JN-402"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border-glow/50 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors outline-none"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 text-xs bg-accent-amber text-void-black rounded-lg font-bold tracking-widest uppercase hover:bg-accent-amber/90 transition-all duration-300 shadow-glow-amber flex items-center justify-center gap-2 min-w-[150px] outline-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> Save Changes
                    </>
                  )}
                </button>
              </div>

            </form>
          ) : (
            /* --- MODE 2: READ-ONLY DETAILS MODE --- */
            <div className="space-y-6 flex-1 flex flex-col">
              
              {/* Personnel Details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  1. Personnel Profile
                </span>
                <div className="bg-void-black/20 border border-border-glow rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Full Name</span>
                    <span className="text-xs font-bold text-text-primary">{profile.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Contact Phone</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.phone || 'Not configured'}</span>
                  </div>
                </div>
              </div>

              {/* Badge specs details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  2. Patrol Telemetry & Credentials
                </span>
                <div className="bg-void-black/20 border border-border-glow rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Unit Callsign (Unit ID)</span>
                    <span className="text-xs font-bold text-accent-amber font-mono">{profile.unitId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Badge ID Number</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.badgeNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Officer Rank</span>
                    <span className="text-xs font-bold text-text-primary font-mono">
                      {getRankDisplay(profile.rank)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Assigned Junction Corridors</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.assignedJunctions && profile.assignedJunctions.length > 0 ? (
                        profile.assignedJunctions.map(j => (
                          <span 
                            key={j} 
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-mono"
                          >
                            {j}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-text-muted italic">No junctions assigned.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
