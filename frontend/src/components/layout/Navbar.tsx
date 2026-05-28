import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-16 md:h-[72px] transition-all duration-300',
          'bg-surface-elevated/80 backdrop-blur-[16px]',
          scrolled ? 'border-b border-border-glow' : 'border-b border-transparent'
        )}
      >
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-cyan" strokeWidth="2">
                <polygon points="12 2 22 12 12 22 2 12 12 2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] font-black uppercase text-text-primary tracking-wide text-glow-cyan">EmergiSync</span>
            </div>
          </Link>

          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center gap-8">
            {['How It Works', 'The Network', 'Why It Matters', 'Developer'].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase().replace(/\s+/g, '-'))}
                className="text-[15px] text-text-secondary hover:text-text-primary transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-accent-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </button>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping-slow relative">
                <div className="absolute inset-0 rounded-full bg-green-500"></div>
              </div>
              <span className="text-[14px] uppercase tracking-wide-08 text-text-muted font-medium">System Operational</span>
            </div>
            <Link to="/login">
              <Button variant="primary">Enter Operations</Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-void-black pt-[72px]">
          <div className="flex flex-col items-center justify-center h-full gap-8 pb-20">
            {['How It Works', 'The Network', 'Why It Matters', 'Developer'].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase().replace(/\s+/g, '-'))}
                className="text-2xl font-bold text-text-primary hover:text-accent-cyan"
              >
                {item}
              </button>
            ))}
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="mt-8">
              <Button variant="primary" size="lg" className="w-full">Enter Operations</Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
