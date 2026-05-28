import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, CheckCircle2, AlertTriangle, Clock, Calendar, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HistoryLog {
  id: string;
  trip_id: string | null;
  actor_id: string | null;
  action_type: string;
  new_state: any;
  created_at: string;
}

interface HistoryViewProps {
  officerId: string;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ officerId, onBack }) => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!officerId) return;

    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('trip_logs')
          .select('*')
          .eq('actor_id', officerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setLogs(data);
      } catch (err) {
        console.error("Failed to load mission logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [officerId]);

  return (
    <div className="flex-1 bg-void-black text-text-primary p-6 overflow-y-auto custom-scrollbar flex flex-col h-full">
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 mb-6 border-b border-border-glow/50 pb-5 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary hover:text-text-primary border border-border-glow transition-all"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5">
            <Shield className="text-accent-amber animate-pulse" size={20} />
            Patrol Mission Log History
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5 uppercase tracking-wider font-semibold">
            Persistent immutable tactical audit logs for precinct accountability and operational review.
          </p>
        </div>
      </div>

      {/* CORE TIMELINE FEED */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
            <Clock size={32} className="animate-spin text-accent-amber mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Querying database registry...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border-glow/45 rounded-2xl bg-void-black/35 flex flex-col items-center justify-center">
            <Shield size={48} className="text-text-muted opacity-30 mb-4" strokeWidth={1} />
            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">No missions logged</p>
            <p className="text-[11px] text-text-muted mt-1 max-w-sm leading-relaxed">
              You haven't completed any clearances or rescue escorts yet. Action logs will automatically propagate here in real-time.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border-glow/65 ml-4 pl-8 py-2 space-y-8">
            {logs.map((log) => {
              const formattedTime = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const formattedDate = new Date(log.created_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
              
              // Extract denormalized info
              const junctionId = log.new_state?.junction_id || 'N/A';
              const ambulanceId = log.new_state?.ambulance_id || 'N/A';
              const actionName = log.action_type.replace('_', ' ');

              return (
                <div key={log.id} className="relative group">
                  {/* Blinking Timeline Dot */}
                  <span className={cn(
                    "absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-2 border-void-black flex items-center justify-center text-void-black shadow-lg transition-all duration-300",
                    log.action_type === 'JUNCTION_CLEARED' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" :
                    log.action_type === 'SOS_ESCORT_RESOLVED' ? "bg-accent-cyan shadow-[0_0_10px_rgba(34,211,238,0.4)]" :
                    "bg-accent-crimson shadow-[0_0_10px_rgba(255,42,95,0.4)]"
                  )}>
                    {log.action_type === 'JUNCTION_CLEARED' && <CheckCircle2 size={12} strokeWidth={2.5} />}
                    {log.action_type === 'SOS_ESCORT_RESOLVED' && <CheckCircle2 size={12} strokeWidth={2.5} />}
                    {log.action_type === 'SOS_ESCORT_DEPLOYED' && <Shield size={12} strokeWidth={2.5} />}
                    {log.action_type === 'SOS_ESCORT_ARRIVED' && <Shield size={12} strokeWidth={2.5} />}
                  </span>

                  {/* Log Card */}
                  <div className="p-5 bg-surface-primary/50 border border-border-glow/60 rounded-xl group-hover:border-border-glow hover:bg-surface-elevated/40 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border font-mono",
                          log.action_type === 'JUNCTION_CLEARED' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          log.action_type === 'SOS_ESCORT_RESOLVED' ? "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20" :
                          log.action_type === 'SOS_ESCORT_DEPLOYED' ? "bg-accent-crimson/10 text-accent-crimson border-accent-crimson/20" :
                          "bg-accent-amber/10 text-accent-amber border-accent-amber/20"
                        )}>
                          {actionName}
                        </span>
                        
                        <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-mono">
                          <Calendar size={10} />
                          <span>{formattedDate}</span>
                          <span className="opacity-40">•</span>
                          <Clock size={10} />
                          <span>{formattedTime}</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-text-primary">
                        {log.action_type === 'JUNCTION_CLEARED' && `Junction ${junctionId} Corridor Clearance Established`}
                        {log.action_type === 'SOS_ESCORT_DEPLOYED' && `Assigned Escort Deployment: Distressed Unit ${ambulanceId}`}
                        {log.action_type === 'SOS_ESCORT_ARRIVED' && `Escort Unit Arrived at Distressed Ambulance: Scene Secured`}
                        {log.action_type === 'SOS_ESCORT_RESOLVED' && `SOS Escort Complete: Threat Neutralized & Ambulance Handed Off`}
                      </h4>

                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {log.action_type === 'JUNCTION_CLEARED' && `Officer manually override traffic controls at intersection ${junctionId} to enforce high-speed green corridors.`}
                        {log.action_type === 'SOS_ESCORT_DEPLOYED' && `Dispatched by air traffic control tower. Proceeding to target ambulance GPS telemetry on high priority.`}
                        {log.action_type === 'SOS_ESCORT_ARRIVED' && `Contact made. Officer positioned to shield and escort the emergency run from immediate hazards.`}
                        {log.action_type === 'SOS_ESCORT_RESOLVED' && `Ambulance unit successfully escorted past danger zones and handed over to standard operational routing.`}
                      </p>
                    </div>

                    {/* Denormalized Meta Data Badge */}
                    <div className="shrink-0 text-right font-mono text-[10px] text-text-muted bg-void-black/60 px-3 py-1.5 rounded-lg border border-border-glow/50 flex flex-col gap-0.5">
                      <span className="uppercase text-[8px] font-bold text-text-secondary tracking-wider">Audit Ref:</span>
                      <span className="text-[9px] font-bold text-text-primary tracking-wide">{log.id.substring(0, 13).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
