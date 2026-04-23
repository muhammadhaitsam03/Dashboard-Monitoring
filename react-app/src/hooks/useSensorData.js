import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSensorData() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('sensor_readings')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (error) {
          console.error("Error fetching sensor data:", error);
        } else if (data) {
          setRawData(data);
        }
      } catch (err) {
        console.error("Supabase fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Subscribe to new rows being inserted by the ESP32 in real time
    const subscription = supabase
      .channel('sensor_readings_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, payload => {
        // Append the new row to our existing React state
        setRawData(prevData => [...prevData, payload.new]);
      })
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { rawData, loading };
}
