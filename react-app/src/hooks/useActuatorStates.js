import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useActuatorStates() {
  const [actuators, setActuators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActuators = async () => {
      try {
        const { data, error } = await supabase
          .from('actuator_states')
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error('Error fetching actuator states:', error);
        } else if (data) {
          setActuators(data);
        }
      } catch (err) {
        console.error('Supabase actuator fetch failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActuators();

    // Subscribe to real-time changes on actuator_states
    const subscription = supabase
      .channel('actuator_states_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'actuator_states' }, payload => {
        if (payload.eventType === 'UPDATE') {
          setActuators(prev =>
            prev.map(a => a.id === payload.new.id ? payload.new : a)
          );
        } else if (payload.eventType === 'INSERT') {
          setActuators(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'DELETE') {
          setActuators(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { actuators, loading };
}
