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
  Check
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';

const SENSORS = [
  { id: 'suhu_rumah_kaca', label: 'Suhu Rumah Kaca', icon: ThermometerSun, unit: '°C', defaultMin: 20, defaultMax: 27, color: 'text-orange-500' },
  { id: 'kelembapan', label: 'Kelembapan', icon: Droplets, unit: '%', defaultMin: 60, defaultMax: 80, color: 'text-blue-500' },
  { id: 'intensitas_cahaya', label: 'Intensitas Cahaya', icon: SunMedium, unit: 'lux', defaultMin: 300, defaultMax: 500, color: 'text-yellow-500' },
  { id: 'ph', label: 'pH', icon: FlaskConical, unit: '', defaultMin: 5.5, defaultMax: 6.5, color: 'text-purple-500' },
  { id: 'tds', label: 'TDS', icon: Waves, unit: 'ppm', defaultMin: 400, defaultMax: 600, color: 'text-teal-500' },
  { id: 'suhu_larutan', label: 'Suhu Larutan', icon: Thermometer, unit: '°C', defaultMin: 18, defaultMax: 24, color: 'text-rose-500' },
];

const ThresholdInput = ({ type, value, onUpdate, step }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync when prop changes from outside
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
      className="text-[22px] text-gray-800 dark:text-gray-200 bg-transparent outline-none w-[60px] text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      step={step}
    />
  );
};

import { useAuth } from '../context/AuthContext';

export default function Threshold() {
  const { isDark, toggleTheme } = useOutletContext();
  const [activeSensorId, setActiveSensorId] = useState('suhu_rumah_kaca');
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const activeSensor = SENSORS.find(s => s.id === activeSensorId);
  const currentThreshold = thresholds[activeSensorId];
  const saved = savedThresholds[activeSensorId];
  const hasChanges = currentThreshold.min !== saved.min || currentThreshold.max !== saved.max;

  const handleUpdateThreshold = (type, delta) => {
    const step = activeSensor.unit === '' ? 0.1 : 1;
    setThresholds(prev => {
      const current = prev[activeSensorId];
      let newValue = +(current[type] + delta).toFixed(1);

      // Enforce min < max constraint (they cannot be equal)
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
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const step = activeSensor.unit === '' ? 0.1 : 1;
      let clamped = +num.toFixed(1);
      const current = thresholds[activeSensorId];

      // Enforce min < max constraint (they cannot be equal)
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

  const handleSetThreshold = () => {
    setSavedThresholds(prev => ({
      ...prev,
      [activeSensorId]: { ...currentThreshold }
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden animate-page-enter relative z-0">

      {/* Soft Decorative Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-[#1E463A]/5 dark:bg-[#1E463A]/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Top Header */}
      <header className="flex justify-between items-center px-6 md:px-10 lg:px-14 pt-8 md:pt-10 mb-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Threshold Sensor</h1>

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

          {/* Big Placeholder Circle */}
          <div className="w-[380px] aspect-square bg-[#D9D9D9] dark:bg-gray-700 rounded-full mb-16 shadow-inner relative flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
            <activeSensor.icon className={`w-24 h-24 mb-4 ${activeSensor.color} drop-shadow-sm`} />
            <span className="text-xl font-medium uppercase tracking-widest">{activeSensor.label}</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gray-800 dark:text-gray-100">{saved.min} - {saved.max}</span>
              <span className="text-2xl font-semibold">{activeSensor.unit}</span>
            </div>
          </div>

          {/* Threshold Contols */}
          <div className="flex items-center gap-6">
            {/* Min Control */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center bg-[#D9D9D9] dark:bg-gray-700 rounded-full px-6 py-3 transition-colors gap-2 min-w-[140px] justify-between group">
                <div className="flex items-baseline gap-1 ml-2">
                  <ThresholdInput
                    type="min"
                    value={currentThreshold.min}
                    onUpdate={handleDirectInput}
                    step={activeSensor.unit === '' ? 0.1 : 1}
                  />
                  <span className="text-[16px] text-gray-500 dark:text-gray-400">{activeSensor.unit}</span>
                </div>
                <div className="flex flex-col">
                  <button onClick={() => handleUpdateThreshold('min', 1)} className="hover:text-green-600 transition-colors cursor-pointer"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                  <button onClick={() => handleUpdateThreshold('min', -1)} className="hover:text-red-600 transition-colors cursor-pointer"><ChevronDown className="w-4 h-4" /></button>
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
                  />
                  <span className="text-[16px] text-gray-500 dark:text-gray-400">{activeSensor.unit}</span>
                </div>
                <div className="flex flex-col">
                  <button onClick={() => handleUpdateThreshold('max', 1)} className="hover:text-green-600 transition-colors cursor-pointer"><ChevronDown className="w-4 h-4 rotate-180" /></button>
                  <button onClick={() => handleUpdateThreshold('max', -1)} className="hover:text-red-600 transition-colors cursor-pointer"><ChevronDown className="w-4 h-4" /></button>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Maximum</span>
            </div>
          </div>

          {/* Set Threshold Button */}
          <button
            onClick={handleSetThreshold}
            disabled={!hasChanges}
            className={`mt-6 px-8 py-3 rounded-full font-semibold text-sm uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-md ${hasChanges
                ? 'bg-[#385344] hover:bg-[#2d4438] text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-95'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Threshold Set!
              </>
            ) : (
              'Set Threshold'
            )}
          </button>

        </div>

        {/* Right Selection List */}
        <div className="w-[200px] flex flex-col items-end justify-center gap-6 shrink-0 relative pr-0">
          {SENSORS.map(sensor => {
            const Icon = sensor.icon;
            const isActive = activeSensorId === sensor.id;

            if (isActive) {
              const parts = sensor.label.split(' ');
              return (
                <div key={sensor.id} className="bg-[#385344] text-white rounded-l-[50px] p-3 pl-4 pr-12 w-[115%] mr-[-15%] flex items-center gap-4 shadow-lg z-10 transition-colors -ml-10">
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

