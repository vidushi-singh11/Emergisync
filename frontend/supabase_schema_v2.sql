-- ==========================================
-- EMERGENCY MESH DATABASE SCHEMA V2 (SUPABASE)
-- End-to-End Trip Lifecycle Implementation
-- ==========================================

-- 1. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop functions first
DROP FUNCTION IF EXISTS public.log_trip_change() CASCADE;
DROP FUNCTION IF EXISTS public.set_current_timestamp_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop tables (Cascade handles foreign keys)
DROP TABLE IF EXISTS public.trip_logs CASCADE;
DROP TABLE IF EXISTS public.police_clearances CASCADE;
DROP TABLE IF EXISTS public.ambulance_units CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.ambulance_profiles CASCADE;
DROP TABLE IF EXISTS public.police_profiles CASCADE;
DROP TABLE IF EXISTS public.hospital_profiles CASCADE;
DROP TABLE IF EXISTS public.control_room_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop Enums safely
DO $$ BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS profile_status CASCADE;
    DROP TYPE IF EXISTS trip_status CASCADE;
    DROP TYPE IF EXISTS trip_severity CASCADE;
    DROP TYPE IF EXISTS police_clearance_status CASCADE;
    DROP TYPE IF EXISTS hospital_er_status CASCADE;
    DROP TYPE IF EXISTS verification_status CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('ambulance', 'police', 'hospital', 'control');
CREATE TYPE profile_status AS ENUM ('pending_verification', 'pending_approval', 'active', 'suspended');
CREATE TYPE trip_status AS ENUM (
  'INITIATED', 'VERIFIED', 'DISPATCHED', 'EN_ROUTE', 
  'ARRIVED_AT_HOSPITAL', 'PATIENT_HANDOFF_COMPLETE', 'COMPLETED', 'CANCELLED'
);
CREATE TYPE trip_severity AS ENUM ('CRITICAL_L1', 'SEVERE_L2', 'MODERATE_L3', 'MINOR_L4');
CREATE TYPE police_clearance_status AS ENUM ('PENDING', 'SENT', 'ACKNOWLEDGED', 'CLEARED', 'ESCALATED', 'RELEASED');
CREATE TYPE hospital_er_status AS ENUM ('PENDING', 'PREPARING', 'READY', 'PROCESSING', 'RECEIVED');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'FLAGGED');

-- 3. IDENTITY & PROFILE TABLES

-- 3.1 Base Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  organization_id TEXT, 
  status profile_status DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Role-Specific Profiles
CREATE TABLE public.ambulance_profiles (
  id UUID REFERENCES public.profiles ON DELETE CASCADE PRIMARY KEY,
  unit_id TEXT NOT NULL UNIQUE,
  vehicle_reg TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
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
  capacity_icu_total INTEGER NOT NULL DEFAULT 0,
  capacity_icu_available INTEGER NOT NULL DEFAULT 0,
  emergency_line TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_diversion BOOLEAN NOT NULL DEFAULT FALSE,
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

-- 4. OPERATIONAL TABLES

-- 4.1 Trips (The Master Record)
CREATE TABLE public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_ref TEXT NOT NULL UNIQUE, 
  ambulance_id UUID REFERENCES public.ambulance_profiles(id) ON DELETE RESTRICT,
  hospital_id UUID REFERENCES public.hospital_profiles(id) ON DELETE RESTRICT,
  
  patient_name TEXT,
  condition TEXT NOT NULL,
  severity trip_severity NOT NULL DEFAULT 'MODERATE_L3',
  equipment_needed TEXT[] DEFAULT '{}',
  notes TEXT,
  
  priority_score INTEGER DEFAULT 0,
  status trip_status NOT NULL DEFAULT 'INITIATED',
  verification_status verification_status NOT NULL DEFAULT 'PENDING',
  er_status hospital_er_status NOT NULL DEFAULT 'PENDING',
  
  eta TEXT, 
  eta_seconds INTEGER,
  route_geometry JSONB, 

  -- Patient Preview
  age_group TEXT,
  special_needs TEXT[] DEFAULT '{}',
  driver_note TEXT,
  
  -- Hospital Response
  bay_note TEXT,
  ack_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Police Clearances (Junction Assignments)
CREATE TABLE public.police_clearances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  police_unit_id UUID REFERENCES public.police_profiles(id) ON DELETE RESTRICT,
  junction_id TEXT NOT NULL,
  status police_clearance_status NOT NULL DEFAULT 'PENDING',
  est_clearance_time TIMESTAMPTZ,
  actual_clearance_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Ambulance Units (High-Frequency GPS)
CREATE TABLE public.ambulance_units (
  id UUID REFERENCES public.ambulance_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  speed DOUBLE PRECISION DEFAULT 0,
  heading DOUBLE PRECISION DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  last_ping TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 Trip Logs (Immutable Audit Trail)
CREATE TABLE public.trip_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, 
  action_type TEXT NOT NULL, 
  old_state JSONB,
  new_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRIGGERS & FUNCTIONS

-- 5.1 Timestamp Auto-Update
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_police_clearances_updated_at BEFORE UPDATE ON public.police_clearances FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5.2 Immutable Audit Log
CREATE OR REPLACE FUNCTION public.log_trip_change()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    audit_action := 'TRIP_CREATED';
    INSERT INTO public.trip_logs (trip_id, actor_id, action_type, new_state)
    VALUES (NEW.id, auth.uid(), audit_action, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status <> OLD.status THEN audit_action := 'STATUS_CHANGED';
    ELSIF NEW.severity <> OLD.severity THEN audit_action := 'SEVERITY_CHANGED';
    ELSIF NEW.priority_score <> OLD.priority_score THEN audit_action := 'PRIORITY_SCORE_UPDATED';
    ELSE RETURN NEW;
    END IF;
    
    INSERT INTO public.trip_logs (trip_id, actor_id, action_type, old_state, new_state)
    VALUES (NEW.id, auth.uid(), audit_action, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_trip_change AFTER INSERT OR UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.log_trip_change();

-- 5.3 Auto-Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, role, full_name, phone, employee_id, organization_id, status)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'ambulance'::public.user_role),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'System User'),
        COALESCE(NEW.raw_user_meta_data->>'phone', '000'),
        COALESCE(NEW.raw_user_meta_data->>'employee_id', 'PENDING'),
        NEW.raw_user_meta_data->>'organization_id',
        'pending_verification'
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Profile creation failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS & SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.police_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_room_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.police_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Profile Policies
CREATE POLICY "Self Read/Update" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Control Room Read All Profiles" ON public.profiles FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'control');
CREATE POLICY "Ambulance Self" ON public.ambulance_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Police Self" ON public.police_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Hospital Self" ON public.hospital_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Control Self" ON public.control_room_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public Read Hospital Profiles" ON public.hospital_profiles FOR SELECT USING (true); -- Needed for Ambulance app

-- 6.2 Trip Policies
CREATE POLICY "Control Room All Trips" ON public.trips FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'control');
CREATE POLICY "Ambulance Manage Own Trips" ON public.trips FOR ALL USING (ambulance_id = auth.uid());
CREATE POLICY "Hospital Inbound Trips" ON public.trips FOR ALL USING (hospital_id = auth.uid());

-- 6.3 Realtime Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.police_clearances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_units;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_profiles;

-- 7. PERMISSIONS
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
