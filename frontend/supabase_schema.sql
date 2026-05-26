-- ==========================================
-- EMERGENCY MESH: FOUNDATIONAL SCHEMA
-- ==========================================

-- 1. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.ambulance_profiles CASCADE;
DROP TABLE IF EXISTS public.police_profiles CASCADE;
DROP TABLE IF EXISTS public.hospital_profiles CASCADE;
DROP TABLE IF EXISTS public.control_room_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS profile_status;

-- 2. TYPE DEFINITIONS
-- Enums provide strict validation at the database level
CREATE TYPE user_role AS ENUM ('ambulance', 'police', 'hospital', 'control');
CREATE TYPE profile_status AS ENUM ('pending_verification', 'pending_approval', 'active', 'suspended');

-- 3. CORE IDENTITY TABLE
-- Links 1:1 with Supabase Auth users
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  organization_id TEXT, -- ID of the hospital/precinct/fleet
  status profile_status DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TACTICAL ROLE TABLES (Satellite tables)
-- We use separate tables to keep the main profiles table lean and performant.

CREATE TABLE public.ambulance_profiles (
  id UUID REFERENCES public.profiles ON DELETE CASCADE PRIMARY KEY,
  unit_id TEXT NOT NULL UNIQUE,
  vehicle_reg TEXT NOT NULL,
  vehicle_type TEXT NOT NULL, -- e.g. bls, als
  equipment TEXT[] DEFAULT '{}',
  license_number TEXT NOT NULL,
  emergency_contact TEXT NOT NULL,
  gps_consent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.police_profiles (
  id UUID REFERENCES public.profiles ON DELETE CASCADE PRIMARY KEY,
  unit_id TEXT NOT NULL UNIQUE,
  badge_number TEXT NOT NULL,
  rank TEXT NOT NULL,
  assigned_junctions TEXT[] DEFAULT '{}',
  clearance_consent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.hospital_profiles (
  id UUID REFERENCES public.profiles ON DELETE CASCADE PRIMARY KEY,
  staff_role TEXT NOT NULL,
  trauma_level TEXT NOT NULL,
  capacity_er_total INTEGER NOT NULL DEFAULT 0,
  capacity_er_available INTEGER NOT NULL DEFAULT 0,
  emergency_line TEXT NOT NULL,
  capacity_consent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE public.control_room_profiles (
  id UUID REFERENCES public.profiles ON DELETE CASCADE PRIMARY KEY,
  callsign TEXT NOT NULL UNIQUE,
  supervisor_code TEXT NOT NULL, 
  department TEXT NOT NULL,
  clearance_level INTEGER NOT NULL DEFAULT 1,
  audit_consent BOOLEAN NOT NULL DEFAULT FALSE
);

-- 5. ROW LEVEL SECURITY (RLS)
-- Deny by default, then open specifically.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.police_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_room_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read and update their own data
CREATE POLICY "Users can manage own identity" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Policy: Allow the Trigger to insert profiles (very important for signup)
-- Note: Trigger runs as postgres, but this is a safety fallback.
CREATE POLICY "Internal service insert" ON public.profiles 
  FOR INSERT WITH CHECK (true);

-- Tactical table self-management
CREATE POLICY "Ambulance self access" ON public.ambulance_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Police self access" ON public.police_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Hospital self access" ON public.hospital_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Control self access" ON public.control_room_profiles FOR ALL USING (auth.uid() = id);

-- 6. THE ROBUST SIGNUP TRIGGER
-- This handles the automated bridge between Auth.users and Public.profiles.
-- It is designed to be SILENT and NON-BLOCKING (never crashes your signup).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  target_role user_role;
BEGIN
  -- Safe casting of the role enum
  BEGIN
    target_role := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    target_role := 'ambulance'::user_role; -- Default fallback
  END;

  INSERT INTO public.profiles (
    id, 
    role, 
    full_name, 
    phone, 
    employee_id, 
    organization_id
  )
  VALUES (
    NEW.id,
    target_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'System User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '000'),
    COALESCE(NEW.raw_user_meta_data->>'employee_id', 'PENDING'),
    NEW.raw_user_meta_data->>'organization_id'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Logs error to Postgres logs but ALLOWS the signup to continue.
  -- This prevents the "Database error saving new user" message.
  RAISE LOG 'Profile creation failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Bind the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. PERMISSIONS
-- Grants the postgres user (trigger executor) power over the identity flow
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON TYPE public.user_role TO postgres, anon, authenticated, service_role;
GRANT USAGE ON TYPE public.profile_status TO postgres, anon, authenticated, service_role;
