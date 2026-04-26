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
  Hand
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const SENSORS = [
  { id: 'suhu_rumah_kaca', label: 'Suhu Rumah Kaca', icon: ThermometerSun, unit: '°C', defaultMin: 20, defaultMax: 27, color: 'text-orange-500' },
  { id: 'kelembapan', label: 'Kelembapan', icon: Droplets, unit: '%', defaultMin: 60, defaultMax: 80, color: 'text-blue-500' },
  { id: 'intensitas_cahaya', label: 'Intensitas Cahaya', icon: SunMedium, unit: 'lux', defaultMin: 300, defaultMax: 500, color: 'text-yellow-500' },
  { id: 'ph', label: 'pH', icon: FlaskConical, unit: '', defaultMin: 5.5, defaultMax: 6.5, color: 'text-purple-500' },
  { id: 'tds', label: 'TDS', icon: Waves, unit: 'ppm', defaultMin: 400, defaultMax: 600, color: 'text-teal-500' },
  { id: 'suhu_larutan', label: 'Suhu Larutan', icon: Thermometer, unit: '°C', defaultMin: 18, defaultMax: 24, color: 'text-rose-500' },
];

// ML-recommended thresholds (from PatchTST model predictions)
// In production, these would come from an ML API endpoint
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
      className={`text-[22px] text-gray-800 dark:text-gray-200 bg-transparent outline-none w-[60px] text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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

  // Initialize thresholds with default values
  const [thresholds, setThresholds] = useState(() => {
    const initial = {};
    SENSORS.forEach(s => {
      initial[s.id] = { min: s.defaultMin, max: s.defaultMax };
    });
    return initial;
  });

  // Saved/applied thresholds (what the sensor actually uses)
  const [savedThresholds, setSavedThresholds] = useState(() => {
    const initial = {};
    SENSORS.forEach(s => {
      initial[s.id] = { min: s.defaultMin, max: s.defaultMax };
    });
    return initial;
  });

  const [isSaved, setIsSaved] = useState(false);

  // Load thresholds from Supabase on mount
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

  // When switching to Auto mode, apply ML recommendations
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

      // Save all to Supabase
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
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-page-enter relative z-0">

      {/* Soft Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-[#1E463A]/5 dark:bg-[#1E463A]/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Top Header */}
      <header className="flex justify-between items-center px-6 md:px-10 lg:px-14 pt-8 md:pt-10 mb-2">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Threshold Sensor</h1>

          {/* Manual / Auto ML Toggle Switch */}
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

          {/* Theme Toggle */}
          <div
            onClick={toggleTheme}
            className="bg-gray-200 dark:bg-gray-700 rounded-full w-14 h-8 flex items-center p-1 relative cursor-pointer shadow-inner hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <div
              className={`bg-white dark:bg-gray-900 rounded-full w-6 h-6 flex justify-center items-center shadow-sm absolute transition-all duration-300 ease-in-out ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
            >
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-gray-100" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-gray-700" />
              )}
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

      {/* Content Section: Center area + Right Sidebar */}
      <div className="flex-1 flex overflow-hidden">

        {/* Central Area: Large Circle and Inputs */}
        <div className="flex-1 flex flex-col items-center justify-center relative">

          {/* Auto ML info banner (shown in auto mode) */}
          {isAutoMode && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[520px]">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/70 dark:border-emerald-700/40 rounded-2xl px-5 py-4 backdrop-blur-md shadow-lg shadow-emerald-500/5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-emerald-800 dark:text-emerald-300">Mode Auto ML Aktif</span>
                      {autoApplying && <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />}
                    </div>
                    <p className="text-[12px] text-emerald-700/80 dark:text-emerald-400/70 leading-relaxed">
                      Threshold diatur otomatis berdasarkan prediksi model PatchTST.
                      {mlRec && (
                        <span className="block mt-1 font-medium text-emerald-800 dark:text-emerald-300">
                          {activeSensor.label}: {mlRec.reason}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Big Placeholder Circle */}
          <div className={`w-[380px] aspect-square rounded-full mb-16 shadow-inner relative flex flex-col items-center justify-center shrink-0 transition-all duration-500 ${
            isAutoMode
              ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 ring-2 ring-emerald-300/50 dark:ring-emerald-600/30'
              : 'bg-[#D9D9D9] dark:bg-gray-700'
          } text-gray-500 dark:text-gray-400`}>
            {loading ? (
              <Loader2 className="w-16 h-16 animate-spin text-gray-400" />
            ) : (
              <>
                <activeSensor.icon className={`w-24 h-24 mb-4 ${activeSensor.color} drop-shadow-sm`} />
                <span className="text-xl font-medium uppercase tracking-widest">{activeSensor.label}</span>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-800 dark:text-gray-100">{saved.min} - {saved.max}</span>
                  <span className="text-2xl font-semibold">{activeSensor.unit}</span>
                </div>
                {isAutoMode && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">ML Optimized</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Threshold Controls */}
          <div className={`flex items-center gap-6 transition-opacity duration-300 ${isAutoMode ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {/* Min Control */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center bg-[#D9D9D9] dark:bg-gray-700 rounded-full px-6 py-3 transition-colors gap-2 min-w-[140px] justify-between group">
                <div className="flex items-baseline gap-1 ml-2">
                  <ThresholdInput
                    type="min"
                    value={currentThreshold.min}
                    onUpdate={handleDirectInput}
                    step={activeSensor.unit === '' ? 0.1 : 1}
                    disabled={isAutoMode}
                  />
                  <span className="text-[16px] text-gray-500 dark:text-gray-400">{activeSensor.unit}</span>
                </div>
                <div className="flex flex-col">
                  <button onClick={() => handleUpdateThreshold('min', 1)} disabled={isAutoMode} className="hover:text-green-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                  <button onClick={() => handleUpdateThreshold('min', -1)} disabled={isAutoMode} className="hover:text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Minimum</span>
            </div>

            <span className="text-2xl text-gray-600 dark:text-gray-400 font-medium mb-6">-</span>

            {/* Max Control */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center bg-[#D9D9D9] dark:bg-gray-700 rounded-full px-6 py-3 transition-colors gap-2 min-w-[140px] justify-between group">
                <div className="flex items-baseline gap-1 ml-2">
                  <ThresholdInput
                    type="max"
                    value={currentThreshold.max}
                    onUpdate={handleDirectInput}
                    step={activeSensor.unit === '' ? 0.1 : 1}
                    disabled={isAutoMode}
                  />
                  <span className="text-[16px] text-gray-500 dark:text-gray-400">{activeSensor.unit}</span>
                </div>
                <div className="flex flex-col">
                  <button onClick={() => handleUpdateThreshold('max', 1)} disabled={isAutoMode} className="hover:text-green-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                  <button onClick={() => handleUpdateThreshold('max', -1)} disabled={isAutoMode} className="hover:text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Maximum</span>
            </div>
          </div>

          {/* Set Threshold Button (manual mode only) */}
          {!isAutoMode && (
            <button
              onClick={handleSetThreshold}
              disabled={!hasChanges || saving}
              className={`mt-6 px-8 py-3 rounded-full font-semibold text-sm uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-md ${hasChanges && !saving
                  ? 'bg-[#385344] hover:bg-[#2d4438] text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-95'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
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

          {/* Connection info */}
          <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Terhubung ke ESP32 via Supabase · Perubahan langsung diterapkan</span>
          </div>

        </div>

        {/* Right Selection List */}
        <div className="w-[200px] flex flex-col items-end justify-center gap-6 shrink-0 relative pr-0">
          {SENSORS.map(sensor => {
            const Icon = sensor.icon;
            const isActive = activeSensorId === sensor.id;

            if (isActive) {
              const parts = sensor.label.split(' ');
              return (
                <div key={sensor.id} className={`${isAutoMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-[#385344]'} text-white rounded-l-[50px] p-3 pl-4 pr-12 w-[115%] mr-[-15%] flex items-center gap-4 shadow-lg z-10 transition-colors -ml-10`}>
                  <div className="w-14 h-14 bg-[#D9D9D9] dark:bg-gray-300 rounded-full shrink-0 flex items-center justify-center">
                    <Icon className={`w-7 h-7 ${sensor.color}`} />
                  </div>
                  <div className="flex flex-col text-[17px] font-medium leading-tight">
                    {parts.map((part, index) => (
                      <span key={index}>{part}</span>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={sensor.id}
                onClick={() => setActiveSensorId(sensor.id)}
                className="w-14 h-14 bg-[#D9D9D9] mr-8 dark:bg-gray-700 rounded-full cursor-pointer hover:scale-105 transition-all hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center shadow-sm"
                title={sensor.label}
              >
                <Icon className={`w-6 h-6 ${sensor.color}`} />
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
