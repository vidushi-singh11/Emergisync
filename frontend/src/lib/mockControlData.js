export const MOCK_TRIPS = [
  {
    id: 'TRP-1042',
    unitId: 'AMB-204',
    severity: 'CRITICAL L1',
    verification: 'verified', // verified, pending, flagged
    policeStatus: 'CLEARED',
    priorityScore: 94,
    hospital: 'Metro General Central',
    eta: '2m 14s',
    erStatus: 'PREPARING',
    ackTime: '14:12:00'
  },
  {
    id: 'TRP-1043',
    unitId: 'AMB-105',
    severity: 'SEVERE L2',
    verification: 'pending',
    policeStatus: 'ACK',
    priorityScore: 76,
    hospital: 'City West Medical',
    eta: '8m 30s',
    erStatus: 'ACKNOWLEDGED',
    ackTime: '14:15:22'
  },
  {
    id: 'TRP-1044',
    unitId: 'AMB-311',
    severity: 'MODERATE L3',
    verification: 'verified',
    policeStatus: 'N/A',
    priorityScore: 45,
    hospital: 'St. Jude Memorial',
    eta: '14m 10s',
    erStatus: 'READY',
    ackTime: '14:05:11'
  },
  {
    id: 'TRP-1045',
    unitId: 'AMB-402',
    severity: 'CRITICAL L1',
    verification: 'flagged',
    policeStatus: 'SENT',
    priorityScore: 98,
    hospital: 'East Side Trauma',
    eta: '4m 00s',
    erStatus: 'PENDING',
    ackTime: '--'
  }
];

export const MOCK_POLICE_CLEARANCES = [
  {
    tripId: 'TRP-1042',
    severity: 'CRITICAL',
    junctionId: 'JN-402',
    policeUnit: 'P-105',
    status: 'CLEARED',
    estClearance: '00:00',
    lastUpdate: '14:16:30'
  },
  {
    tripId: 'TRP-1043',
    severity: 'HIGH',
    junctionId: 'JN-112',
    policeUnit: 'P-102',
    status: 'ACKNOWLEDGED',
    estClearance: '01:45',
    lastUpdate: '14:17:10'
  },
  {
    tripId: 'TRP-1045',
    severity: 'CRITICAL',
    junctionId: 'JN-210',
    policeUnit: 'P-304',
    status: 'ALERT SENT',
    estClearance: '-02:15', // Overdue
    lastUpdate: '14:10:00'
  }
];

export const MOCK_HOSPITALS = [
  {
    id: 'H1',
    name: 'Metro General Central',
    loadStatus: 'HIGH LOAD',
    utilization: 88,
    erBeds: { used: 22, total: 25 },
    icuBeds: { used: 8, total: 10 },
    traumaLevel: 'LVL 1',
    diversion: false
  },
  {
    id: 'H2',
    name: 'East Side Trauma',
    loadStatus: 'CRITICAL',
    utilization: 96,
    erBeds: { used: 24, total: 25 },
    icuBeds: { used: 10, total: 10 },
    traumaLevel: 'LVL 1',
    diversion: true
  },
  {
    id: 'H3',
    name: 'City West Medical',
    loadStatus: 'NORMAL',
    utilization: 45,
    erBeds: { used: 9, total: 20 },
    icuBeds: { used: 2, total: 5 },
    traumaLevel: 'LVL 2',
    diversion: false
  }
];
