import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Sparkles, ThermometerSun, Droplets, SunMedium, FlaskConical, Waves, Thermometer, ArrowRight, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Sensor thresholds as reference (optimal ranges for hydroponics)
const SENSOR_OPTIMAL = {
  suhu:       { min: 18, max: 24, unit: '°C',  label: 'Suhu Rumah Kaca',  icon: ThermometerSun, iconColor: 'text-orange-500', iconBg: 'bg-orange-50 dark:bg-orange-500/10' },
  humidity:   { min: 50, max: 70, unit: '%',   label: 'Kelembapan',        icon: Droplets,       iconColor: 'text-blue-500',   iconBg: 'bg-blue-50 dark:bg-blue-500/10'   },
  ph:         { min: 6.0, max: 7.0, unit: '',  label: 'pH',                icon: FlaskConical,   iconColor: 'text-purple-500', iconBg: 'bg-purple-50 dark:bg-purple-500/10'},
  light:      { min: 150, max: 600, unit: ' lux', label: 'Intensitas Cahaya', icon: SunMedium, iconColor: 'text-yellow-500', iconBg: 'bg-yellow-50 dark:bg-yellow-500/10'},
};

function buildRecommendations(forecastData) {
  if (!forecastData?.current_hour) return null;
  const ch = forecastData.current_hour;

  const items = [
    {
      id: 'suhu',
      key: 'suhu',
      currentValue: ch.suhu,
      ...SENSOR_OPTIMAL.suhu,
    },
    {
      id: 'humidity',
      key: 'humidity',
      currentValue: ch.humidity != null ? (ch.humidity > 1.5 ? ch.humidity : ch.humidity * 100) : null,
      ...SENSOR_OPTIMAL.humidity,
    },
    {
      id: 'ph',
      key: 'ph',
      currentValue: ch.ph,
      ...SENSOR_OPTIMAL.ph,
    },
    {
      id: 'light',
      key: 'light_intensity',
      currentValue: ch.light_intensity,
      ...SENSOR_OPTIMAL.light,
    },
  ];

  return items.map(item => {
    const val = item.currentValue != null ? Number(item.currentValue) : null;
    const needsAdjust = val !== null && (val < item.min || val > item.max);
    return { ...item, currentValue: val, needsAdjust };
  });
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(false);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const nowIso = new Date().toISOString();
      const res = await fetch(`${API_BASE}/api/forecast?hours=1&now=${encodeURIComponent(nowIso)}`);
      if (!res.ok) throw new Error('Forecast API error');
      const json = await res.json();
      setForecast(json);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and every 5 minutes
  useEffect(() => {
    fetchForecast();
    const t = setInterval(fetchForecast, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchForecast]);

  const recommendations = buildRecommendations(forecast);
  const adjustCount = recommendations?.filter(r => r.needsAdjust).length ?? 0;

  const handleItemClick = () => {
    setIsOpen(false);
    navigate('/brain');
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Updating...';
    const diffMs = Date.now() - lastUpdated.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    return `${diffMin} min ago`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-2.5 rounded-full transition-all cursor-pointer relative"
      >
        <Bell className="w-[22px] h-[22px] stroke-[2]" />
        {adjustCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {adjustCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[380px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-[fadeSlideDown_0.2s_ease-out]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-gray-800 dark:text-gray-100 leading-tight">ML Predictions</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Suggested threshold adjustments</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); fetchForecast(); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification Items */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading && !forecast ? (
              /* Loading skeleton */
              <div className="flex flex-col gap-0">
                {[1, 2, 3].map(i => (
                  <div key={i} className="px-5 py-4 border-b border-gray-50 dark:border-gray-700/50 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded w-3/4" />
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* Error state */
              <div className="flex flex-col items-center py-8 px-5 gap-3">
                <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                  <span className="text-red-400 text-lg">⚠</span>
                </div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center">
                  Tidak dapat terhubung ke FastAPI.<br/>Pastikan server berjalan di port 8000.
                </p>
                <button
                  onClick={fetchForecast}
                  className="text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Coba lagi
                </button>
              </div>
            ) : (
              (recommendations || []).map((rec) => {
                const Icon = rec.icon;
                return (
                  <button
                    key={rec.id}
                    onClick={handleItemClick}
                    className={`w-full text-left px-5 py-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors last:border-b-0 cursor-pointer group ${
                      rec.needsAdjust ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Sensor Icon */}
                      <div className={`w-9 h-9 ${rec.iconBg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-4.5 h-4.5 ${rec.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{rec.label}</span>
                          {rec.needsAdjust && (
                            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase rounded-full tracking-wider">Perlu Adjust</span>
                          )}
                          {!rec.needsAdjust && rec.currentValue !== null && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase rounded-full tracking-wider">Normal</span>
                          )}
                        </div>

                        {/* Current forecast value */}
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="text-gray-400 dark:text-gray-500">Prediksi saat ini:</span>
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {rec.currentValue != null ? `${Number(rec.currentValue).toFixed(1)}${rec.unit}` : '—'}
                          </span>
                        </div>

                        {/* Optimal range */}
                        <div className="flex items-center gap-2 text-[12px] mt-0.5">
                          <span className="text-emerald-500 dark:text-emerald-400">Optimal:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {rec.min} – {rec.max}{rec.unit}
                          </span>
                          {rec.needsAdjust && (
                            <span className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">⚠ adjust</span>
                          )}
                        </div>
                      </div>

                      {/* Arrow icon on hover */}
                      <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer — View All button */}
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {error ? 'FastAPI offline' : `Based on PatchTST · ${formatLastUpdated()}`}
            </p>
            <button
              onClick={handleItemClick}
              className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
