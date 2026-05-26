import React, { useState, useEffect } from 'react';
import { TopBar } from '../../components/police/TopBar';
import { ActiveOrders } from '../../components/police/ActiveOrders';
import type { ClearanceOrder, ClearanceStatus } from '../../components/police/ActiveOrders';
import { JunctionMap } from '../../components/police/JunctionMap';
import { HotspotAlerts } from '../../components/police/HotspotAlerts';
import type { HotspotAlert } from '../../components/police/HotspotAlerts';
import { supabase } from '../../lib/supabase';

export const PoliceDashboard = () => {
  // --- STATE ---
  const [isOnline, setIsOnline] = useState(true);
  const [unitId, setUnitId] = useState('P-105');
  const [policeCoords, setPoliceCoords] = useState<[number, number]>([40.7128, -74.0060]);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);

  // Mock Active Orders (Clearance requests)
  const [orders, setOrders] = useState<ClearanceOrder[]>([
    {
      id: 'TR-991',
      ambulanceId: 'AMB-204',
      junctionId: 'JN-402',
      status: 'awaiting',
      eta: '3m 15s',
      coords: [40.7138, -74.0040],
      ambCoords: [40.7090, -74.0100] // Simulating ambulance approaching from SW
    },
    {
      id: 'TR-992',
      ambulanceId: 'AMB-105',
      junctionId: 'JN-112',
      status: 'in_progress',
      eta: '1m 45s',
      coords: [40.7160, -74.0020],
      ambCoords: [40.7150, -74.0080] // Simulating ambulance approaching from W
    }
  ]);

  // Mock Hotspot Alerts
  const [alerts, setAlerts] = useState<HotspotAlert[]>([
    { id: 'a1', junctionId: 'JN-402', unitCount: 2 }
  ]);

  // --- DEVICE GEOLOCATION ---
  useEffect(() => {
    if (!isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPoliceCoords([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline]);

  // --- HANDLERS ---
  const handleToggleOnline = () => {
    if (orders.some(o => o.status === 'in_progress')) {
      alert("Cannot go offline while managing an active clearance.");
      return;
    }
    setIsOnline(!isOnline);
  };

  const handleUpdateOrderStatus = (id: string, newStatus: ClearanceStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    
    // Automatically clear order after a delay when marked cleared
    if (newStatus === 'cleared') {
      setTimeout(() => {
        setOrders(prev => prev.filter(o => o.id !== id));
      }, 5000);
    }
  };

  const handleEscalate = (id: string) => {
    alert(`Escalation request sent for Trip ${id}. Backup dispatched.`);
  };

  const handleRequestBackup = (junctionId: string) => {
    setAlerts(prev => prev.filter(a => a.junctionId !== junctionId));
    alert(`Backup requested for ${junctionId}. Control Room notified.`);
  };

  return (
    <div className="flex flex-col h-screen bg-void-black text-text-primary overflow-hidden">
      <TopBar 
        unitId={unitId}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        activeAlerts={orders.filter(o => o.status !== 'cleared').length}
      />

      <div className="flex flex-1 overflow-hidden">
        <ActiveOrders 
          orders={orders}
          onAcknowledge={(id) => handleUpdateOrderStatus(id, 'in_progress')}
          onMarkCleared={(id) => handleUpdateOrderStatus(id, 'cleared')}
          onEscalate={handleEscalate}
          onFocusJunction={(coords) => setFocusCoords(coords)}
        />
        
        <div className="flex-1 relative">
          <HotspotAlerts 
            alerts={alerts}
            onRequestBackup={handleRequestBackup}
          />
          <JunctionMap 
            policeCoords={policeCoords}
            activeOrders={orders}
            focusCoords={focusCoords}
          />
        </div>
      </div>
    </div>
  );
};
