import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Book, Mail } from 'lucide-react';

export const Developer = () => {
  return (
    <section id="developer" className="bg-surface-elevated py-[60px] md:py-[120px]">
      <div className="max-w-[720px] mx-auto px-6 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-[14px] font-medium uppercase tracking-wide-08 text-text-muted block mb-4">
            DEVELOPER
          </span>
          <h2 className="text-[32px] md:text-[40px] font-bold tracking-tighter-01 text-text-primary mb-6">
            Built with Purpose.
          </h2>
          <p className="text-[18px] text-text-secondary leading-1.7 mb-12">
            This platform was designed and developed as a mission-critical emergency response system. Every UI decision prioritizes clarity under pressure. Every architectural choice prioritizes data integrity and real-time synchronization. If you're building something similar — or want to understand the thinking behind this — let's connect.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <motion.a
            href="https://portfolio.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-3 px-6 py-4 rounded-large border border-border-glow bg-void-black hover:border-accent-cyan transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-cyan w-full md:w-auto justify-center group"
          >
            <span className="text-[16px] font-medium text-text-primary group-hover:text-accent-cyan transition-colors">View Portfolio</span>
            <ExternalLink size={18} className="text-text-muted group-hover:text-accent-cyan transition-colors" />
          </motion.a>

          <motion.a
            href="https://docs.responsemesh.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3 px-6 py-4 rounded-large border border-border-glow bg-void-black hover:border-accent-cyan transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-cyan w-full md:w-auto justify-center group"
          >
            <span className="text-[16px] font-medium text-text-primary group-hover:text-accent-cyan transition-colors">Read System Docs</span>
            <Book size={18} className="text-text-muted group-hover:text-accent-cyan transition-colors" />
          </motion.a>

          <motion.a
            href="mailto:contact@responsemesh.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-3 px-6 py-4 rounded-large border border-border-glow bg-void-black hover:border-accent-cyan transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-cyan w-full md:w-auto justify-center group"
          >
            <span className="text-[16px] font-medium text-text-primary group-hover:text-accent-cyan transition-colors">Contact</span>
            <Mail size={18} className="text-text-muted group-hover:text-accent-cyan transition-colors" />
          </motion.a>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <p className="text-[14px] text-text-muted">
            © 2026 Response Mesh. Built for emergency systems.
          </p>
        </motion.div>

      </div>
    </section>
  );
};
