import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AmbulanceDashboard } from '../../pages/dashboards/AmbulanceDashboard';
import { PoliceDashboard } from '../../pages/dashboards/PoliceDashboard';
import { HospitalDashboard } from '../../pages/dashboards/HospitalDashboard';
import { ControlDashboard } from '../../pages/dashboards/ControlDashboard';

export const DashboardRouter = () => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setUserRole(profile?.role || null);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (!session) setUserRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  switch (userRole) {
    case 'ambulance':
      return <AmbulanceDashboard />;
    case 'police':
      return <PoliceDashboard />;
    case 'hospital':
      return <HospitalDashboard />;
    case 'control':
      return <ControlDashboard />;
    default:
      return (
        <div className="min-h-screen bg-void-black flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-2xl font-bold mb-4">Access Pending</h1>
          <p className="text-text-secondary max-w-md">Your operational profile is being verified. You will be granted access once an administrator approves your credentials.</p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="mt-8 text-accent-cyan hover:underline"
          >
            Sign Out
          </button>
        </div>
      );
  }
};
