import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-void-black border-t border-border-glow h-20">
      <div className="max-w-[1280px] mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 relative flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-text-muted" strokeWidth="2">
              <polygon points="12 2 22 12 12 22 2 12 12 2" />
            </svg>
          </div>
          <span className="text-[14px] uppercase tracking-wide-08 text-text-muted font-medium">Response Mesh</span>
        </div>

        {/* Center */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-radar relative">
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping-slow"></div>
          </div>
          <span className="text-[14px] uppercase tracking-wide-08 text-text-muted font-medium">System Status: Operational</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          <a href="#" className="text-[14px] text-text-muted hover:text-text-secondary transition-colors">Privacy</a>
          <a href="#" className="text-[14px] text-text-muted hover:text-text-secondary transition-colors">Terms</a>
          <Link to="/login" className="text-[14px] text-text-muted hover:text-text-secondary transition-colors">Operations Login</Link>
        </div>
      </div>
    </footer>
  );
};
