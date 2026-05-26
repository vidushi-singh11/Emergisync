import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Trip } from '../types/models';

export function useTripSync(hospitalIdFilter?: string) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel>;

    const fetchInitialTrips = async () => {
      try {
        let query = supabase
          .from('trips')
          .select('*')
          .neq('status', 'COMPLETED')
          .neq('status', 'CANCELLED');
          
        if (hospitalIdFilter) {
          query = query.eq('hospital_id', hospitalIdFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setTrips(data as Trip[]);
      } catch (err: any) {
        console.error('Error fetching initial trips:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialTrips();

    // Setup Realtime Subscription
    subscription = supabase
      .channel('public:trips')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        (payload) => {
          setTrips((currentTrips) => {
            if (payload.eventType === 'INSERT') {
              const newTrip = payload.new as Trip;
              if (hospitalIdFilter && newTrip.hospital_id !== hospitalIdFilter) return currentTrips;
              if (newTrip.status === 'COMPLETED' || newTrip.status === 'CANCELLED') return currentTrips;
              return [newTrip, ...currentTrips];
            }
            
            if (payload.eventType === 'UPDATE') {
              const updatedTrip = payload.new as Trip;
              if (hospitalIdFilter && updatedTrip.hospital_id !== hospitalIdFilter) return currentTrips;
              if (updatedTrip.status === 'COMPLETED' || updatedTrip.status === 'CANCELLED') {
                return currentTrips.filter(t => t.id !== updatedTrip.id);
              }
              const exists = currentTrips.some(t => t.id === updatedTrip.id);
              if (exists) {
                return currentTrips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
              }
              return [updatedTrip, ...currentTrips];
            }
            
            if (payload.eventType === 'DELETE') {
              return currentTrips.filter(t => t.id !== payload.old.id);
            }
            
            return currentTrips;
          });
        }
      )
      .subscribe();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [hospitalIdFilter]);

  const addTrip = async (tripData: Partial<Trip>) => {
    const { data, error } = await supabase.from('trips').insert([tripData]).select().single();
    if (error) {
      console.error("Failed to insert trip:", error);
      throw error;
    }
    return data;
  };

  const updateTripStatus = async (id: string, updates: Partial<Trip>) => {
    const { error } = await supabase.from('trips').update(updates).eq('id', id);
    if (error) {
      console.error("Failed to update trip:", error);
      throw error;
    }
  };

  return { trips, loading, error, setTrips, addTrip, updateTripStatus };
}
