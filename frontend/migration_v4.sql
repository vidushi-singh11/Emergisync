-- ==========================================
-- EMERGISYNC MIGRATION V4
-- Fix: Expose Hospital Profile Names to Ambulance Drivers
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Allow all authenticated users (Ambulance Drivers, Police, etc.) to view hospital base profile details (like facility names)
-- This fixes the "Unknown Hospital" issue by granting SELECT access specifically to hospital profiles.
CREATE POLICY "Public Read Hospital Profiles Base" 
ON public.profiles 
FOR SELECT 
USING (role = 'hospital');
