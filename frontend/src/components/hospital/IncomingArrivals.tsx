import React, { useState } from 'react';
import { Activity, Clock, Navigation, CheckCircle2, User, AlertOctagon, Info, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export type IntakeStatus = 'PENDING' | 'PREPARING' | 'READY' | 'RECEIVED' | 'PROCESSING';

export interface InboundCase {
  id: string;
  ambulanceUnit: string;
  eta: string;
  etaSeconds?: number | null;
  patientName: string;
  severity: string;
  condition: string;
  status: IntakeStatus;
  
  ageGroup?: string | null;
  specialNeeds?: string[];
  driverNote?: string | null;
  ackTime?: string | null;
  bayNote?: string | null;
  driverStatus?: string;
  escalationTriggered?: boolean;
  isBypass?: boolean;
  nudgeSent?: boolean;
}

interface IncomingArrivalsProps {
  cases: InboundCase[];
  onUpdateStatus: (id: string, newStatus: IntakeStatus, bayNote?: string) => void;
  onEscalate?: (id: string) => void;
}

export const IncomingArrivals: React.FC<IncomingArrivalsProps> = ({ cases, onUpdateStatus, onEscalate }) => {
  const [bayNotes, setBayNotes] = useState<Record<string, string>>({});

  const handleBayNoteChange = (id: string, val: string) => {
    setBayNotes(prev => ({ ...prev, [id]: val }));
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL_L1': return 'bg-accent-crimson/20 text-accent-crimson border-accent-crimson/30';
      case 'SEVERE_L2': return 'bg-accent-amber/20 text-accent-amber border-accent-amber/30';
      case 'MODERATE_L3': return 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30';
      default: return 'bg-surface-elevated text-text-secondary border-border-glow';
    }
  };

  const getSeverityLabel = (severity: string) => {
    return severity.replace('_', ' ');
  };

  return (
    <div className="flex-1 bg-void-black overflow-y-auto p-6 custom-scrollbar">
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-void-black/90 backdrop-blur pb-4 z-10">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
          <Activity size={18} className="text-accent-cyan" />
          Active Inbound Mesh
        </h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-elevated border border-border-glow rounded-full">
          <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-[10px] font-mono text-text-primary tracking-widest">LIVE SYNC ACTIVE</span>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border-glow rounded-2xl opacity-50 bg-surface-primary/50">
          <Navigation size={32} className="text-text-muted mb-3" />
          <p className="text-sm text-text-muted uppercase tracking-widest font-bold">No Inbound Units Detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => {
            const isCriticalETA = (c.etaSeconds ?? 999) < 180;
            const isArrivingNow = c.driverStatus === 'ARRIVED_AT_HOSPITAL' || c.driverStatus === 'PATIENT_HANDOFF_COMPLETE';
            const hasAck = !!c.ackTime;

            return (
              <div key={c.id} className={cn(
                "rounded-xl border transition-all duration-300 overflow-hidden",
                c.isBypass ? "border-accent-crimson shadow-glow-crimson bg-accent-crimson/5 animate-pulse" :
                isArrivingNow && c.status !== 'RECEIVED' ? "bg-accent-crimson/5 border-accent-crimson shadow-glow-crimson animate-pulse" :
                !hasAck ? "bg-accent-amber/5 border-accent-amber/30 shadow-[0_0_15px_rgba(255,176,32,0.1)]" :
                c.status === 'READY' ? "bg-accent-cyan/5 border-accent-cyan/30" :
                "bg-surface-elevated border-border-glow"
              )}>
                {/* Bypass Strip */}
                {c.isBypass && c.status !== 'RECEIVED' && (
                  <div className="bg-accent-crimson text-void-black text-[10px] font-extrabold uppercase tracking-widest py-1 px-4 flex items-center gap-2 justify-center select-none shadow-[0_2px_10px_rgba(255,42,95,0.4)]">
                    🚨 FORCE DIVERSION BYPASS: Critical patient inbound by order of Command. Prepare bay!
                  </div>
                )}
                {/* Header Strip */}
                {isArrivingNow && c.status !== 'RECEIVED' && !c.isBypass && (
                  <div className="bg-accent-crimson text-void-black text-[11px] font-bold uppercase tracking-widest py-1 px-4 flex items-center gap-2 justify-center">
                    <AlertOctagon size={14} /> AMBULANCE HAS ARRIVED AT FACILITY
                  </div>
                )}
                
                <div className="p-5 flex flex-col lg:flex-row items-stretch gap-6">
                  {/* Left Column: Patient Preview */}
                  <div className="flex-1 flex gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-lg flex items-center justify-center font-bold text-lg border",
                      getSeverityStyle(c.severity)
                    )}>
                      {c.severity.charAt(9) || c.severity.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-text-primary text-sm uppercase tracking-wide">
                          {c.ambulanceUnit}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono bg-void-black px-1.5 py-0.5 rounded border border-border-glow">
                          #{c.id.slice(0,6)}
                        </span>
                        {!hasAck && <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-amber/20 text-accent-amber font-bold uppercase">New</span>}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <User size={12} className="text-text-muted" />
                        <span className="text-[13px] font-medium text-text-primary">{c.patientName || 'Unknown Patient'}</span>
                        <span className="text-[10px] px-1.5 rounded bg-surface-primary border border-border-glow text-text-muted uppercase font-bold">{c.ageGroup || 'ADULT'}</span>
                        <span className="text-[10px] font-bold text-text-secondary ml-1">— {c.condition}</span>
                      </div>

                      {c.specialNeeds && c.specialNeeds.length > 0 && (
                        <div className="flex gap-2 mb-2">
                          {c.specialNeeds.map(n => (
                            <span key={n} className="text-[9px] px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan uppercase font-bold border border-accent-cyan/20">
                              {n}
                            </span>
                          ))}
                        </div>
                      )}

                      {c.driverNote && (
                        <div className="mt-2 text-[11px] text-text-muted italic flex items-start gap-1.5 bg-void-black/50 p-2 rounded border border-border-glow">
                          <Info size={12} className="shrink-0 mt-0.5" /> 
                          <span>"{c.driverNote}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hidden lg:block w-[1px] bg-border-glow" />

                  {/* Right Column: Status & Actions */}
                  <div className="w-[300px] flex flex-col justify-between shrink-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Status Flow</p>
                        <p className={cn(
                          "text-[12px] font-bold uppercase tracking-wider",
                          !hasAck ? "text-accent-amber" :
                          c.status === 'PENDING' ? "text-accent-amber" :
                          c.status === 'PREPARING' ? "text-accent-amber" :
                          c.status === 'READY' ? "text-accent-cyan" : "text-text-primary"
                        )}>
                          {!hasAck ? 'AWAITING ACK' : c.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">ETA</p>
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock size={12} className={cn(isCriticalETA ? "text-accent-crimson" : "text-accent-cyan")} />
                          <span className={cn(
                            "text-[14px] font-mono font-bold",
                            isCriticalETA ? "text-accent-crimson" : "text-text-primary"
                          )}>{c.eta}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {!hasAck ? (
                        <Button className="w-full bg-accent-amber text-void-black hover:bg-accent-amber/90 font-bold tracking-widest text-[11px]" onClick={() => onUpdateStatus(c.id, 'PENDING')}>
                          ACKNOWLEDGE INBOUND
                        </Button>
                      ) : c.status === 'PENDING' ? (
                        <Button className="w-full bg-surface-elevated border border-accent-amber text-accent-amber hover:bg-accent-amber hover:text-void-black font-bold tracking-widest text-[11px] transition-all" onClick={() => onUpdateStatus(c.id, 'PREPARING')}>
                          START PREPARING ER <ChevronRight size={14} className="ml-1" />
                        </Button>
                      ) : c.status === 'PREPARING' ? (
                        <div className="space-y-2">
                          <input 
                            placeholder="Optional: Assign Trauma Bay (e.g., Bay 3)"
                            className="w-full bg-void-black border border-border-glow rounded-lg px-3 py-1.5 text-[11px] text-text-primary focus:border-accent-cyan outline-none"
                            value={bayNotes[c.id] || ''}
                            onChange={(e) => handleBayNoteChange(c.id, e.target.value)}
                          />
                          <Button className="w-full bg-accent-cyan text-void-black hover:bg-accent-cyan/90 font-bold tracking-widest text-[11px]" onClick={() => onUpdateStatus(c.id, 'READY', bayNotes[c.id])}>
                            MARK ER READY
                          </Button>
                        </div>
                      ) : c.status === 'READY' ? (
                        <>
                          {c.bayNote && (
                            <p className="text-[10px] text-accent-cyan font-bold uppercase mb-2">Assigned: {c.bayNote}</p>
                          )}
                          <Button 
                            className={cn(
                              "w-full font-bold tracking-widest text-[11px] transition-all",
                              isArrivingNow 
                                ? "bg-accent-crimson text-void-black hover:bg-accent-crimson/90 shadow-glow-crimson" 
                                : "bg-surface-elevated border border-border-glow text-text-muted hover:text-text-primary"
                            )} 
                            onClick={() => onUpdateStatus(c.id, 'RECEIVED')}
                          >
                            <CheckCircle2 size={14} className="mr-2" /> CONFIRM PATIENT RECEIPT
                          </Button>
                        </>
                      ) : null}

                      {hasAck && c.status !== 'RECEIVED' && (
                        c.escalationTriggered ? (
                          <div className="w-full mt-2 py-2 bg-accent-crimson/15 border border-accent-crimson/30 text-accent-crimson text-center font-bold uppercase tracking-widest text-[9px] rounded select-none animate-pulse flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-crimson animate-ping" />
                            Escalation Pending at Control
                          </div>
                        ) : (
                          <button 
                            onClick={() => onEscalate && onEscalate(c.id)}
                            className="w-full mt-2 py-1.5 border border-accent-crimson/40 bg-accent-crimson/5 hover:bg-accent-crimson/15 text-accent-crimson hover:border-accent-crimson hover:text-text-primary font-bold uppercase tracking-widest text-[9px] rounded transition-all flex items-center justify-center gap-1"
                          >
                            ⚠️ ESCALATE DISPATCH
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
