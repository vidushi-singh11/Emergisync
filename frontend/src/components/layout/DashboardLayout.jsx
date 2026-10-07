 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';








export const DashboardLayout = ({ title, role, children, accentColor }) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState('Personnel');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (_optionalChain([user, 'optionalAccess', _ => _.user_metadata, 'optionalAccess', _2 => _2.full_name])) {
        setUserName(user.user_metadata.full_name);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-void-black text-text-primary flex flex-col">
      {/* Dashboard Header */}
      <header className="h-16 border-b border-border-glow bg-surface-elevated/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", accentColor)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2">
                <polygon points="12 2 22 12 12 22 2 12 12 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{title}</h1>
              <p className="text-[12px] text-text-muted uppercase tracking-widest font-medium">{role} Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-text-muted hover:text-text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-crimson rounded-full border-2 border-surface-elevated"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1 pl-3 rounded-full border border-border-glow hover:border-text-muted transition-all bg-surface-primary"
              >
                <span className="text-sm font-medium hidden md:block">{userName}</span>
                <div className="w-8 h-8 rounded-full bg-border-glow flex items-center justify-center text-text-secondary">
                  <User size={18} />
                </div>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-surface-elevated border border-border-glow rounded-xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-border-glow">
                      <p className="text-sm font-bold">{userName}</p>
                      <p className="text-[12px] text-text-muted truncate">ID: {role.toUpperCase()}-MESH-2026</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-primary hover:text-text-primary transition-colors">
                      <User size={16} /> Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-primary hover:text-text-primary transition-colors">
                      <Settings size={16} /> Preferences
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-accent-crimson hover:bg-accent-crimson/10 transition-colors mt-1 border-t border-border-glow pt-3"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full p-6">
        {children}
      </main>
    </div>
  );
};
