import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

const AnimatedNumber = ({ value, suffix = "", className }: { value: number, suffix?: string, className?: string }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 1500; // ms
      const incrementTime = 16; // 60fps
      const totalSteps = Math.round(duration / incrementTime);
      const stepValue = end / totalSteps;

      const timer = setInterval(() => {
        start += stepValue;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {displayValue}{suffix}
    </span>
  );
};

export const Problem = () => {
  return (
    <section id="why-it-matters" className="bg-surface-primary py-[60px] md:py-[120px]">
      <div className="max-w-[900px] mx-auto px-6 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[14px] font-medium uppercase tracking-wide-08 text-accent-crimson block mb-4">
            THE PROBLEM
          </span>
          <h2 className="text-[36px] md:text-[48px] font-bold tracking-tighter-01 text-text-primary mb-16 leading-tight">
            Fragmented Communication Costs Lives.
          </h2>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 mb-16 text-left md:text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col md:items-center"
          >
            <div className="font-mono text-[40px] md:text-[56px] text-accent-crimson mb-2 font-bold">
              <AnimatedNumber value={40} suffix="%" />
            </div>
            <div className="text-[16px] font-semibold text-text-primary mb-2">Time lost to coordination gaps.</div>
            <div className="text-[14px] text-text-muted leading-relaxed">
              Average delay between ambulance dispatch and hospital notification in traditional systems.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:items-center"
          >
            <div className="font-mono text-[40px] md:text-[56px] text-accent-amber mb-2 font-bold">
              <AnimatedNumber value={4} suffix="x" />
            </div>
            <div className="text-[16px] font-semibold text-text-primary mb-2">Agencies involved per trip.</div>
            <div className="text-[14px] text-text-muted leading-relaxed">
              Ambulance, police, hospital, and command — each using separate channels.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col md:items-center"
          >
            <div className="font-mono text-[40px] md:text-[56px] text-accent-cyan mb-2 font-bold">
              <AnimatedNumber value={0} />
            </div>
            <div className="text-[16px] font-semibold text-text-primary mb-2">Should be the latency.</div>
            <div className="text-[14px] text-text-muted leading-relaxed">
              Our target: zero-delay synchronization across all four operational nodes.
            </div>
          </motion.div>

        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-[18px] md:text-[20px] text-text-secondary leading-1.7 text-left md:text-center"
        >
          Emergency response isn't slow because people are slow. It's slow because the systems don't talk to each other. Response Mesh eliminates the gaps by creating a single live operational layer where every agency operates from the same truth.
        </motion.p>

        <div className="w-full h-[1px] bg-border-glow mt-16"></div>

      </div>
    </section>
  );
};
