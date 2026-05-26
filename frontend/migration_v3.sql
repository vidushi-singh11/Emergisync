-- ==========================================
-- EMERGISYNC MIGRATION V3
-- Ambulance ↔ Hospital Bidirectional Handoff
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Add patient preview fields to trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS age_group TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS special_needs TEXT[] DEFAULT '{}';
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS driver_note TEXT;

-- 2. Add hospital response fields to trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS bay_note TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS ack_time TIMESTAMPTZ;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ;

-- 3. Add diversion toggle to hospital profiles
ALTER TABLE public.hospital_profiles ADD COLUMN IF NOT EXISTS is_diversion BOOLEAN DEFAULT false;

-- 4. Add ICU capacity tracking to hospital profiles
ALTER TABLE public.hospital_profiles ADD COLUMN IF NOT EXISTS capacity_icu_total INTEGER DEFAULT 0;
ALTER TABLE public.hospital_profiles ADD COLUMN IF NOT EXISTS capacity_icu_available INTEGER DEFAULT 0;

-- 5. Ensure hospital_profiles is in realtime publication (idempotent)
-- Already added in v2 schema, but safe to re-run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'hospital_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_profiles;
  END IF;
END $$;
