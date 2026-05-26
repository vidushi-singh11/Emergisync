import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Network as NetworkIcon, Activity, Radar } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

const cards = [
  {
    title: 'Ambulance Driver Portal',
    desc: 'Mobile-first dispatch interface with one-touch trip management, live GPS navigation, and automated hospital discovery. Optimized for high-stress, single-hand operation.',
    icon: Navigation,
    accent: 'cyan',
    tags: ['Auto-Routing', 'Patient Logging', 'Live ETA']
  },
  {
    title: 'Police Coordination Portal',
    desc: 'Junction-level clearance commands with real-time ambulance approach vectors. Officers receive precise location and timing data — no operational noise, only actionable orders.',
    icon: NetworkIcon,
    accent: 'amber',
    tags: ['Junction Lock', 'ACK/Clear Flow', 'Conflict Alerts']
  },
  {
    title: 'Hospital Intake Portal',
    desc: 'Live ER capacity monitoring, incoming arrival tracking, and diversion status management. Hospitals confirm readiness before the ambulance reaches the bay.',
    icon: Activity,
    accent: 'crimson',
    tags: ['Bed Tracking', 'ACK Handoff', 'Diversion Control']
  },
  {
    title: 'Command Center',
    desc: 'God-view of all active operations. AI-assisted conflict resolution, priority scoring, cross-agency escalation management, and full audit logging.',
    icon: Radar,
    accent: 'violet',
    tags: ['Conflict AI', 'Priority Scoring', 'Full Oversight']
  }
];

export const Network = () => {
  return (
    <section id="the-network" className="bg-void-black py-[60px] md:py-[120px]">
      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Title Area */}
        <div className="text-center max-w-[640px] mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[14px] font-medium uppercase tracking-wide-08 text-accent-cyan block mb-4">
              THE NETWORK
            </span>
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-tighter-01 text-text-primary mb-6 leading-tight">
              Built for the Field.<br />Designed for Command.
            </h2>
            <p className="text-[18px] text-text-secondary leading-1.7">
              Four specialized portals, one shared operational truth. No interface overlaps — each role sees exactly what they need to act.
            </p>
          </motion.div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={cn(
                "group bg-surface-elevated border border-border-glow rounded-large p-6 md:p-10 transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(0,0,0,0.4)] relative overflow-hidden",
                {
                  'hover:border-accent-cyan': card.accent === 'cyan',
                  'hover:border-accent-amber': card.accent === 'amber',
                  'hover:border-accent-crimson': card.accent === 'crimson',
                  'hover:border-accent-violet': card.accent === 'violet',
                }
              )}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border bg-void-black", {
                  'border-accent-cyan text-accent-cyan': card.accent === 'cyan',
                  'border-accent-amber text-accent-amber': card.accent === 'amber',
                  'border-accent-crimson text-accent-crimson': card.accent === 'crimson',
                  'border-accent-violet text-accent-violet': card.accent === 'violet',
                })}>
                  <card.icon size={32} />
                </div>

                <h3 className="text-[24px] font-semibold text-text-primary mb-4">{card.title}</h3>
                <p className="text-[18px] text-text-secondary leading-1.7 mb-8 flex-1">{card.desc}</p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {card.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-text-muted border-border-glow bg-void-black">{tag}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
