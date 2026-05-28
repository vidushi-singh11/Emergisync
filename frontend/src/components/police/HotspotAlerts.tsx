import React from 'react';
import { AlertOctagon, PhoneCall } from 'lucide-react';
import { Button } from '../ui/Button';

export interface HotspotAlert {
  id: string;
  junctionId: string;
  unitCount: number;
}

interface HotspotAlertsProps {
  alerts: HotspotAlert[];
  onRequestBackup: (junctionId: string) => void;
}

export const HotspotAlerts: React.FC<HotspotAlertsProps> = ({ alerts, onRequestBackup }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-3 w-80">
      {alerts.map(alert => (
        <div key={alert.id} className="bg-surface-elevated/95 backdrop-blur border border-accent-crimson rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-accent-crimson/20 px-4 py-2 flex items-center gap-2 border-b border-accent-crimson/30">
            <AlertOctagon size={16} className="text-accent-crimson animate-pulse" />
            <span className="text-[11px] font-bold text-accent-crimson uppercase tracking-widest">Conflict Warning</span>
          </div>
          <div className="p-4">
            <h3 className="text-xl font-bold font-mono text-text-primary leading-none mb-1">{alert.junctionId}</h3>
            <p className="text-[12px] text-text-secondary mb-2 leading-snug">
              <span className="text-accent-amber font-bold">{alert.unitCount} emergency units</span> converging on this junction simultaneously. Severe traffic bottleneck anticipated.
            </p>
            <p className="text-[9.5px] text-text-muted mb-4 uppercase tracking-wider font-semibold leading-relaxed">
              ⚠️ Congestion Warning: Converging paths detected. Dispatch adjacent patrols to clear secondary gridlock.
            </p>
            <Button 
              size="sm" 
              className="w-full bg-accent-crimson hover:bg-accent-crimson/80 text-void-black font-bold h-10"
              onClick={() => onRequestBackup(alert.junctionId)}
            >
              <PhoneCall size={16} className="mr-2" /> REQUEST BACKUP
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
