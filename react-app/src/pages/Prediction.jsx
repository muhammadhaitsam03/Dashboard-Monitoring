import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Sparkles,
  Clock,
  ThermometerSun,
  Droplets,
  SunMedium,
  FlaskConical,
  Waves,
  Thermometer,
  CloudSun,
  CloudRain,
  CloudLightning
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';

import { useAuth } from '../context/AuthContext';
import { useSensorData } from '../hooks/useSensorData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatHour = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}.00`;
};

const buildNext24HourLabels = () => {
  const base = new Date();
  base.setMinutes(0, 0, 0);
  return Array.from({ length: 24 }, (_, i) => {
    const d = new Date(base.getTime() + i * 60 * 60 * 1000);
    return {
      idx: i,
      time: `${String(d.getHours()).padStart(2, '0')}.00`,
      suhu: null,
      humidity: null,
      cuaca_label: 'unknown'
    };
  });
};

const weatherIcon = (label) => {
  if (label === 'rain') return <CloudRain className="w-4 h-4" />;
  if (label === 'storm') return <CloudLightning className="w-4 h-4" />;
  if (label === 'cloudy') return <CloudSun className="w-4 h-4" />;
  return <Sun className="w-4 h-4" />;
};

const computeLast24hHourly = (rawData, dbKey) => {
  if (!rawData?.length) {
    return Array.from({ length: 24 }, (_, i) => ({ time: i, label: `${String(i).padStart(2, '0')}.00`, value: null }));
  }
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const buckets = Array.from({ length: 24 }, (_, i) => ({ time: i, label: `${String(i).padStart(2, '0')}.00`, sum: 0, count: 0 }));

  rawData.forEach((row) => {
    const d = new Date(row.created_at);
    if (Number.isNaN(d.getTime())) return;
    if (d < start || d > end) return;
    const hourIndex = Math.min(23, Math.max(0, Math.floor((d.getTime() - start.getTime()) / (60 * 60 * 1000))));
    const n = safeNum(row?.[dbKey]);
    if (n === null) return;
    buckets[hourIndex].sum += n;
    buckets[hourIndex].count += 1;
  });

  return buckets.map((b) => ({ time: b.time, label: b.label, value: b.count ? Number((b.sum / b.count).toFixed(2)) : null }));
};

