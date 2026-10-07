 function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useState } from 'react';
import { 
  AlertCircle, Check, X, MapPin, 
  User, Activity, Clock,
  Navigation, CheckCircle2, Ban, Edit2, Save, AlertOctagon, Info
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';


 



































export const DispatchSidebar = ({ 
  status, trip, onAccept, onReject, onMarkArrived, onStartTransport, onComplete, onCancel, onUpdateTrip,
  hospitals = [], onRequestSwap
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedSwapId, setSelectedSwapId] = useState('');

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

  const toggleSpecialNeed = (need) => {
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

  const isCriticalETA = (_nullishCoalesce(_optionalChain([trip, 'optionalAccess', _ => _.etaSeconds]), () => ( 999))) < 180; // Less than 3 minutes

  const getERStatusUI = (erStatus) => {
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

  const erUI = getERStatusUI(_optionalChain([trip, 'optionalAccess', _2 => _2.erStatus]));

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
        <span className="text-[10px] font-mono text-text-muted">#{_optionalChain([trip, 'optionalAccess', _3 => _3.id, 'optionalAccess', _4 => _4.slice, 'call', _5 => _5(0, 6)]) || '---'}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        
        {/* Hospital Status Banner (Only when En Route) */}
        {status === 'en_route' && (
          <div className="space-y-2">
            <div className={cn("px-3 py-2 flex items-center justify-center gap-2 rounded-lg border", erUI.bg)}>
              <div className={cn("w-2 h-2 rounded-full animate-pulse", `bg-${erUI.color.replace('text-', '')}`)} />
              <span className={cn("text-[11px] font-bold tracking-widest uppercase", erUI.color)}>{erUI.label}</span>
            </div>
            
            {_optionalChain([trip, 'optionalAccess', _6 => _6.bayNote]) && (
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
                    <p className="font-bold text-text-primary text-sm">{_optionalChain([trip, 'optionalAccess', _7 => _7.patientName]) || 'Unknown Patient'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse", 
                        _optionalChain([trip, 'optionalAccess', _8 => _8.priority]) === 'CRITICAL_L1' ? "bg-accent-crimson" : 
                        _optionalChain([trip, 'optionalAccess', _9 => _9.priority]) === 'SEVERE_L2' ? "bg-accent-amber" : 
                        _optionalChain([trip, 'optionalAccess', _10 => _10.priority]) === 'MODERATE_L3' ? "bg-accent-cyan" : "bg-text-secondary"
                      )} />
                      <span className="text-[10px] text-text-secondary uppercase font-bold">
                        {_optionalChain([trip, 'optionalAccess', _11 => _11.priority, 'optionalAccess', _12 => _12.replace, 'call', _13 => _13('_', ' ')]) || 'MODERATE L3'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-3 border-t border-border-glow">
                  <div className="flex items-start gap-2 text-[12px]">
                    <Activity size={14} className="text-text-muted mt-0.5 shrink-0" />
                    <span className="text-text-primary font-medium">{_optionalChain([trip, 'optionalAccess', _14 => _14.condition]) || 'No condition provided'}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {_optionalChain([trip, 'optionalAccess', _15 => _15.ageGroup]) && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-primary border border-border-glow text-text-secondary uppercase font-bold">
                        {trip.ageGroup}
                      </span>
                    )}
                    {_optionalChain([trip, 'optionalAccess', _16 => _16.specialNeeds, 'optionalAccess', _17 => _17.map, 'call', _18 => _18(need => (
                      <span key={need} className="text-[9px] px-1.5 py-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan uppercase font-bold">
                        {need}
                      </span>
                    ))])}
                  </div>

                  {_optionalChain([trip, 'optionalAccess', _19 => _19.driverNote]) && (
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
                <p className="text-[12px] text-text-primary">{_optionalChain([trip, 'optionalAccess', _20 => _20.location])}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1"><Navigation size={14} className="text-accent-cyan" /></div>
              <div>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider mb-0.5">DESTINATION</p>
                <p className="text-[12px] text-text-primary">{_optionalChain([trip, 'optionalAccess', _21 => _21.destination])}</p>
                
                {status === 'en_route' && _optionalChain([trip, 'optionalAccess', _22 => _22.eta]) && (
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

            {/* Hospital Swap Section */}
            {(status === 'en_route' || status === 'dispatched') && (
              _optionalChain([trip, 'optionalAccess', _23 => _23.requestedHospitalId]) ? (
                <div className="bg-accent-amber/10 border border-accent-amber/30 rounded-lg p-2.5 mt-3 text-xs">
                  <span className="font-bold text-accent-amber animate-pulse">SWAP REQUEST PENDING</span>
                  <p className="text-[10px] text-text-muted mt-1">Awaiting Control Room approval for route redirection...</p>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-border-glow/50">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5">Emergency Re-routing</p>
                  <div className="flex gap-2">
                    <select 
                      value={selectedSwapId}
                      onChange={e => setSelectedSwapId(e.target.value)}
                      className="flex-1 bg-void-black border border-border-glow rounded px-2 py-1 text-[11px] text-text-primary outline-none focus:border-accent-cyan"
                    >
                      <option value="">Select Hospital...</option>
                      {_optionalChain([hospitals, 'optionalAccess', _24 => _24.filter, 'call', _25 => _25(h => h.name !== _optionalChain([trip, 'optionalAccess', _26 => _26.destination])), 'access', _27 => _27.map, 'call', _28 => _28(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))])}
                    </select>
                    <button 
                      onClick={() => {
                        if (selectedSwapId && onRequestSwap) {
                          onRequestSwap(selectedSwapId);
                          setSelectedSwapId('');
                        }
                      }}
                      disabled={!selectedSwapId}
                      className="px-2.5 py-1 bg-accent-cyan text-void-black font-bold uppercase tracking-widest text-[9px] rounded hover:bg-accent-cyan/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      SWAP
                    </button>
                  </div>
                </div>
              )
            )}
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
                  _optionalChain([trip, 'optionalAccess', _29 => _29.erStatus]) === 'RECEIVED' 
                    ? "bg-accent-violet text-void-black shadow-glow-violet" 
                    : "bg-accent-cyan text-void-black shadow-glow-cyan"
                )} 
                onClick={onComplete}
              >
                <CheckCircle2 size={18} className="mr-2" /> 
                {_optionalChain([trip, 'optionalAccess', _30 => _30.erStatus]) === 'RECEIVED' ? 'COMPLETE HANDOFF' : 'COMPLETE TRIP'}
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
