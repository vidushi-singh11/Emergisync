import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // Validate Role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) throw new Error("Profile not found.");
      
      if (profile.role !== formData.role) {
        await supabase.auth.signOut();
        throw new Error(`This account is not registered as ${formData.role}.`);
      }

      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error("Account access suspended. Contact Control Room.");
      }

      // Success - Redirect to the role-based dashboard router
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Authentication failed. Check credentials and role.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,transparent_70%)]" />
      
      {/* Subtle animated mesh (low opacity) */}
      <div className="absolute inset-0 z-0 opacity-5 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 animate-mesh-shift" style={{ animationDuration: '40s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-full max-w-[440px] bg-surface-elevated border border-border-glow rounded-large shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-8 z-10",
          error && "animate-shake"
        )}
      >
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[13px] text-text-muted hover:text-accent-cyan transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          BACK TO LANDING
        </Link>

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 relative flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-cyan" strokeWidth="2">
              <polygon points="12 2 22 12 12 22 2 12 12 2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">OPERATIONS ACCESS</h1>
          <p className="text-[14px] text-text-secondary mt-2">Secure entry for authorized personnel only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            label="EMAIL ADDRESS" 
            placeholder="personnel@agency.gov" 
            type="email" 
            required 
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="relative">
            <Input 
              label="PASSWORD" 
              placeholder="••••••••" 
              type={showPassword ? "text" : "password"} 
              required 
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[42px] text-text-muted hover:text-accent-cyan transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Select 
            label="ACCESS ROLE" 
            required 
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="" disabled>Select your operational role</option>
            <option value="ambulance">Ambulance Driver</option>
            <option value="police">Police Unit</option>
            <option value="hospital">Hospital Admin</option>
            <option value="control">Control Room Operator</option>
          </Select>

          {error && (
            <div className="p-3 rounded-lg bg-accent-crimson/10 border border-accent-crimson/20 text-accent-crimson text-[13px] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-void-black animate-pulse" />
                <span>VERIFYING...</span>
              </div>
            ) : (
              "AUTHENTICATE"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/register" className="text-[14px] text-text-secondary hover:text-accent-cyan transition-colors">
            New personnel? Request access →
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
