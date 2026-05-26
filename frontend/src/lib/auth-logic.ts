import { supabase } from './supabase';

// Role-Specific Validation Schemas (Strict)
export const validateStep1 = (data: any) => {
  const errors: Record<string, string> = {};
  if (!data.fullName) errors.fullName = "Name is required";
  if (!data.email?.includes('@')) errors.email = "Valid official email required";
  if (!data.phone) errors.phone = "Phone number required";
  if (!data.employeeId) errors.employeeId = "Service ID required";
  if (data.password?.length < 10) errors.password = "Min 10 characters";
  if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords must match";
  return errors;
};

export const validateStep3 = (role: string, data: any) => {
  const errors: Record<string, string> = {};
  
  if (role === 'ambulance') {
    if (!data.unitId) errors.unitId = "Unit ID required";
    if (!data.vehicleReg) errors.vehicleReg = "Registration required";
    if (!data.licenseNumber) errors.licenseNumber = "License required";
    if (!data.emergencyContact) errors.emergencyContact = "Emergency contact required";
    if (!data.consent) errors.consent = "GPS consent required";
  }
  
  if (role === 'police') {
    if (!data.unitId) errors.unitId = "Unit ID required";
    if (!data.badgeNumber) errors.badgeNumber = "Badge number required";
    if (!data.rank) errors.rank = "Rank required";
    if (!data.consent) errors.consent = "Clearance consent required";
  }

  if (role === 'hospital') {
    if (!data.hospitalName) errors.hospitalName = "Hospital name required";
    if (!data.staffRole) errors.staffRole = "Staff role required";
    if (!data.traumaLevel) errors.traumaLevel = "Trauma level required";
    if (!data.emergencyLine) errors.emergencyLine = "Direct line required";
    if (!data.consent) errors.consent = "Capacity consent required";
  }

  if (role === 'control') {
    if (!data.callsign) errors.callsign = "Callsign required";
    if (!data.supervisorCode) errors.supervisorCode = "Supervisor code required";
    if (!data.consent) errors.consent = "Audit consent required";
  }

  return errors;
};

// Unified Registration Flow with "Deny on skip" logic
export const registerPersonnel = async (role: string, step1Data: any, step2Data: any, step3Data: any) => {
  // 1. Final Safety Check - Deny if any data is missing
  const step1Errors = validateStep1(step1Data);
  const step3Errors = validateStep3(role, step3Data);
  
  if (Object.keys(step1Errors).length > 0 || Object.keys(step3Errors).length > 0 || !step2Data.orgId) {
    throw new Error("Operational Readiness Error: All profile details must be completed before access request.");
  }

  // 2. Auth Signup
  // We pass ALL core data into options.data so the DB Trigger can pick it up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: step1Data.email,
    password: step1Data.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        role: role.toLowerCase(), // Ensure enum compatibility
        full_name: role === 'hospital' ? step3Data.hospitalName : step1Data.fullName,
        phone: step1Data.phone,
        employee_id: step1Data.employeeId,
        organization_id: step2Data.orgId
      }
    }
  });

  if (authError) {
    console.error("Supabase Auth Error Detail:", {
      message: authError.message,
      status: authError.status,
      name: authError.name
    });
    throw new Error(authError.message);
  }
  
  if (!authData.user) throw new Error("Could not create user. Please try again.");

  // Note: The 'profiles' table entry is now created AUTOMATICALLY by the DB Trigger.
  // We only need to handle the role-specific tactical data here.

  // 3. Create Role-Specific Profile
  let roleData = {};
  let tableName = `${role}_profiles`;

  if (role === 'ambulance') {
    roleData = {
      id: authData.user.id,
      unit_id: step3Data.unitId,
      vehicle_reg: step3Data.vehicleReg,
      vehicle_type: step3Data.vehicleType,
      equipment: step3Data.equipment || [],
      license_number: step3Data.licenseNumber,
      emergency_contact: step3Data.emergencyContact,
      gps_consent: true
    };
  } else if (role === 'police') {
    roleData = {
      id: authData.user.id,
      unit_id: step3Data.unitId,
      badge_number: step3Data.badgeNumber,
      rank: step3Data.rank,
      assigned_junctions: step3Data.assignedJunctions ? step3Data.assignedJunctions.split(',').map((s: string) => s.trim()) : [],
      clearance_consent: true
    };
  } else if (role === 'hospital') {
    roleData = {
      id: authData.user.id,
      staff_role: step3Data.staffRole || 'Unknown',
      trauma_level: step3Data.traumaLevel || '3',
      capacity_er_total: parseInt(step3Data.totalBeds) || 0,
      capacity_er_available: parseInt(step3Data.availableBeds) || 0,
      emergency_line: step3Data.emergencyLine || 'N/A',
      latitude: step3Data.latitude ? parseFloat(step3Data.latitude) : null,
      longitude: step3Data.longitude ? parseFloat(step3Data.longitude) : null,
      capacity_consent: true
    };
  } else if (role === 'control') {
    tableName = 'control_room_profiles';
    roleData = {
      id: authData.user.id,
      callsign: step3Data.callsign,
      supervisor_code: step3Data.supervisorCode,
      department: step3Data.department,
      clearance_level: parseInt(step3Data.clearanceLevel) || 1,
      audit_consent: true
    };
  }

  // We use a small delay or retry logic if needed, but usually, the trigger is near-instant.
  const { error: roleError } = await supabase.from(tableName).insert(roleData);
  
  if (roleError) {
    console.error(`Error creating ${role} profile:`, roleError);
    // We don't throw here to avoid blocking the 'Check Email' screen, 
    // as the primary account is already created.
  }

  return authData;
};
