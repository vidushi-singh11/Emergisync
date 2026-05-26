import React, { useState } from 'react';
import { History, Search, User } from 'lucide-react';

export interface AdmissionEntry {
  id: string;
  patientName: string;
  tripId: string;
  timestamp: string;
  condition: string;
}

interface AdmissionsLogProps {
  entries: AdmissionEntry[];
}

export const AdmissionsLog: React.FC<AdmissionsLogProps> = ({ entries }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = entries.filter(e => 
    e.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.tripId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-64 border-t border-border-glow bg-surface-primary flex flex-col">
      <div className="p-4 border-b border-border-glow flex items-center justify-between bg-void-black/20">
        <div className="flex items-center gap-2">
          <History size={16} className="text-text-muted" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-primary">Recent Admissions (24h)</span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-void-black border border-border-glow rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-accent-cyan outline-none text-text-primary w-48"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <p className="text-[12px]">No recent admissions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(entry => (
              <div key={entry.id} className="p-3 rounded-xl bg-surface-elevated border border-border-glow flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-void-black flex items-center justify-center text-text-muted mt-1">
                  <User size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[12px] font-bold text-text-primary">{entry.patientName}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-primary border border-border-glow text-text-muted font-mono">
                      #{entry.tripId}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mb-1">{entry.condition}</p>
                  <p className="text-[10px] text-text-muted font-mono">{entry.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
