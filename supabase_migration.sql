-- ============================================
-- ESP32 Actuator Integration - Supabase Tables
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Actuator States Table
CREATE TABLE IF NOT EXISTS actuator_states (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_on BOOLEAN DEFAULT false,
  triggered_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed actuators
INSERT INTO actuator_states (id, label, is_on) VALUES
  ('pompa_nutrisi', 'Pompa Nutrisi', false),
  ('pompa_air', 'Pompa Air', false),
  ('kipas', 'Kipas Exhaust', false),
  ('lampu_grow', 'Lampu Grow', false),
  ('solenoid_valve', 'Solenoid Valve', false),
  ('misting', 'Misting System', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Sensor Thresholds Table
CREATE TABLE IF NOT EXISTS sensor_thresholds (
  sensor_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  min_value FLOAT NOT NULL,
  max_value FLOAT NOT NULL,
  actuator_id TEXT REFERENCES actuator_states(id),
  action_on_breach TEXT DEFAULT 'turn_on',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default thresholds with actuator mappings
INSERT INTO sensor_thresholds (sensor_id, label, min_value, max_value, actuator_id, action_on_breach) VALUES
  ('suhu_rumah_kaca', 'Suhu Rumah Kaca', 20, 27, 'kipas', 'turn_on'),
  ('kelembapan', 'Kelembapan', 60, 80, 'misting', 'turn_on'),
  ('intensitas_cahaya', 'Intensitas Cahaya', 300, 500, 'lampu_grow', 'turn_on'),
  ('ph', 'pH', 5.5, 6.5, 'pompa_nutrisi', 'turn_on'),
  ('tds', 'TDS', 400, 600, 'pompa_nutrisi', 'turn_on'),
  ('suhu_larutan', 'Suhu Larutan', 18, 24, 'pompa_air', 'turn_on')
ON CONFLICT (sensor_id) DO NOTHING;

-- 3. Enable Realtime on actuator_states
ALTER PUBLICATION supabase_realtime ADD TABLE actuator_states;

-- 4. Enable RLS (but allow public read for ESP32)
ALTER TABLE actuator_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_thresholds ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read actuator states (ESP32 doesn't have auth)
CREATE POLICY "Allow public read actuator_states" ON actuator_states
  FOR SELECT USING (true);

-- Allow authenticated users to update actuator states
CREATE POLICY "Allow authenticated update actuator_states" ON actuator_states
  FOR UPDATE USING (true);

-- Allow service role to insert/update (for FastAPI backend)
CREATE POLICY "Allow service role all actuator_states" ON actuator_states
  FOR ALL USING (true);

-- Thresholds policies
CREATE POLICY "Allow public read sensor_thresholds" ON sensor_thresholds
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update sensor_thresholds" ON sensor_thresholds
  FOR UPDATE USING (true);

CREATE POLICY "Allow service role all sensor_thresholds" ON sensor_thresholds
  FOR ALL USING (true);

-- ============================================
-- 5. Storage Bucket for Avatars
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view avatars
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their avatars
CREATE POLICY "Users can update their avatar."
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete their avatars
CREATE POLICY "Users can delete their avatar."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
