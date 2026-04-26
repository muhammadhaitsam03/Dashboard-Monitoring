import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Sun,
  Moon,
  ChevronDown,
  ThermometerSun,
  Droplets,
  SunMedium,
  FlaskConical,
  Waves,
  Thermometer,
  Check,
  Loader2,
  Sparkles,
  Hand,
  Wifi
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const SENSORS = [
  { id: 'suhu_rumah_kaca', label: 'Suhu Rumah Kaca', shortLabel: 'Suhu Kaca', icon: ThermometerSun, unit: '°C', defaultMin: 20, defaultMax: 27, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', ring: 'ring-orange-200 dark:ring-orange-800/40' },
  { id: 'kelembapan', label: 'Kelembapan', shortLabel: 'Kelembapan', icon: Droplets, unit: '%', defaultMin: 60, defaultMax: 80, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', ring: 'ring-blue-200 dark:ring-blue-800/40' },
  { id: 'intensitas_cahaya', label: 'Intensitas Cahaya', shortLabel: 'Cahaya', icon: SunMedium, unit: 'lux', defaultMin: 300, defaultMax: 500, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10', ring: 'ring-yellow-200 dark:ring-yellow-800/40' },
  { id: 'ph', label: 'pH', shortLabel: 'pH', icon: FlaskConical, unit: '', defaultMin: 5.5, defaultMax: 6.5, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', ring: 'ring-purple-200 dark:ring-purple-800/40' },
  { id: 'tds', label: 'TDS', shortLabel: 'TDS', icon: Waves, unit: 'ppm', defaultMin: 400, defaultMax: 600, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10', ring: 'ring-teal-200 dark:ring-teal-800/40' },
  { id: 'suhu_larutan', label: 'Suhu Larutan', shortLabel: 'Suhu Larutan', icon: Thermometer, unit: '°C', defaultMin: 18, defaultMax: 24, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-200 dark:ring-rose-800/40' },
];

// ML-recommended thresholds (from PatchTST model predictions)
const ML_RECOMMENDATIONS = {
  suhu_rumah_kaca: { min: 18, max: 24, reason: 'Model prediksi suhu akan naik ke 27.3°C — range lebih rendah untuk antisipasi' },
  kelembapan: { min: 50, max: 70, reason: 'Prediksi kelembapan 0.83 — range disesuaikan untuk mencegah jamur' },
  intensitas_cahaya: { min: 150, max: 600, reason: 'Forecast cahaya naik ke 618 W/m² — range diperluas' },
  ph: { min: 6.0, max: 7.0, reason: 'pH saat ini 6.62 — optimal untuk selada merah hidroponik' },
  tds: { min: 560, max: 840, reason: 'Konsentrasi nutrisi disesuaikan dengan fase pertumbuhan' },
  suhu_larutan: { min: 18, max: 22, reason: 'Suhu larutan perlu lebih dingin untuk efisiensi penyerapan' },
};

const ThresholdInput = ({ type, value, onUpdate, step, disabled }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlurOrEnter = () => {
    const clampedValue = onUpdate(type, localValue);
    if (clampedValue !== undefined) {
      setLocalValue(clampedValue);
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlurOrEnter}
      onKeyDown={e => { if (e.key === 'Enter') handleBlurOrEnter(); }}
      disabled={disabled}
      className={`text-[28px] text-gray-800 dark:text-gray-200 bg-transparent outline-none w-[70px] text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      step={step}
    />
  );
};

export default function Threshold() {
  const { isDark, toggleTheme } = useOutletContext();
  const [activeSensorId, setActiveSensorId] = useState('suhu_rumah_kaca');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(() => localStorage.getItem('threshold_auto_mode') === 'true');
  const [autoApplying, setAutoApplying] = useState(false);

  const [thresholds, setThresholds] = useState(() => {
    const initial = {};
    SENSORS.forEach(s => {
      initial[s.id] = { min: s.defaultMin, max: s.defaultMax };
    });
    return initial;
  });

  const [savedThresholds, setSavedThresholds] = useState(() => {
    const initial = {};
    SENSORS.forEach(s => {
      initial[s.id] = { min: s.defaultMin, max: s.defaultMax };
    });
    return initial;
  });

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const { data, error } = await supabase
          .from('sensor_thresholds')
          .select('*');

        if (error) {
          console.error('Error fetching thresholds:', error);
        } else if (data && data.length > 0) {
          const fromDB = {};
          data.forEach(t => {
            fromDB[t.sensor_id] = { min: t.min_value, max: t.max_value };
          });
          setThresholds(prev => ({ ...prev, ...fromDB }));
          setSavedThresholds(prev => ({ ...prev, ...fromDB }));
        }
      } catch (err) {
        console.error('Supabase threshold fetch failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, []);

  useEffect(() => {
    if (isAutoMode) {
      applyMLRecommendations();
    }
  }, [isAutoMode]);

  const applyMLRecommendations = async () => {
    setAutoApplying(true);
    try {
      const newThresholds = {};
      const updates = [];

      SENSORS.forEach(s => {
        const rec = ML_RECOMMENDATIONS[s.id];
        if (rec) {
          newThresholds[s.id] = { min: rec.min, max: rec.max };
          updates.push(
            supabase
              .from('sensor_thresholds')
              .update({
                min_value: rec.min,
                max_value: rec.max,
                updated_at: new Date().toISOString()
              })
              .eq('sensor_id', s.id)
          );
        } else {
          newThresholds[s.id] = thresholds[s.id];
        }
      });

      await Promise.all(updates);

      setThresholds(prev => ({ ...prev, ...newThresholds }));
      setSavedThresholds(prev => ({ ...prev, ...newThresholds }));
    } catch (err) {
      console.error('Failed to apply ML recommendations:', err);
    } finally {
      setAutoApplying(false);
    }
  };

  const activeSensor = SENSORS.find(s => s.id === activeSensorId);
  const currentThreshold = thresholds[activeSensorId];
  const saved = savedThresholds[activeSensorId];
  const hasChanges = currentThreshold.min !== saved.min || currentThreshold.max !== saved.max;
  const mlRec = ML_RECOMMENDATIONS[activeSensorId];

  const handleUpdateThreshold = (type, delta) => {
    if (isAutoMode) return;
    const step = activeSensor.unit === '' ? 0.1 : 1;
    setThresholds(prev => {
      const current = prev[activeSensorId];
      let newValue = +(current[type] + delta).toFixed(1);

      if (type === 'min' && newValue >= current.max) {
        newValue = +(current.max - step).toFixed(1);
      } else if (type === 'max' && newValue <= current.min) {
        newValue = +(current.min + step).toFixed(1);
      }

      return {
        ...prev,
        [activeSensorId]: {
          ...current,
          [type]: newValue
        }
      };
    });
  };

  const handleDirectInput = (type, value) => {
    if (isAutoMode) return value;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const step = activeSensor.unit === '' ? 0.1 : 1;
      let clamped = +num.toFixed(1);
      const current = thresholds[activeSensorId];

      if (type === 'min' && clamped >= current.max) {
        clamped = +(current.max - step).toFixed(1);
      } else if (type === 'max' && clamped <= current.min) {
        clamped = +(current.min + step).toFixed(1);
      }

      setThresholds(prev => ({
        ...prev,
        [activeSensorId]: {
          ...prev[activeSensorId],
          [type]: clamped
        }
      }));

      return clamped;
    }
    return value;
  };

  const handleSetThreshold = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sensor_thresholds')
        .update({
          min_value: currentThreshold.min,
          max_value: currentThreshold.max,
          updated_at: new Date().toISOString()
        })
        .eq('sensor_id', activeSensorId);

      if (error) {
        console.error('Error saving threshold:', error);
        setSaving(false);
        return;
      }

      setSavedThresholds(prev => ({
        ...prev,
        [activeSensorId]: { ...currentThreshold }
      }));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save threshold:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto px-6 md:px-10 lg:px-14 py-8 md:py-10 animate-page-enter relative z-0">

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-[#1E463A]/5 dark:bg-[#1E463A]/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* ─── Header ─── */}
      <header className="flex justify-between items-center mb-6 mt-2">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Threshold Sensor</h1>

          {/* Manual / Auto ML Toggle */}
          <div className="flex items-center gap-0 bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-gray-200/60 dark:border-gray-700/60 shadow-inner ml-3">
            <button
              onClick={() => { setIsAutoMode(false); localStorage.setItem('threshold_auto_mode', 'false'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                !isAutoMode
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-md'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              Manual
            </button>
            <button
              onClick={() => { setIsAutoMode(true); localStorage.setItem('threshold_auto_mode', 'true'); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                isAutoMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto ML
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <NotificationDropdown />
          <div
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 rounded-full w-14 h-8 flex items-center p-1 relative cursor-pointer shadow-inner hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <div className={`bg-white dark:bg-gray-900 rounded-full w-6 h-6 flex justify-center items-center shadow-sm absolute transition-all duration-300 ease-in-out ${isDark ? 'translate-x-6' : 'translate-x-0'}`}>
              {isDark ? <Moon className="w-3.5 h-3.5 text-gray-100" /> : <Sun className="w-3.5 h-3.5 text-gray-700" />}
            </div>
          </div>
          <LiveClock />
          <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
          <div onClick={() => navigate('/account')} className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1.5 pr-4 rounded-[25px] transition-colors -mr-2">
            <div className="w-10 h-10 overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-[#cecfce] dark:border-gray-600">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'AD'
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-none">{user?.user_metadata?.full_name || 'User'}</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{user?.user_metadata?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Auto ML Info Bar (slim, non-blocking) ─── */}
      {isAutoMode && (
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/60 dark:border-emerald-700/40 rounded-2xl px-5 py-3.5 flex items-center gap-4 transition-all duration-300">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-emerald-800 dark:text-emerald-300">Mode Auto ML Aktif</span>
              {autoApplying && <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />}
            </div>
            {mlRec && (
              <p className="text-[12px] text-emerald-700/80 dark:text-emerald-400/60 mt-0.5 truncate">
                {activeSensor.label}: {mlRec.reason}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">ESP32 Terhubung</span>
          </div>
        </div>
      )}

      {/* ─── Main Content: 2-column layout ─── */}
      <div className="flex-1 flex gap-8 pb-10">

        {/* Left Column: Sensor List */}
        <div className="w-[220px] shrink-0 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-5 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
            <h2 className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pilih Sensor</h2>
          </div>

          {SENSORS.map(sensor => {
            const Icon = sensor.icon;
            const isActive = activeSensorId === sensor.id;
            const sensorSaved = savedThresholds[sensor.id];

            return (
              <button
                key={sensor.id}
                onClick={() => setActiveSensorId(sensor.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? isAutoMode
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15'
                      : 'bg-[#385344] text-white shadow-lg shadow-[#385344]/20'
                    : 'bg-white/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/70 border border-gray-100 dark:border-gray-700/40 hover:shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white/20'
                    : sensor.bg
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : sensor.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-semibold leading-tight ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                    {sensor.label}
                  </p>
                  <p className={`text-[11px] mt-0.5 font-medium ${isActive ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                    {sensorSaved.min} – {sensorSaved.max} {sensor.unit}
                  </p>
                </div>
              </button>
            );
          })}

          {/* ESP32 Connection Status */}
          {!isAutoMode && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-white/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/30">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Terhubung ke ESP32 via Supabase</span>
            </div>
          )}
        </div>

        {/* Right Column: Main Display */}
        <div className="flex-1 flex flex-col items-center justify-center">

          {/* Circle Display */}
          <div className={`w-[360px] aspect-square rounded-full shadow-inner relative flex flex-col items-center justify-center shrink-0 transition-all duration-500 ${
            isAutoMode
              ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 ring-2 ring-emerald-300/50 dark:ring-emerald-600/30'
              : `bg-gray-100 dark:bg-gray-800/60 ring-1 ${activeSensor.ring}`
          }`}>
            {loading ? (
              <Loader2 className="w-16 h-16 animate-spin text-gray-400" />
            ) : (
              <>
                <activeSensor.icon className={`w-20 h-20 mb-3 ${activeSensor.color} drop-shadow-sm transition-all duration-300`} />
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{activeSensor.label}</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{saved.min} – {saved.max}</span>
                  <span className="text-xl font-semibold text-gray-400">{activeSensor.unit}</span>
                </div>
                {isAutoMode && (
                  <div className="mt-3 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">ML Optimized</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Threshold Controls */}
          <div className={`flex items-center gap-8 mt-10 transition-all duration-300 ${isAutoMode ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>

            {/* Min Control */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl px-5 py-3 border border-gray-200/70 dark:border-gray-700/50 shadow-sm gap-2 min-w-[150px] justify-between">
                <div className="flex items-baseline gap-1 ml-1">
                  <ThresholdInput
                    type="min"
                    value={currentThreshold.min}
                    onUpdate={handleDirectInput}
                    step={activeSensor.unit === '' ? 0.1 : 1}
                    disabled={isAutoMode}
                  />
                  <span className="text-[14px] text-gray-400 dark:text-gray-500 font-medium">{activeSensor.unit}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleUpdateThreshold('min', 1)} disabled={isAutoMode} className="hover:text-green-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-gray-400"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                  <button onClick={() => handleUpdateThreshold('min', -1)} disabled={isAutoMode} className="hover:text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-gray-400"><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Minimum</span>
            </div>

            <span className="text-2xl text-gray-300 dark:text-gray-600 font-light mb-5">—</span>

            {/* Max Control */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl px-5 py-3 border border-gray-200/70 dark:border-gray-700/50 shadow-sm gap-2 min-w-[150px] justify-between">
                <div className="flex items-baseline gap-1 ml-1">
                  <ThresholdInput
                    type="max"
                    value={currentThreshold.max}
                    onUpdate={handleDirectInput}
                    step={activeSensor.unit === '' ? 0.1 : 1}
                    disabled={isAutoMode}
                  />
                  <span className="text-[14px] text-gray-400 dark:text-gray-500 font-medium">{activeSensor.unit}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleUpdateThreshold('max', 1)} disabled={isAutoMode} className="hover:text-green-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-gray-400"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                  <button onClick={() => handleUpdateThreshold('max', -1)} disabled={isAutoMode} className="hover:text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-gray-400"><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Maximum</span>
            </div>
          </div>

          {/* Set Threshold Button (manual mode only) */}
          {!isAutoMode && (
            <button
              onClick={handleSetThreshold}
              disabled={!hasChanges || saving}
              className={`mt-6 px-8 py-3 rounded-full font-semibold text-sm uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-md ${hasChanges && !saving
                  ? 'bg-[#385344] hover:bg-[#2d4438] text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-95'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  Threshold Set!
                </>
              ) : (
                'Set Threshold'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
