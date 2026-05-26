import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

const techStack = [
  { id: 'react', title: 'React + Vite', desc: 'Component-based frontend with role-gated routing.', color: 'cyan' },
  { id: 'node', title: 'Node.js', desc: 'Business logic engine and AI scoring services.', color: 'violet' },
  { id: 'supabase', title: 'Supabase', desc: 'Realtime database, auth, and RLS policies.', color: 'amber' },
  { id: 'maps', title: 'Map SDK', desc: 'Dark-themed tactical navigation and junction visualization.', color: 'crimson' },
];

export const Architecture = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="bg-void-black py-[60px] md:py-[120px]">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Content */}
        <div>
          <span className="text-[14px] font-medium uppercase tracking-wide-08 text-accent-cyan block mb-4">
            ARCHITECTURE
          </span>
          <h2 className="text-[36px] md:text-[48px] font-bold tracking-tighter-01 text-text-primary mb-6 leading-tight">
            React. Node. Supabase. Realtime.
          </h2>
          <p className="text-[18px] text-text-secondary leading-1.7 mb-10 max-w-[500px]">
            Built on a modern stack designed for live data. React delivers role-specific dashboard trees. Node handles complex business logic — route optimization, conflict detection, priority scoring. Supabase provides the realtime PostgreSQL backbone with Row Level Security ensuring each role sees only what they are authorized to see.
          </p>

          <div className="flex flex-col gap-6">
            {techStack.map((tech) => (
              <div 
                key={tech.id}
                className="flex flex-col transition-opacity duration-300"
                style={{ opacity: hovered && hovered !== tech.id ? 0.4 : 1 }}
                onMouseEnter={() => setHovered(tech.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={cn("w-2 h-2 rounded-full", {
                    'bg-accent-cyan': tech.color === 'cyan',
                    'bg-accent-violet': tech.color === 'violet',
                    'bg-accent-amber': tech.color === 'amber',
                    'bg-accent-crimson': tech.color === 'crimson',
                  })} />
                  <span className="text-[18px] font-bold text-text-primary">{tech.title}</span>
                </div>
                <span className="text-[16px] text-text-muted ml-5">{tech.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content (Diagram) */}
        <div className="hidden lg:flex flex-col items-center justify-center relative">
          
          <div className="relative w-full max-w-[400px] flex flex-col gap-8">
            {/* Frontend Block */}
            <div className="bg-surface-elevated border-2 border-accent-cyan/30 rounded-xl p-6 relative z-10 text-center shadow-[0_0_30px_rgba(0,240,255,0.1)]">
              <span className="text-accent-cyan font-bold text-[18px]">React Frontend</span>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-border-glow">
                <div className="w-[2px] h-3 bg-accent-cyan animate-pulse"></div>
              </div>
              <Badge variant="cyan" className="absolute -top-3 -right-6 bg-void-black text-[12px]">WebSocket</Badge>
            </div>

            {/* API Block */}
            <div className="bg-surface-elevated border-2 border-accent-violet/30 rounded-xl p-6 relative z-10 text-center shadow-[0_0_30px_rgba(139,92,246,0.1)]">
              <span className="text-accent-violet font-bold text-[18px]">Node API</span>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-border-glow">
                <div className="w-[2px] h-3 bg-accent-violet animate-pulse"></div>
              </div>
              <Badge variant="violet" className="absolute top-1/2 -translate-y-1/2 -left-10 bg-void-black text-[12px]">JWT</Badge>
            </div>

            {/* Supabase Block */}
            <div className="bg-surface-elevated border-2 border-accent-amber/30 rounded-xl p-6 relative z-10 text-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <span className="text-accent-amber font-bold text-[18px]">Supabase Realtime</span>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-border-glow">
                <div className="w-[2px] h-3 bg-accent-amber animate-pulse"></div>
              </div>
              <Badge variant="amber" className="absolute top-1/2 -translate-y-1/2 -right-8 bg-void-black text-[12px]">RLS</Badge>
            </div>

            {/* Database Block */}
            <div className="bg-surface-elevated border-2 border-accent-crimson/30 rounded-xl p-6 relative z-10 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
              <span className="text-accent-crimson font-bold text-[18px]">PostgreSQL</span>
              <Badge variant="crimson" className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-void-black text-[12px]">GeoJSON</Badge>
            </div>
            
          </div>

        </div>

      </div>
    </section>
  );
};
