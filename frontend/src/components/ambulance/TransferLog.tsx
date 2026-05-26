import React, { useState } from 'react';
import { History, Trash2, ChevronDown, ChevronUp, User, Clock, Activity, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TransferEntry {
  id: string;
  patient: string;
  hospital: string;
  time: string;
  priority: string;
  condition: string;
  totalTime?: string;
}

interface TransferLogProps {
  entries: TransferEntry[];
  onClear: () => void;
}

export const TransferLog: React.FC<TransferLogProps> = ({ entries, onClear }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-80 border-l border-border-glow bg-surface-primary flex flex-col">
      <div className="p-4 border-b border-border-glow flex items-center justify-between bg-void-black/20">
        <div className="flex items-center gap-2">
          <History size={16} className="text-text-muted" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-primary">Recent Transfers</span>
        </div>
        <button 
          onClick={onClear}
          className="text-text-muted hover:text-accent-crimson transition-colors"
          title="Clear History"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-6">
            <History size={40} strokeWidth={1} className="mb-3" />
            <p className="text-[12px]">No recent transfer history available.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id}
              onClick={() => toggleExpand(entry.id)}
              className={cn(
                "p-3 rounded-xl bg-surface-elevated border border-border-glow hover:border-text-muted transition-all cursor-pointer overflow-hidden",
                expandedId === entry.id && "border-accent-cyan/50 ring-1 ring-accent-cyan/20"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-void-black flex items-center justify-center text-[10px] text-text-muted">
                    <User size={12} />
                  </div>
                  <span className="text-[12px] font-bold text-text-primary">{entry.patient}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted font-mono">{entry.time}</span>
                  {expandedId === entry.id ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                </div>
              </div>
              
              <p className="text-[11px] text-text-secondary mb-2 truncate">{entry.hospital}</p>
              
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                  entry.priority === 'high' ? "bg-accent-crimson/10 text-accent-crimson" : "bg-accent-amber/10 text-accent-amber"
                )}>
                  {entry.priority}
                </span>
                {!expandedId && <span className="text-[10px] text-text-muted italic truncate max-w-[100px]">{entry.condition}</span>}
              </div>

              {expandedId === entry.id && (
                <div className="mt-4 pt-4 border-t border-border-glow space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-accent-cyan" />
                    <div>
                      <p className="text-[9px] text-text-muted uppercase font-bold">Total Transit Time</p>
                      <p className="text-[12px] text-text-primary">{entry.totalTime || '14 min 22 sec'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Activity size={14} className="text-accent-crimson" />
                    <div>
                      <p className="text-[9px] text-text-muted uppercase font-bold">Medical Condition</p>
                      <p className="text-[12px] text-text-primary">{entry.condition}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className="text-accent-amber" />
                    <div>
                      <p className="text-[9px] text-text-muted uppercase font-bold">Delivery Point</p>
                      <p className="text-[12px] text-text-primary">{entry.hospital}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
