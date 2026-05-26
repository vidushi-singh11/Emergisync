import React, { useState, useEffect } from 'react';
import { Settings, Bell, LogOut, Radio, Shield, Activity, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { LiveOperations } from '../../components/control/LiveOperations';
import { PoliceCoordination } from '../../components/control/PoliceCoordination';
import { HospitalCoordination } from '../../components/control/HospitalCoordination';

type Tab = 'live_ops' | 'police' | 'hospital';

export const ControlDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('live_ops');
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }) + ' GMT');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col h-screen bg-void-black text-text-primary overflow-hidden">
      {/* GLOBAL TOP BAR */}
      <div className="h-16 border-b border-border-glow bg-surface-primary flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-violet/10 flex items-center justify-center text-accent-violet border border-accent-violet/20">
              <Radio size={18} />
            </div>
            <span className="font-bold tracking-tight text-text-primary uppercase">STRATEGIC COMMAND</span>
          </div>

          <div className="h-6 w-[1px] bg-border-glow" />

          {/* Tab Switcher */}
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('live_ops')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'live_ops' ? "bg-accent-violet text-void-black" : "bg-transparent text-text-muted hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <Radio size={14} /> Live Ops
            </button>
            <button 
              onClick={() => setActiveTab('police')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'police' ? "bg-accent-amber text-void-black" : "bg-transparent text-text-muted hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <Shield size={14} /> Police Coord
            </button>
            <button 
              onClick={() => setActiveTab('hospital')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'hospital' ? "bg-accent-crimson text-void-black" : "bg-transparent text-text-muted hover:bg-surface-elevated hover:text-text-primary"
              )}
            >
              <Activity size={14} /> Hospital Coord
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-accent-violet/10 text-accent-violet border border-accent-violet/30">
            ROLE: CONTROL ROOM
          </span>
          <button className="relative p-2 text-text-muted hover:text-text-primary transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-crimson animate-pulse" />
          </button>
          <button className="p-2 text-text-muted hover:text-text-primary transition-colors">
            <Settings size={18} />
          </button>
          <div className="h-4 w-[1px] bg-border-glow mx-2" />
          <button onClick={handleLogout} className="p-2 text-text-muted hover:text-accent-crimson transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'live_ops' && <LiveOperations />}
        {activeTab === 'police' && <PoliceCoordination />}
        {activeTab === 'hospital' && <HospitalCoordination />}
      </div>

      {/* GLOBAL BOTTOM STATUS BAR */}
      <div className="h-8 border-t border-border-glow bg-surface-primary flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Wifi size={12} className="text-accent-cyan animate-pulse" />
            <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-widest">SYSTEM SYNC: ACTIVE</span>
          </div>
          <span className="text-[10px] text-text-muted font-mono">LATENCY: 42ms</span>
        </div>
        <span className="text-[10px] font-mono text-text-primary tracking-widest">{time}</span>
      </div>
    </div>
  );
};
