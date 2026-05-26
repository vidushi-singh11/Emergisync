-- ==========================================
-- EMERGISYNC MIGRATION V5
-- Fix: Add staff_count to hospital profiles for active staff tracking
-- Run this in your Supabase SQL Editor
-- ==========================================

ALTER TABLE public.hospital_profiles ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 0;
