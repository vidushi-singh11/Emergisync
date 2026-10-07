import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShieldAlert, BadgeInfo, Cross } from 'lucide-react';
import { cn } from '../../lib/utils';

const steps = [
  {
    num: '01',
    icon: Truck,
    title: 'Ambulance Initiates',
    body: 'The driver files patient details, condition severity, and selects the nearest capable hospital. The system instantly generates an optimized route and broadcasts the trip to the control mesh.',
    accent: 'cyan'
  },
  {
    num: '02',
    icon: ShieldAlert,
    title: 'Control Room Orchestrates',
    body: 'AI calculates priority scores, detects route conflicts, and assigns police units to clear junctions. The operator maintains full override authority at every decision point.',
    accent: 'amber'
  },
  {
    num: '03',
    icon: BadgeInfo,
    title: 'Police Clears Corridors',
    body: 'Assigned officers receive junction-specific clearance orders with live ETA countdowns. Traffic corridors are secured before the ambulance approaches — not after.',
    accent: 'amber'
  },
  {
    num: '04',
    icon: Cross,
    title: 'Hospital Prepares Handoff',
    body: 'The destination hospital sees incoming patient details, acknowledges readiness, and prepares ER resources. The control room confirms the chain is unbroken.',
    accent: 'crimson'
  }
];

export const Lifecycle = () => {
  return (
    <section id="how-it-works" className="bg-surface-primary py-[60px] md:py-[120px]">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative">
        
        {/* Left Column (Sticky) */}
        <div className="lg:col-span-5 relative">
          <div className="lg:sticky lg:top-[120px]">
            <span className="text-[14px] font-medium uppercase tracking-wide-08 text-accent-amber block mb-4">
              THE WORKFLOW
            </span>
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-tighter-01 text-text-primary mb-6 leading-tight">
              Four Entities.<br />One Unified Flow.
            </h2>
            <p className="text-[18px] text-text-secondary max-w-[360px] leading-1.7">
              From the moment an ambulance is dispatched to the second a patient reaches prepared hands — every action is synchronized, monitored, and optimized by the control mesh.
            </p>
          </div>
        </div>

        {/* Right Column (Scrolling Steps) */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          {steps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="relative"
            >
              {/* Connecting Line (except last) */}
              {idx < steps.length - 1 && (
                <div className="absolute left-[38px] top-[100px] bottom-[-40px] w-[2px] border-l-2 border-dotted border-border-glow hidden md:block">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-border-glow animate-pulse"></div>
                </div>
              )}

              <div className="bg-surface-elevated border border-border-glow rounded-large p-6 md:p-10 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-400">
                {/* Visual Accent Line */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity",
                  {
                    'bg-accent-cyan': step.accent === 'cyan',
                    'bg-accent-amber': step.accent === 'amber',
                    'bg-accent-crimson': step.accent === 'crimson',
                  }
                )} />

                <div className="flex-shrink-0">
                  <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-2">
                    <span className={cn("font-mono text-[32px] md:text-[48px] opacity-30", {
                      'text-accent-cyan': step.accent === 'cyan',
                      'text-accent-amber': step.accent === 'amber',
                      'text-accent-crimson': step.accent === 'crimson',
                    })}>
                      {step.num}
                    </span>
                    <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center bg-void-black", {
                      'border-accent-cyan text-accent-cyan': step.accent === 'cyan',
                      'border-accent-amber text-accent-amber': step.accent === 'amber',
                      'border-accent-crimson text-accent-crimson': step.accent === 'crimson',
                    })}>
                      <step.icon size={24} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[24px] font-semibold text-text-primary mb-3">{step.title}</h3>
                  <p className="text-[18px] text-text-secondary leading-1.7">{step.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
