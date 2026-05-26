import React, { useState } from 'react';
import { ArrowLeft, User, Shield, Info, Pencil, Eye, Loader2, Save, Activity, Bed, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProfileViewProps {
  profile: {
    id: string;
    name: string;
    phone: string;
    email: string;
    traumaLevel: string;
    erTotal: number;
    icuTotal: number;
    staffCount: number;
    emergencyLine: string;
    latitude: number;
    longitude: number;
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
  const [editTraumaLevel, setEditTraumaLevel] = useState(profile.traumaLevel);
  const [editErTotal, setEditErTotal] = useState(profile.erTotal);
  const [editIcuTotal, setEditIcuTotal] = useState(profile.icuTotal);
  const [editStaffCount, setEditStaffCount] = useState(profile.staffCount);
  const [editEmergencyLine, setEditEmergencyLine] = useState(profile.emergencyLine);
  const [editLatitude, setEditLatitude] = useState(profile.latitude);
  const [editLongitude, setEditLongitude] = useState(profile.longitude);

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditTraumaLevel(profile.traumaLevel);
    setEditErTotal(profile.erTotal);
    setEditIcuTotal(profile.icuTotal);
    setEditStaffCount(profile.staffCount);
    setEditEmergencyLine(profile.emergencyLine);
    setEditLatitude(profile.latitude);
    setEditLongitude(profile.longitude);
    setErrorMsg(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmergencyLine.trim() || !editTraumaLevel.trim()) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await onUpdateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        traumaLevel: editTraumaLevel,
        erTotal: parseInt(editErTotal.toString()) || 0,
        icuTotal: parseInt(editIcuTotal.toString()) || 0,
        staffCount: parseInt(editStaffCount.toString()) || 0,
        emergencyLine: editEmergencyLine.trim(),
        latitude: parseFloat(editLatitude.toString()) || 0,
        longitude: parseFloat(editLongitude.toString()) || 0
      });
      setIsEditing(false); // Return to view mode on success
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTraumaLevelDisplay = (level: string) => {
    if (level === '1') return 'Level I Trauma Center';
    if (level === '2') return 'Level II Trauma Center';
    if (level === '3') return 'Level III Trauma Center';
    return `Level ${level} Trauma Center`;
  };

  return (
    <div className="flex-1 bg-void-black overflow-y-auto p-8 custom-scrollbar">
      
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-accent-cyan transition-colors mb-6 uppercase tracking-wider font-mono outline-none group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
        Back to Dashboard
      </button>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Side: Summary Card */}
        <div className="w-full md:w-80 bg-surface-elevated border border-border-glow rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-accent-crimson animate-pulse" />
          
          <div className="w-20 h-20 rounded-full bg-accent-crimson/10 flex items-center justify-center text-accent-crimson border-2 border-accent-crimson/20 mb-4 shadow-[0_0_20px_rgba(255,42,95,0.1)]">
            <Activity size={40} />
          </div>

          <h3 className="font-bold text-lg text-text-primary mb-1 tracking-tight truncate w-full">{profile.name}</h3>
          <p className="text-xs text-text-muted mb-4 font-mono truncate w-full">{profile.email}</p>

          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded bg-accent-crimson/10 text-accent-crimson border border-accent-crimson/20 font-mono mb-6">
            Hospital Intake Node
          </span>

          <div className="w-full space-y-3 pt-6 border-t border-border-glow/50">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Trauma Rating</span>
              <span className="text-accent-amber font-mono font-bold">LVL {profile.traumaLevel}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Active Staff</span>
              <span className="text-text-primary font-mono font-bold">{profile.staffCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Coordinates</span>
              <span className="text-text-primary font-mono text-[9px]">
                {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Info Pane (Read-Only / Edit mode toggler) */}
        <div className="flex-1 w-full bg-surface-elevated border border-border-glow rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative min-h-[480px]">
          
          {/* Header Action Bar */}
          <div className="flex justify-between items-center pb-4 border-b border-border-glow">
            <div className="flex items-center gap-2.5">
              <Shield className="text-accent-crimson" size={18} />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">
                {isEditing ? "Configure Hospital Profile" : "Detailed Profile Info"}
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
                  ? "bg-accent-crimson/15 border-accent-crimson text-accent-crimson shadow-glow-crimson" 
                  : "bg-surface-primary border border-border-glow text-text-secondary hover:text-accent-cyan hover:border-accent-cyan hover:shadow-glow-cyan/5"
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
              
              {/* Section 1: Facility Details */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  1. General Facility Profile
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Hospital Name *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Memorial General Central"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Trauma Level Rating *</label>
                    <select 
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all font-mono"
                      value={editTraumaLevel}
                      onChange={e => setEditTraumaLevel(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="1">Level I Trauma</option>
                      <option value="2">Level II Trauma</option>
                      <option value="3">Level III Trauma</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Reception Phone / Phone</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="e.g. +1 555-0192"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Emergency Line Hotline *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all"
                      value={editEmergencyLine}
                      onChange={e => setEditEmergencyLine(e.target.value)}
                      placeholder="e.g. +1 555-9111"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Clinical Capacities */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  2. Operational & Bed Capacities
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Total ER Beds Capacity *</label>
                    <input 
                      type="number"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all font-mono"
                      value={editErTotal}
                      onChange={e => setEditErTotal(parseInt(e.target.value) || 0)}
                      min="0"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Total ICU Beds Capacity *</label>
                    <input 
                      type="number"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all font-mono"
                      value={editIcuTotal}
                      onChange={e => setEditIcuTotal(parseInt(e.target.value) || 0)}
                      min="0"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Total Active Staff Count *</label>
                    <input 
                      type="number"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all font-mono"
                      value={editStaffCount}
                      onChange={e => setEditStaffCount(parseInt(e.target.value) || 0)}
                      min="0"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Coordinates */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  3. Geospatial Positioning (Coordinates)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Latitude *</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all font-mono"
                      value={editLatitude}
                      onChange={e => setEditLatitude(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 40.7128"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Longitude *</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all font-mono"
                      value={editLongitude}
                      onChange={e => setEditLongitude(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. -74.0060"
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
                  className="px-6 py-2 text-xs bg-accent-cyan text-void-black rounded-lg font-bold tracking-widest uppercase hover:bg-accent-cyan/90 transition-all duration-300 shadow-glow-cyan flex items-center justify-center gap-2 min-w-[150px] outline-none"
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
              
              {/* General Facility details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  1. Facility Profile
                </span>
                <div className="bg-void-black/20 border border-border-glow rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Hospital Facility Name</span>
                    <span className="text-xs font-bold text-text-primary">{profile.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Reception Telephone</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.phone || 'Not configured'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Trauma Rating</span>
                    <span className="text-xs font-bold text-accent-amber">{getTraumaLevelDisplay(profile.traumaLevel)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Emergency hotline</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.emergencyLine || 'Not configured'}</span>
                  </div>
                </div>
              </div>

              {/* Bed Capacities & Operational details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  2. Operational Bed Capacities
                </span>
                <div className="bg-void-black/20 border border-border-glow rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-2">
                    <Bed size={16} className="text-accent-cyan mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-text-muted uppercase block">ER Beds Capacity</span>
                      <span className="text-xs font-bold text-text-primary font-mono">{profile.erTotal} Beds</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Bed size={16} className="text-accent-cyan mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-text-muted uppercase block">ICU Beds Capacity</span>
                      <span className="text-xs font-bold text-text-primary font-mono">{profile.icuTotal} Beds</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users size={16} className="text-accent-cyan mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] text-text-muted uppercase block">Active Staff count</span>
                      <span className="text-xs font-bold text-text-primary font-mono">{profile.staffCount} Staff</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Geospatial Positioning */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  3. Geospatial Positioning
                </span>
                <div className="bg-void-black/20 border border-border-glow rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Latitude</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.latitude}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Longitude</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.longitude}</span>
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
