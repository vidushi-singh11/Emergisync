import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';

export const Hero = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-void-black">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 opacity-15 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 animate-mesh-shift" />
      <div className="absolute inset-0 z-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]" />
      
      {/* Network Nodes Simulation (CSS/Divs) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-accent-cyan rounded-full opacity-50"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            animate={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight 
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="max-w-[1280px] mx-auto w-full px-6 z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col items-start">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Badge variant="cyan" className="mb-6">Emergency Coordination Platform</Badge>
          </motion.div>

          <h1 className="text-[48px] lg:text-[72px] font-extrabold leading-1.1 tracking-tighter-02 text-text-primary mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              ZERO LATENCY
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-transparent bg-clip-text bg-gradient-to-b from-accent-cyan to-accent-cyan/30 text-glow-cyan"
            >
              EMERGENCY MESH
            </motion.div>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-[20px] text-text-secondary max-w-[560px] leading-1.7 mb-10"
          >
            Connecting ambulance drivers, police units, hospitals, and command centers in a single live operational network. Every second matters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full">
                ENTER LIVE OPERATIONS
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => scrollTo('how-it-works')}>
              SEE HOW IT WORKS
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-4"
          >
            <button onClick={() => scrollTo('developer')} className="text-[14px] text-text-muted hover:text-text-primary transition-colors">
              Are you a developer? View Documentation →
            </button>
          </motion.div>
        </div>

        {/* Right Visual (Desktop Only) */}
        <div className="hidden lg:block relative perspective-1000">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
            className="relative transform rotate-y-[-5deg] rotate-x-[5deg] bg-surface-elevated border border-border-glow rounded-large shadow-[0_24px_64px_rgba(0,0,0,0.6)] p-6 aspect-[4/3]"
          >
            {/* Mock Dashboard UI */}
            <div className="w-full h-full flex flex-col gap-4 opacity-50 blur-[1px]">
              <div className="flex justify-between items-center border-b border-border-glow pb-4">
                <div className="w-32 h-6 bg-border-glow rounded"></div>
                <div className="w-16 h-6 bg-accent-cyan/20 rounded"></div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-void-black rounded-lg border border-border-glow relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#1e1e33_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>
                <div className="col-span-1 flex flex-col gap-4">
                  <div className="h-24 bg-void-black border border-border-glow rounded-lg"></div>
                  <div className="h-24 bg-void-black border border-border-glow rounded-lg"></div>
                  <div className="flex-1 bg-void-black border border-border-glow rounded-lg"></div>
                </div>
              </div>
            </div>
            
            {/* Floating Badges */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6"
            >
              <Badge variant="cyan" className="shadow-glow-cyan bg-void-black">LIVE: 14 UNITS</Badge>
            </motion.div>
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-1/2 -left-12"
            >
              <Badge variant="outline" className="bg-void-black text-accent-amber border-accent-amber/50">SYSTEM SYNC: ACTIVE</Badge>
            </motion.div>

            {/* Radar effect */}
            <div className="absolute bottom-10 right-10">
              <div className="w-3 h-3 rounded-full bg-accent-cyan animate-pulse-radar relative">
                <div className="absolute inset-0 rounded-full bg-accent-cyan animate-ping-slow"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-[14px] uppercase tracking-wide-08 text-text-muted font-medium">SCROLL TO EXPLORE</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-text-muted to-transparent"></div>
      </motion.div>
    </section>
  );
};
