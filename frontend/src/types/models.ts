export type TripStatus = 'INITIATED' | 'VERIFIED' | 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED_AT_HOSPITAL' | 'PATIENT_HANDOFF_COMPLETE' | 'COMPLETED' | 'CANCELLED';
export type TripSeverity = 'CRITICAL_L1' | 'SEVERE_L2' | 'MODERATE_L3' | 'MINOR_L4';
export type PoliceClearanceStatus = 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'CLEARED' | 'ESCALATED' | 'RELEASED';
export type HospitalERStatus = 'PENDING' | 'PREPARING' | 'READY' | 'PROCESSING' | 'RECEIVED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED';
export type AgeGroup = 'infant' | 'child' | 'adult' | 'senior';

export interface Trip {
  id: string;
  trip_ref: string;
  ambulance_id: string;
  hospital_id: string;
  patient_name: string | null;
  condition: string;
  severity: TripSeverity;
  equipment_needed: string[];
  notes: string | null;
  priority_score: number;
  status: TripStatus;
  verification_status: VerificationStatus;
  er_status: HospitalERStatus;
  eta: string | null;
  eta_seconds: number | null;
  route_geometry: any | null;
  // Patient preview fields (Driver → Hospital)
  age_group: AgeGroup | null;
  special_needs: string[];
  driver_note: string | null;
  // Hospital response fields (Hospital → Driver)
  bay_note: string | null;
  ack_time: string | null;
  arrival_time: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface PoliceClearance {
  id: string;
  trip_id: string;
  police_unit_id: string;
  junction_id: string;
  status: PoliceClearanceStatus;
  est_clearance_time: string | null;
  actual_clearance_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface AmbulanceUnit {
  id: string;
  current_lat: number | null;
  current_lng: number | null;
  speed: number;
  heading: number;
  is_online: boolean;
  last_ping: string;
}

/** Hospital info as seen by the ambulance driver in the hospital picker */
export interface HospitalInfo {
  id: string;
  name: string;
  coords: [number, number];
  traumaLevel: string;
  erTotal: number;
  erAvailable: number;
  icuTotal: number;
  icuAvailable: number;
  isDiversion: boolean;
  emergencyLine: string;
  distance?: string;
  eta?: string;
}
