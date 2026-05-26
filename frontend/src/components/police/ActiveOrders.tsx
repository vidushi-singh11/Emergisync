import React from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Navigation, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export type ClearanceStatus = 'awaiting' | 'in_progress' | 'cleared';

export interface ClearanceOrder {
  id: string; // Trip ID
  clearanceId: string;
  ambulanceId: string;
  junctionId: string;
  status: ClearanceStatus;
  eta: string;
  coords: [number, number]; // Junction coords
  ambCoords?: [number, number]; // Ambulance current coords (mocked)
}

interface ActiveOrdersProps {
  orders: ClearanceOrder[];
  onAcknowledge: (id: string) => void;
  onMarkCleared: (id: string) => void;
  onEscalate: (id: string) => void;
  onFocusJunction: (coords: [number, number]) => void;
}

export const ActiveOrders: React.FC<ActiveOrdersProps> = ({ 
  orders, onAcknowledge, onMarkCleared, onEscalate, onFocusJunction 
}) => {
  if (orders.length === 0) {
    return (
      <div className="w-[400px] border-r border-border-glow bg-void-black/50 flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert size={48} strokeWidth={1} className="text-text-muted opacity-30 mb-4" />
        <p className="text-text-muted font-bold tracking-widest uppercase">No Active Orders</p>
        <p className="text-[12px] text-text-secondary mt-2">Stand by for corridor assignments.</p>
      </div>
    );
  }

  return (
    <div className="w-[420px] border-r border-border-glow bg-surface-primary flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-border-glow sticky top-0 bg-surface-primary/90 backdrop-blur z-10">
        <h2 className="text-[12px] font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
          <Navigation size={14} className="text-accent-amber" />
          Active Clearances ({orders.length})
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {orders.map(order => (
          <div 
            key={order.id} 
            onClick={() => onFocusJunction(order.coords)}
            className={cn(
              "rounded-xl border p-5 flex flex-col gap-4 cursor-pointer transition-all",
              order.status === 'awaiting' ? "bg-accent-crimson/5 border-accent-crimson/30 hover:border-accent-crimson/60" :
              order.status === 'in_progress' ? "bg-accent-amber/5 border-accent-amber shadow-[0_0_15px_rgba(255,176,32,0.15)]" :
              "bg-accent-cyan/5 border-accent-cyan/30 opacity-60 grayscale"
            )}
          >
            {/* Massive Junction ID */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-1">Target Junction</p>
                <h3 className="text-4xl font-black font-mono tracking-tighter text-text-primary leading-none">
                  {order.junctionId}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-1">AMB Unit</p>
                <p className="text-lg font-bold text-accent-cyan font-mono">{order.ambulanceId}</p>
              </div>
            </div>

            {/* ETA & Status */}
            <div className="flex items-center justify-between py-3 border-y border-border-glow/50">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-text-secondary" />
                <span className="text-xl font-mono font-bold text-text-primary">{order.eta}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded",
                  order.status === 'awaiting' ? "bg-accent-crimson/20 text-accent-crimson" :
                  order.status === 'in_progress' ? "bg-accent-amber/20 text-accent-amber animate-pulse" :
                  "bg-accent-cyan/20 text-accent-cyan"
                )}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-2">
              {order.status === 'awaiting' && (
                <Button variant="primary" className="flex-1 h-12 text-sm bg-accent-cyan text-void-black hover:bg-accent-cyan/90" onClick={(e) => { e.stopPropagation(); onAcknowledge(order.id); }}>
                  <CheckCircle2 size={18} className="mr-2" /> ACKNOWLEDGE
                </Button>
              )}
              {order.status === 'in_progress' && (
                <>
                  <Button variant="secondary" className="flex-1 h-12 text-sm border-accent-amber text-accent-amber hover:bg-accent-amber hover:text-void-black" onClick={(e) => { e.stopPropagation(); onEscalate(order.id); }}>
                    <AlertTriangle size={18} className="mr-2" /> ESCALATE
                  </Button>
                  <Button variant="primary" className="flex-[2] h-12 text-sm bg-green-500 hover:bg-green-400 text-void-black" onClick={(e) => { e.stopPropagation(); onMarkCleared(order.id); }}>
                    <CheckCircle2 size={18} className="mr-2" /> MARK CLEARED
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