function MiniCard({ title, value, unit, icon, colorClass = "from-emerald-500 to-green-500", iconColor = "text-emerald-500", bgLight = "bg-emerald-50", bgDark = "dark:bg-emerald-500/10" }) {
  return (
    <div className={`relative overflow-hidden bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[22px] p-5 border border-white/40 dark:border-gray-700/50 flex flex-col justify-between min-h-[140px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group`}>
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${colorClass} opacity-10 dark:opacity-20 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-30`}></div>
      <div className="flex justify-between items-start relative z-10 w-full mb-5">
        <h3 className="text-[15px] font-medium text-gray-700 dark:text-gray-300 leading-snug tracking-wide">{title}</h3>
        {icon && (
          <div className={`p-2.5 rounded-2xl ${bgLight} ${bgDark} shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 ml-2 shrink-0 border border-white/50 dark:border-gray-700/30`}>
            {React.cloneElement(icon, { className: `w-5 h-5 ${iconColor} stroke-[2.5]` })}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight drop-shadow-sm leading-none">
          {value ?? '—'}
        </span>
        {unit ? <span className="text-base font-medium text-gray-400 dark:text-gray-500 ml-1 mb-1">{unit}</span> : null}
      </div>
    </div>
  );
}

function SimpleTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 shadow-lg">
      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      <div className="text-[14px] font-bold text-gray-800 dark:text-gray-100">{v ?? '—'}{unit}</div>
    </div>
  );
}

export default function Prediction() {
  const { isDark, toggleTheme } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rawData } = useSensorData();

  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [recoLoading, setRecoLoading] = useState(false);

  const latestSensor = useMemo(() => {
    if (!rawData?.length) return null;
    return rawData[rawData.length - 1];
  }, [rawData]);

  const currentCards = useMemo(() => {
    // DB_MAP in History.jsx uses kebab-case keys; keep same convention here
    const suhu = safeNum(latestSensor?.['suhu-rumah-kaca']);
    const kelembapan = safeNum(latestSensor?.['kelembapan']);
    const intensitas = safeNum(latestSensor?.['intensitas-cahaya']);
    const ph = safeNum(latestSensor?.['ph']);
    const tds = safeNum(latestSensor?.['tds']);
    const suhuLarutan = safeNum(latestSensor?.['suhu-larutan']);
    return { suhu, kelembapan, intensitas, ph, tds, suhuLarutan };
  }, [latestSensor]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setForecastLoading(true);
        const nowIso = new Date().toISOString();
        const res = await fetch(`${API_BASE}/api/forecast?hours=24&now=${encodeURIComponent(nowIso)}`);
        if (!res.ok) throw new Error(`Forecast API ${res.status}`);
        const json = await res.json();
        if (!cancelled) setForecast(json);
      } catch {
        if (!cancelled) setForecast(null);
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    };
    run();
    const t = setInterval(run, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const last24Charts = useMemo(() => {
    return {
      temperature: computeLast24hHourly(rawData, 'suhu-rumah-kaca'),
      humidity: computeLast24hHourly(rawData, 'kelembapan'),
      light: computeLast24hHourly(rawData, 'intensitas-cahaya'),
      ph: computeLast24hHourly(rawData, 'ph'),
      tds: computeLast24hHourly(rawData, 'tds'),
      suhuLarutan: computeLast24hHourly(rawData, 'suhu-larutan')
    };
  }, [rawData]);

  const forecastNext = useMemo(() => {
    const arr = forecast?.next || [];
    const mapped = arr.slice(0, 24).map((r, idx) => ({
      idx,
      time: formatHour(r.time),
      suhu: safeNum(r.suhu),
      humidity: safeNum(r.humidity),
      cuaca_label: r.cuaca_label || 'unknown'
    }));
    return mapped.length ? mapped : buildNext24HourLabels();
  }, [forecast]);

  useEffect(() => {
    const run = async () => {
      if (!forecast?.next?.length || !latestSensor) return;
      try {
        setRecoLoading(true);
        const payload = {
          current: {
            suhu_rumah_kaca: currentCards.suhu,
            kelembapan: currentCards.kelembapan,
            intensitas_cahaya: currentCards.intensitas,
            ph: currentCards.ph,
            tds: currentCards.tds,
            suhu_larutan: currentCards.suhuLarutan,
            created_at: latestSensor?.created_at
          },
          forecast: (forecast?.next || []).slice(0, 24)
        };
        const res = await fetch(`${API_BASE}/api/recommendation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        setRecommendation(json);
      } catch {
        setRecommendation(null);
      } finally {
        setRecoLoading(false);
      }
    };
    run();
  }, [forecast, latestSensor, currentCards]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto px-6 md:px-10 lg:px-14 py-8 md:py-10 animate-page-enter relative z-0">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-teal-200/20 dark:bg-teal-900/15 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Top Header */}
      <header className="flex justify-between items-center mb-10 mt-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Machine Learning</h1>

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

          <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

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

      <div className="w-full flex flex-col gap-6 pb-16">

        {/* Section Title with accent bar */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-wide">Prediksi dan Rekomendasi</h2>
        </div>

        {/* AI Plant Assistant Banner */}
        <div id="tour-brain-assistant" className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600 rounded-full flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 leading-snug">AI Plant Assistant</h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Real-time analysis and recommendations</p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-[13px] text-gray-400 dark:text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Last updated: {latestSensor?.created_at ? new Date(latestSensor.created_at).toLocaleString() : '—'} · page refreshes every 60s
          </span>
        </div>

        {/* Live Monitoring Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <MiniCard
            title="Suhu Rumah Kaca"
            value={currentCards.suhu}
            unit="°C"
            icon={<ThermometerSun />}
            colorClass="from-orange-500 to-red-500"
            iconColor="text-orange-500"
            bgLight="bg-orange-50"
            bgDark="dark:bg-orange-500/10"
          />
          <MiniCard
            title="Kelembapan"
            value={currentCards.kelembapan}
            unit="%"
            icon={<Droplets />}
            colorClass="from-blue-400 to-cyan-500"
            iconColor="text-blue-500"
            bgLight="bg-blue-50"
            bgDark="dark:bg-blue-500/10"
          />
          <MiniCard
            title="Intensitas Cahaya"
            value={currentCards.intensitas}
            unit="lux"
            icon={<SunMedium />}
            colorClass="from-yellow-400 to-amber-500"
            iconColor="text-yellow-500"
            bgLight="bg-yellow-50"
            bgDark="dark:bg-yellow-500/10"
          />
          <MiniCard
            title="pH"
            value={currentCards.ph}
            unit=""
            icon={<FlaskConical />}
            colorClass="from-purple-500 to-pink-500"
            iconColor="text-purple-500"
            bgLight="bg-purple-50"
            bgDark="dark:bg-purple-500/10"
          />
          <MiniCard
            title="TDS"
            value={currentCards.tds}
            unit="ppm"
            icon={<Waves />}
            colorClass="from-teal-400 to-emerald-500"
            iconColor="text-teal-500"
            bgLight="bg-teal-50"
            bgDark="dark:bg-teal-500/10"
          />
          <MiniCard
            title="Suhu Larutan"
            value={currentCards.suhuLarutan}
            unit="°C"
            icon={<Thermometer />}
            colorClass="from-rose-400 to-red-500"
            iconColor="text-rose-500"
            bgLight="bg-rose-50"
            bgDark="dark:bg-rose-500/10"
          />
        </div>

        {/* Predicted for this hour */}
        <div className="bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40 rounded-2xl px-7 py-5 transition-all hover:shadow-md">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2">
            Predicted for this hour
            <span className="font-normal text-gray-500 dark:text-gray-400 ml-2 text-[13px]">
              ({forecast?.current_hour?.time ? new Date(forecast.current_hour.time).toLocaleString() : '—'}, from prediction_forecast.csv)
            </span>
          </h3>
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
            {forecastLoading ? (
              'Loading forecast…'
            ) : forecast?.current_hour ? (
              <>
                Temperature {safeNum(forecast.current_hour.suhu)?.toFixed?.(1) ?? '—'}°C, {forecast.current_hour.cuaca_label},
                humidity {safeNum(forecast.current_hour.humidity)?.toFixed?.(2) ?? '—'} (0–1),
                light {safeNum(forecast.current_hour.light_intensity)?.toFixed?.(0) ?? '—'},
                pH {safeNum(forecast.current_hour.ph)?.toFixed?.(2) ?? '—'}.
              </>
            ) : (
              'Forecast unavailable.'
            )}
          </p>
        </div>

        {/* Current conditions (realtime) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl px-7 py-5 transition-all hover:shadow-md">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2">
            Current conditions (realtime)
          </h3>
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
            {latestSensor ? (
              <>
                Suhu {currentCards.suhu ?? '—'}°C. Kelembapan {currentCards.kelembapan ?? '—'}%. Intensitas cahaya {currentCards.intensitas ?? '—'} lux. pH {currentCards.ph ?? '—'}.
              </>
            ) : (
              'Waiting for realtime sensor readings…'
            )}
          </p>
        </div>

        {/* Weather forecast graphic */}
        <div id="tour-brain-forecast" className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-md border border-gray-100 dark:border-gray-700/50 rounded-2xl px-7 py-6 transition-all hover:shadow-md">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2">
            Weather forecast (next 24 hours)
          </h3>
          <div className="mt-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastNext} margin={{ top: 10, right: 18, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(75,85,99,0.25)' : 'rgba(229,231,235,0.8)'} vertical={false} />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                  tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} domain={[0, 1]} />
                <Tooltip content={<SimpleTooltip unit="" />} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="suhu" name="Temp (°C)" stroke={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (0–1)" stroke={isDark ? '#34D399' : '#059669'} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-gray-500 dark:text-gray-400">
            {(forecastNext || []).slice(0, 8).map((r) => (
              <div key={`${r.time}-${r.idx}`} className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 rounded-full px-3 py-1">
                {weatherIcon(r.cuaca_label)}
                <span className="font-medium">{r.time}</span>
                <span className="opacity-80">{r.cuaca_label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-md border border-gray-100 dark:border-gray-700/50 rounded-2xl px-7 py-6 transition-all hover:shadow-md">
          <h3 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 mb-3">
            Recommendation
          </h3>
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-[1.8]">
            {recoLoading ? (
              'Generating recommendation…'
            ) : recommendation?.text ? (
              recommendation.text
            ) : (
              'Recommendation unavailable.'
            )}
          </p>
        </div>

        {/* Last 24 hours charts */}
        <div className="bg-white/60 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-700/40 rounded-2xl px-7 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-wide">Data 24 Jam (realtime)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-gray-100/80 dark:border-gray-700/40">
              <div className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 mb-3">Suhu Rumah Kaca</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last24Charts.temperature} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(75,85,99,0.25)' : 'rgba(229,231,235,0.8)'} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <Tooltip content={<SimpleTooltip unit="°C" />} />
                    <Area type="monotone" dataKey="value" stroke={isDark ? '#FB923C' : '#F97316'} strokeWidth={2.5} fill={isDark ? 'rgba(251,146,60,0.18)' : 'rgba(249,115,22,0.12)'} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-gray-100/80 dark:border-gray-700/40">
              <div className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 mb-3">Kelembapan</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last24Charts.humidity} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(75,85,99,0.25)' : 'rgba(229,231,235,0.8)'} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <Tooltip content={<SimpleTooltip unit="%" />} />
                    <Area type="monotone" dataKey="value" stroke={isDark ? '#60A5FA' : '#3B82F6'} strokeWidth={2.5} fill={isDark ? 'rgba(96,165,250,0.18)' : 'rgba(59,130,246,0.12)'} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-gray-100/80 dark:border-gray-700/40">
              <div className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 mb-3">Intensitas Cahaya</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last24Charts.light} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(75,85,99,0.25)' : 'rgba(229,231,235,0.8)'} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <Tooltip content={<SimpleTooltip unit=" lux" />} />
                    <Area type="monotone" dataKey="value" stroke={isDark ? '#FACC15' : '#EAB308'} strokeWidth={2.5} fill={isDark ? 'rgba(250,204,21,0.18)' : 'rgba(234,179,8,0.12)'} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 border border-gray-100/80 dark:border-gray-700/40">
              <div className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 mb-3">pH</div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last24Charts.ph} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(75,85,99,0.25)' : 'rgba(229,231,235,0.8)'} vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }} />
                    <Tooltip content={<SimpleTooltip unit="" />} />
                    <Area type="monotone" dataKey="value" stroke={isDark ? '#C084FC' : '#A855F7'} strokeWidth={2.5} fill={isDark ? 'rgba(192,132,252,0.18)' : 'rgba(168,85,247,0.12)'} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="mt-4 text-[12px] text-gray-500 dark:text-gray-400">
            TDS dan Suhu Larutan akan ditambahkan penuh ke model nanti; kartu & chart akan otomatis terisi jika datanya sudah masuk ke `sensor_readings`.
          </div>
        </div>

      </div>
    </div>
  );
}
