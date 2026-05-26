-- ==========================================
-- EMERGISYNC MIGRATION V6
-- Real-time Bridge Connectivity & Functional Mesh
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add command columns to public.trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS requested_hospital_id UUID REFERENCES public.hospital_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS nudge_sent BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS is_bypass BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS escalation_triggered BOOLEAN NOT NULL DEFAULT false;

-- 2. Add telemetry & control columns to public.ambulance_units table
ALTER TABLE public.ambulance_units ADD COLUMN IF NOT EXISTS is_sos BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.ambulance_units ADD COLUMN IF NOT EXISTS pinged_at TIMESTAMPTZ;

-- 3. Create the emergency broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on broadcasts table
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for broadcasts table
DROP POLICY IF EXISTS "Anyone can read broadcasts" ON public.broadcasts;
CREATE POLICY "Anyone can read broadcasts" 
ON public.broadcasts FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Control Room can write broadcasts" ON public.broadcasts;
CREATE POLICY "Control Room can write broadcasts" 
ON public.broadcasts FOR INSERT 
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'control');

-- 6. Add RLS Policies for ambulance_units table (currently has none!)
DROP POLICY IF EXISTS "Ambulance Driver Manage Own Unit" ON public.ambulance_units;
CREATE POLICY "Ambulance Driver Manage Own Unit" 
ON public.ambulance_units FOR ALL 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can read ambulance units" ON public.ambulance_units;
CREATE POLICY "Anyone can read ambulance units" 
ON public.ambulance_units FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Control Room Manage All Units" ON public.ambulance_units;
CREATE POLICY "Control Room Manage All Units" 
ON public.ambulance_units FOR UPDATE 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'control');

-- 7. Add broadcasts table to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'broadcasts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
  END IF;
END $$;

-- 8. Extend public.police_profiles with telemetry & online status
ALTER TABLE public.police_profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.police_profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.police_profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false;

-- 9. Add RLS Policies for police_profiles table (currently only has Police Self)
DROP POLICY IF EXISTS "Anyone can read police profiles" ON public.police_profiles;
CREATE POLICY "Anyone can read police profiles" 
ON public.police_profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Control Room Manage All Police" ON public.police_profiles;
CREATE POLICY "Control Room Manage All Police" 
ON public.police_profiles FOR ALL 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'control');

-- 10. Add RLS Policies for police_clearances table (currently has none!)
DROP POLICY IF EXISTS "Anyone can read police clearances" ON public.police_clearances;
CREATE POLICY "Anyone can read police clearances" 
ON public.police_clearances FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Police Officer Manage Own Clearances" ON public.police_clearances;
CREATE POLICY "Police Officer Manage Own Clearances" 
ON public.police_clearances FOR ALL 
USING (police_unit_id = auth.uid());

DROP POLICY IF EXISTS "Control Room Manage All Clearances" ON public.police_clearances;
CREATE POLICY "Control Room Manage All Clearances" 
ON public.police_clearances FOR ALL 
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'control');

-- 11. Add police_profiles to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'police_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.police_profiles;
  END IF;
END $$;

-- 12. Add police_clearances to Realtime publication if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'police_clearances'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.police_clearances;
  END IF;
END $$;

