import React, { useState } from 'react';
import { 
  AlertCircle, Check, X, MapPin, 
  User, Activity, Phone, Clock,
  Navigation, CheckCircle2, Ban, Edit2, Save, AlertOctagon, Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export type TripStatus = 'idle' | 'dispatched' | 'at_scene' | 'en_route';

export interface TripData {
  id: string;
  patientName: string;
  condition: string;
  priority: string;
  location: string;
  destination: string;
  contact: string;
  eta: string;
  etaSeconds?: number | null;
  startCoords?: [number, number];
  endCoords?: [number, number];
  erStatus?: 'PENDING' | 'PREPARING' | 'READY' | 'PROCESSING' | 'RECEIVED';
  bayNote?: string | null;
  ageGroup?: string | null;
  specialNeeds?: string[];
  driverNote?: string | null;
}

interface DispatchSidebarProps {
  status: TripStatus;
  trip: TripData | null;
  onAccept: () => void;
  onReject: () => void;
  onMarkArrived: () => void;
  onStartTransport: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onUpdateTrip: (updates: Partial<TripData>) => void;
}

export const DispatchSidebar: React.FC<DispatchSidebarProps> = ({ 
  status, trip, onAccept, onReject, onMarkArrived, onStartTransport, onComplete, onCancel, onUpdateTrip 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<TripData>>({});

  const handleStartEdit = () => {
    if (!trip) return;
    setEditData({
      patientName: trip.patientName || '',
      condition: trip.condition || '',
      priority: trip.priority || 'MODERATE_L3',
      ageGroup: trip.ageGroup || 'adult',
      specialNeeds: trip.specialNeeds || [],
      driverNote: trip.driverNote || ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdateTrip(editData);
    setIsEditing(false);
  };

  const toggleSpecialNeed = (need: string) => {
    const current = editData.specialNeeds || [];
    if (current.includes(need)) {
      setEditData({ ...editData, specialNeeds: current.filter(n => n !== need) });
    } else {
      setEditData({ ...editData, specialNeeds: [...current, need] });
    }
  };

  if (status === 'idle') {
    return (
      <div className="w-80 border-r border-border-glow bg-surface-primary flex flex-col items-center justify-center p-8 text-center shrink-0">
        <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted mb-4 border border-border-glow">
          <Activity size={32} strokeWidth={1} />
        </div>
        <h3 className="text-text-primary font-bold mb-2">IDLE MODE</h3>
        <p className="text-text-muted text-[13px] leading-relaxed">
          Standing by for incoming dispatch requests. Ensure GPS is active.
        </p>
      </div>
    );
  }

  const isCriticalETA = (trip?.etaSeconds ?? 999) < 180; // Less than 3 minutes

  const getERStatusUI = (erStatus?: string) => {
    switch(erStatus) {
      case 'PREPARING':
        return { label: 'HOSPITAL PREPARING', color: 'text-accent-amber', bg: 'bg-accent-amber/10 border-accent-amber/30' };
      case 'READY':
        return { label: 'HOSPITAL READY', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10 border-accent-cyan/30' };
      case 'PROCESSING':
      case 'RECEIVED':
        return { label: 'HANDOFF IN PROGRESS', color: 'text-accent-violet', bg: 'bg-accent-violet/10 border-accent-violet/30' };
      default:
        return { label: 'HOSPITAL AWARE', color: 'text-text-secondary', bg: 'bg-surface-elevated border-border-glow' };
    }
  };

  const erUI = getERStatusUI(trip?.erStatus);

  return (
    <div className="w-80 border-r border-border-glow bg-surface-primary flex flex-col shrink-0">
      {/* Header */}
      <div className={cn(
        "p-4 border-b border-border-glow flex items-center justify-between",
        status === 'dispatched' ? "bg-accent-amber/10" : "bg-accent-cyan/10"
      )}>
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className={status === 'dispatched' ? "text-accent-amber" : "text-accent-cyan"} />
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-primary">
            {status === 'dispatched' && "Incoming Dispatch"}
            {status === 'at_scene' && "At Scene"}
            {status === 'en_route' && "En Route to Hosp"}
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">#{trip?.id?.slice(0, 6) || '---'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        
        {/* Hospital Status Banner (Only when En Route) */}
        {status === 'en_route' && (
          <div className="space-y-2">
            <div className={cn("px-3 py-2 flex items-center justify-center gap-2 rounded-lg border", erUI.bg)}>
              <div className={cn("w-2 h-2 rounded-full animate-pulse", `bg-${erUI.color.replace('text-', '')}`)} />
              <span className={cn("text-[11px] font-bold tracking-widest uppercase", erUI.color)}>{erUI.label}</span>
            </div>
            
            {trip?.bayNote && (
              <div className="bg-accent-amber/10 border border-accent-amber/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertOctagon size={12} className="text-accent-amber" />
                  <span className="text-[10px] font-bold text-accent-amber uppercase tracking-wider">Bay Assignment</span>
                </div>
                <p className="text-[12px] text-text-primary font-medium">{trip.bayNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Patient Details */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Patient Details</label>
            <button 
              onClick={isEditing ? handleSaveEdit : handleStartEdit}
              className="p-1 hover:text-accent-cyan transition-colors text-text-muted"
            >
              {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
            </button>
          </div>
          
          <div className="bg-surface-elevated border border-border-glow rounded-xl p-4 shadow-sm">
            {isEditing ? (
              <div className="space-y-3">
                <input 
                  className="w-full bg-void-black border border-border-glow rounded px-2 py-1.5 text-xs text-text-primary focus:border-accent-cyan outline-none" 
                  value={editData.patientName} onChange={(e) => setEditData({ ...editData, patientName: e.target.value })} placeholder="Patient Name (Optional)" 
                />
                <input 
                  className="w-full bg-void-black border border-border-glow rounded px-2 py-1.5 text-xs text-text-primary focus:border-accent-cyan outline-none" 
                  value={editData.condition} onChange={(e) => setEditData({ ...editData, condition: e.target.value })} placeholder="Condition / Chief Complaint" 
                />
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    className="w-full bg-void-black border border-border-glow rounded px-2 py-1.5 text-xs text-text-primary focus:border-accent-cyan outline-none" 
                    value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  >
                    <option value="CRITICAL_L1">Level 1 - Critical</option>
                    <option value="SEVERE_L2">Level 2 - Severe</option>
                    <option value="MODERATE_L3">Level 3 - Moderate</option>
                    <option value="MINOR_L4">Level 4 - Minor</option>
                  </select>
                  <select 
                    className="w-full bg-void-black border border-border-glow rounded px-2 py-1.5 text-xs text-text-primary focus:border-accent-cyan outline-none" 
                    value={editData.ageGroup || ''} onChange={(e) => setEditData({ ...editData, ageGroup: e.target.value })}
                  >
                    <option value="infant">Infant (0-2)</option>
                    <option value="child">Child (3-12)</option>
                    <option value="adult">Adult</option>
                    <option value="senior">Senior (65+)</option>
                  </select>
                </div>
                
                <div className="pt-2 border-t border-border-glow">
                  <span className="text-[10px] text-text-muted mb-2 block uppercase font-bold">Special Needs</span>
                  <div className="flex flex-wrap gap-2">
                    {['Oxygen', 'Ventilator', 'Spine Board', 'Cardiac'].map(need => (
                      <button
                        key={need}
                        onClick={() => toggleSpecialNeed(need)}
                        className={cn(
                          "text-[10px] px-2 py-1 rounded border transition-colors",
                          (editData.specialNeeds || []).includes(need) ? "bg-accent-cyan/20 border-accent-cyan text-accent-cyan" : "bg-void-black border-border-glow text-text-muted"
                        )}
                      >
                        {need}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  className="w-full bg-void-black border border-border-glow rounded px-2 py-1.5 text-xs text-text-primary focus:border-accent-cyan outline-none resize-none h-16" 
                  value={editData.driverNote || ''} onChange={(e) => setEditData({ ...editData, driverNote: e.target.value })} placeholder="Driver Notes for ER..." 
                />
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-void-black flex items-center justify-center text-text-primary mt-1 border border-border-glow">
                    <User size={20} className="text-text-muted" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-text-primary text-sm">{trip?.patientName || 'Unknown Patient'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse", 
                        trip?.priority === 'CRITICAL_L1' ? "bg-accent-crimson" : 
                        trip?.priority === 'SEVERE_L2' ? "bg-accent-amber" : 
                        trip?.priority === 'MODERATE_L3' ? "bg-accent-cyan" : "bg-text-secondary"
                      )} />
                      <span className="text-[10px] text-text-secondary uppercase font-bold">
                        {trip?.priority?.replace('_', ' ') || 'MODERATE L3'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-border-glow">
                  <div className="flex items-start gap-2 text-[12px]">
                    <Activity size={14} className="text-text-muted mt-0.5 shrink-0" />
                    <span className="text-text-primary font-medium">{trip?.condition || 'No condition provided'}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trip?.ageGroup && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-primary border border-border-glow text-text-secondary uppercase font-bold">
                        {trip.ageGroup}
                      </span>
                    )}
                    {trip?.specialNeeds?.map(need => (
                      <span key={need} className="text-[9px] px-1.5 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan uppercase font-bold">
                        {need}
                      </span>
                    ))}
                  </div>

                  {trip?.driverNote && (
                    <div className="mt-3 bg-surface-primary p-2 rounded border border-border-glow">
                      <p className="text-[10px] text-text-muted italic flex items-center gap-1">
                        <Info size={10} /> "{trip.driverNote}"
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Tactical Info */}
        <section>
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Tactical Status</label>
          <div className="bg-surface-elevated border border-border-glow rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1"><MapPin size={14} className="text-accent-crimson" /></div>
              <div>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">LOCATION</p>
                <p className="text-[12px] text-text-primary">{trip?.location}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1"><Navigation size={14} className="text-accent-cyan" /></div>
              <div>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">DESTINATION</p>
                <p className="text-[12px] text-text-primary">{trip?.destination}</p>
                
                {status === 'en_route' && trip?.eta && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={12} className={cn(isCriticalETA ? "text-accent-crimson" : "text-text-secondary")} />
                    <span className={cn(
                      "text-[12px] font-mono font-bold",
                      isCriticalETA ? "text-accent-crimson animate-pulse" : "text-text-primary"
                    )}>
                      {trip.eta}
                    </span>
                    {isCriticalETA && <span className="text-[9px] text-accent-crimson font-bold ml-1 uppercase">Arriving</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border-glow bg-surface-primary space-y-3">
        {status === 'dispatched' ? (
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 h-12" onClick={onReject}><X size={18} className="mr-2" /> REJECT</Button>
            <Button variant="primary" className="flex-[2] h-12 shadow-glow-cyan" onClick={onAccept}><Check size={18} className="mr-2" /> ACCEPT</Button>
          </div>
        ) : (
          <>
            {status === 'at_scene' ? (
              <Button variant="primary" className="w-full h-12 shadow-glow-cyan" onClick={onStartTransport}><Navigation size={18} className="mr-2" /> START TRANSPORT</Button>
            ) : (
              <Button 
                variant="primary" 
                className={cn(
                  "w-full h-12 transition-all",
                  trip?.erStatus === 'RECEIVED' 
                    ? "bg-accent-violet text-void-black shadow-glow-violet" 
                    : "bg-accent-cyan text-void-black shadow-glow-cyan"
                )} 
                onClick={onComplete}
              >
                <CheckCircle2 size={18} className="mr-2" /> 
                {trip?.erStatus === 'RECEIVED' ? 'COMPLETE HANDOFF' : 'COMPLETE TRIP'}
              </Button>
            )}
            
            <div className="flex gap-3">
              {status === 'at_scene' ? (
                <Button variant="secondary" className="flex-1 h-10 text-[11px]" onClick={onCancel}><Ban size={14} className="mr-2" /> CANCEL TRIP</Button>
              ) : (
                <Button 
                  variant="secondary" 
                  className={cn(
                    "flex-1 h-10 text-[11px] border transition-colors",
                    isCriticalETA ? "border-accent-crimson/50 hover:bg-accent-crimson/10" : ""
                  )} 
                  onClick={onMarkArrived}
                >
                  <MapPin size={14} className={cn("mr-2", isCriticalETA && "text-accent-crimson")} /> MARK ARRIVED
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
