-- ==========================================
-- EMERGISYNC MIGRATION V7
-- Panic SOS Real-Time Police Dispatch & Security Guarding
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Extend public.ambulance_units table with SOS lifecycle columns
ALTER TABLE public.ambulance_units ADD COLUMN IF NOT EXISTS sos_status TEXT CHECK (sos_status IN ('active', 'acknowledged', 'police_dispatched', 'police_arrived', 'resolved'));
ALTER TABLE public.ambulance_units ADD COLUMN IF NOT EXISTS sos_assigned_police_id UUID REFERENCES public.police_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.ambulance_units ADD COLUMN IF NOT EXISTS sos_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Configure RLS updates so police officers and control room can update SOS status
DROP POLICY IF EXISTS "Police Officer Update Ambulance SOS" ON public.ambulance_units;
CREATE POLICY "Police Officer Update Ambulance SOS" 
ON public.ambulance_units FOR UPDATE 
USING (true)
WITH CHECK (true);
