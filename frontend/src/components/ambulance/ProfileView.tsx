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
    vehicleReg: string;
    vehicleType: string;
    licenseNumber: string;
    emergencyContact: string;
    equipment: string[];
  };
  onUpdateProfile: (updatedProfile: any) => Promise<void>;
  onBack: () => void;
}

const COMMON_EQUIPMENT = ['Oxygen', 'Ventilator', 'Spine Board', 'Defibrillator', 'First Aid Kit'];

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onUpdateProfile, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit form states
  const [editName, setEditName] = useState(profile.name);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editUnitId, setEditUnitId] = useState(profile.unitId);
  const [editVehicleReg, setEditVehicleReg] = useState(profile.vehicleReg);
  const [editVehicleType, setEditVehicleType] = useState(profile.vehicleType);
  const [editLicenseNumber, setEditLicenseNumber] = useState(profile.licenseNumber);
  const [editEmergencyContact, setEditEmergencyContact] = useState(profile.emergencyContact);
  const [editEquipment, setEditEquipment] = useState<string[]>(profile.equipment || []);

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditUnitId(profile.unitId);
    setEditVehicleReg(profile.vehicleReg);
    setEditVehicleType(profile.vehicleType);
    setEditLicenseNumber(profile.licenseNumber);
    setEditEmergencyContact(profile.emergencyContact);
    setEditEquipment(profile.equipment || []);
    setErrorMsg(null);
    setIsEditing(true);
  };

  const toggleEquipmentItem = (item: string) => {
    setEditEquipment(prev => 
      prev.includes(item) 
        ? prev.filter(x => x !== item) 
        : [...prev, item]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editUnitId.trim() || !editVehicleReg.trim() || !editLicenseNumber.trim() || !editEmergencyContact.trim()) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await onUpdateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        unitId: editUnitId.trim().toUpperCase(),
        vehicleReg: editVehicleReg.trim().toUpperCase(),
        vehicleType: editVehicleType,
        licenseNumber: editLicenseNumber.trim().toUpperCase(),
        emergencyContact: editEmergencyContact.trim(),
        equipment: editEquipment
      });
      setIsEditing(false); // Return to read-only view on success
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleTypeDisplay = (type: string) => {
    return type === 'als' ? 'Advanced Life Support (ALS)' : 'Basic Life Support (BLS)';
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
          <div className="absolute top-0 inset-x-0 h-1.5 bg-accent-cyan animate-pulse" />
          
          <div className="w-20 h-20 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan border-2 border-accent-cyan/20 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <User size={40} />
          </div>

          <h3 className="font-bold text-lg text-text-primary mb-1 tracking-tight">{profile.name}</h3>
          <p className="text-xs text-text-muted mb-4 font-mono truncate w-full">{profile.email}</p>

          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 font-mono mb-6">
            Ambulance Driver
          </span>

          <div className="w-full space-y-3 pt-6 border-t border-border-glow/50">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Unit ID</span>
              <span className="text-accent-cyan font-mono font-bold">{profile.unitId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Vehicle Reg</span>
              <span className="text-text-primary font-mono">{profile.vehicleReg}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-muted font-medium">Vehicle Type</span>
              <span className="text-text-primary uppercase font-mono text-[9px]">{profile.vehicleType}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Info Pane (Read-Only / Edit mode toggler) */}
        <div className="flex-1 w-full bg-surface-elevated border border-border-glow rounded-2xl p-6 shadow-2xl flex flex-col gap-6 relative min-h-[480px]">
          
          {/* Header Action Bar */}
          <div className="flex justify-between items-center pb-4 border-b border-border-glow">
            <div className="flex items-center gap-2.5">
              <Shield className="text-accent-cyan" size={18} />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest font-mono">
                {isEditing ? "Configure Operational Profile" : "Detailed Profile Info"}
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
                  ? "bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-glow-cyan" 
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
              
              {/* Section 1: Personnel */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  1. Personnel Profile
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Full Name *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="e.g. Capt. Sarah Jenkins"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Phone Number</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="e.g. +1 555-0192"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle Specs */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  2. Ambulance Telemetry
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Unit Callsign (Unit ID) *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all uppercase font-mono"
                      value={editUnitId}
                      onChange={e => setEditUnitId(e.target.value)}
                      placeholder="e.g. AMB-94"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Vehicle Reg Plate *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all uppercase font-mono"
                      value={editVehicleReg}
                      onChange={e => setEditVehicleReg(e.target.value)}
                      placeholder="e.g. 7XYZ-42"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Vehicle Service Type *</label>
                    <select 
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all font-mono"
                      value={editVehicleType}
                      onChange={e => setEditVehicleType(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="als">ALS (Advanced Life Support)</option>
                      <option value="bls">BLS (Basic Life Support)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Emergency Dispatch Line *</label>
                    <input 
                      type="text"
                      className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all"
                      value={editEmergencyContact}
                      onChange={e => setEditEmergencyContact(e.target.value)}
                      placeholder="e.g. +1 555-9111"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] text-text-secondary uppercase mb-1 block font-bold">Driver License number *</label>
                  <input 
                    type="text"
                    className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent-cyan outline-none transition-all uppercase font-mono"
                    value={editLicenseNumber}
                    onChange={e => setEditLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-48592-A"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Section 3: Equipment */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  3. On-Board Medical Equipment
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {COMMON_EQUIPMENT.map(item => {
                    const isSelected = editEquipment.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleEquipmentItem(item)}
                        disabled={isLoading}
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all duration-300 outline-none",
                          isSelected 
                            ? "bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-glow-cyan" 
                            : "bg-void-black border-border-glow text-text-muted hover:border-text-secondary hover:text-text-primary"
                        )}
                      >
                        {item}
                      </button>
                    );
                  })}
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

              {/* Vehicle specs details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  2. Ambulance Telemetry
                </span>
                <div className="bg-void-black/20 border border-border-glow rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Unit Callsign (Unit ID)</span>
                    <span className="text-xs font-bold text-accent-cyan font-mono">{profile.unitId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Registration Plate</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.vehicleReg}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Service Type</span>
                    <span className="text-xs font-bold text-text-primary uppercase font-mono">
                      {getVehicleTypeDisplay(profile.vehicleType)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Driver License</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.licenseNumber || 'Not configured'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[10px] text-text-muted uppercase block">Emergency Dispatch Line</span>
                    <span className="text-xs font-bold text-text-primary font-mono">{profile.emergencyContact || 'Not configured'}</span>
                  </div>
                </div>
              </div>

              {/* Medical Equipment details */}
              <div className="space-y-2 mt-auto">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block font-mono">
                  3. On-Board Medical Equipment
                </span>
                <div className="bg-void-black/20 border border-border-glow rounded-xl p-4">
                  {profile.equipment && profile.equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.equipment.map(item => (
                        <span 
                          key={item} 
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic">No inventory items assigned to this unit.</p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
