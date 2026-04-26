import React, { useMemo, useRef, useState as useStateReact } from 'react';
import { exportSensorToExcel } from '../utils/exportToExcel';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Sun,
  Moon,
  Download,
  ThermometerSun,
  Droplets,
  SunMedium,
  FlaskConical,
  Waves,
  Thermometer,
  Loader2
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';
import { useSensorData } from '../hooks/useSensorData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { useAuth } from '../context/AuthContext';

// DB column name mapping
const DB_MAP = {
  'Suhu Rumah Kaca': 'suhu-rumah-kaca',
  'Kelembapan': 'kelembapan',
  'Intensitas Cahaya': 'intensitas-cahaya',
  'pH': 'ph',
  'TDS': 'tds',
  'Suhu Larutan': 'suhu-larutan'
};

// Optimal ranges for plant growth
const optimalRanges = {
  'Suhu Rumah Kaca': [20, 25],
  'Kelembapan': [80, 90],
  'Intensitas Cahaya': [2152, 4305],
  'pH': [5, 7],
  'TDS': [500, 1800],
  'Suhu Larutan': [22, 24]
};

// Color themes for each chart
const chartThemes = {
  'Suhu Rumah Kaca': { light: '#F97316', dark: '#FB923C', gradient: ['#F97316', '#FED7AA'] },
  'Kelembapan': { light: '#3B82F6', dark: '#60A5FA', gradient: ['#3B82F6', '#BFDBFE'] },
  'Intensitas Cahaya': { light: '#EAB308', dark: '#FACC15', gradient: ['#EAB308', '#FEF08A'] },
  'pH': { light: '#A855F7', dark: '#C084FC', gradient: ['#A855F7', '#E9D5FF'] },
  'TDS': { light: '#14B8A6', dark: '#2DD4BF', gradient: ['#14B8A6', '#99F6E4'] },
  'Suhu Larutan': { light: '#F43F5E', dark: '#FB7185', gradient: ['#F43F5E', '#FECDD3'] }
};

// Process raw data into 24-hour chart buckets
function processChartData(rawData, dbKey) {
  const now = new Date();
  const buckets = Array(24).fill().map((_, i) => ({ time: i, value: null, sum: 0, count: 0 }));

  rawData.forEach(row => {
    const d = new Date(row.created_at);
    if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const hour = d.getHours();
      const val = row[dbKey];
      if (val !== undefined && val !== null) {
        buckets[hour].sum += val;
        buckets[hour].count++;
      }
    }
  });

  return buckets.map(b => ({
    time: b.time,
    value: b.count > 0 ? parseFloat((b.sum / b.count).toFixed(2)) : null
  }));
}

// Get latest sensor value from raw data
function getLatestValue(rawData, dbKey) {
  if (!rawData || rawData.length === 0) return null;
  // rawData is sorted ascending by created_at, so last element is newest
  for (let i = rawData.length - 1; i >= 0; i--) {
    const val = rawData[i][dbKey];
    if (val !== undefined && val !== null) {
      return parseFloat(val).toFixed(1);
    }
  }
  return null;
}

const CustomAxisTick = ({ x, y, payload, timeRange }) => {
  let left = "00.00", mid = "12.00", right = "24.00";

  if (timeRange === 'per-day') { left = "00.00"; mid = "12.00"; right = "23.59"; }
  if (timeRange === 'per-week') { left = "Mon"; mid = "Thu"; right = "Sun"; }
  if (timeRange === 'per-month') { left = "1st"; mid = "15th"; right = "30th"; }

  if (payload.value === 0) return <text x={x} y={y + 16} textAnchor="start" fill="#9CA3AF" fontSize={11} fontWeight={500}>{left}</text>;
  if (payload.value === 12) return <text x={x} y={y + 16} textAnchor="middle" fill="#9CA3AF" fontSize={11} fontWeight={500}>{mid}</text>;
  if (payload.value === 23) return <text x={x} y={y + 16} textAnchor="end" fill="#9CA3AF" fontSize={11} fontWeight={500}>{right}</text>;
  return null;
};

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        minWidth: '90px'
      }}>
        <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '4px', fontWeight: 500 }}>
          {`${String(label).padStart(2, '0')}.00`}
        </p>
        <p style={{ fontSize: '16px', fontWeight: 700, color: color, letterSpacing: '-0.02em' }}>
          {payload[0].value !== null ? `${payload[0].value}${unit}` : '—'}
        </p>
      </div>
    );
  }
  return null;
};

const HistoryChart = ({ title, data, yDomain, isDark, unit = '', optimalRange }) => {
  const theme = chartThemes[title] || chartThemes['Suhu Rumah Kaca'];
  const lineColor = isDark ? theme.dark : theme.light;
  const gradientId = `gradient-${title.replace(/\s/g, '-')}`;
  const chartContainerRef = useRef(null);
  const [isExporting, setIsExporting] = useStateReact(false);

  const yMin = yDomain[0];
  const yMax = yDomain[1];
  const yMid = parseFloat(((yMin + yMax) / 2).toFixed(1));
  const betterYTicks = [yMin, yMid, yMax];

  // Compute min, max, average from actual data points
  const validValues = data.filter(d => d.value !== null).map(d => d.value);
  const stats = validValues.length > 0
    ? {
        min: Math.min(...validValues).toFixed(1),
        max: Math.max(...validValues).toFixed(1),
        avg: (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1),
        hasData: true,
      }
    : { min: '—', max: '—', avg: '—', hasData: false };

  const handleDownloadExcel = async () => {
    setIsExporting(true);
    try {
      await exportSensorToExcel({
        title,
        data,
        unit,
        chartRef: chartContainerRef.current,
      });
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 pb-4 border border-gray-100/80 dark:border-gray-700/40 flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 group">
      <div className="flex justify-between items-center w-full mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lineColor }}></div>
          <h3 className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 tracking-wide">{title}</h3>
        </div>
        <button
          onClick={handleDownloadExcel}
          disabled={isExporting}
          title={`Download ${title} (.xlsx)`}
          className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-wait"
        >
          {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} strokeWidth={2} />}
        </button>
      </div>
      <div ref={chartContainerRef} className="w-full h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={isDark ? 0.25 : 0.15} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(75,85,99,0.3)' : 'rgba(229,231,235,0.8)'}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={<CustomAxisTick timeRange="per-hour" />}
              domain={[0, 23]}
              type="number"
            />
            <YAxis
              domain={yDomain}
              ticks={betterYTicks}
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }}
            />
            <Tooltip
              content={<CustomTooltip unit={unit} color={lineColor} />}
              cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.4 }}
            />
            {optimalRange && (
              <>
                <ReferenceLine
                  y={optimalRange[0]}
                  stroke={isDark ? '#22c55e' : '#16a34a'}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  label={{
                    value: optimalRange[0],
                    position: 'left',
                    fill: isDark ? '#4ade80' : '#16a34a',
                    fontSize: 10,
                    fontWeight: 600,
                    offset: 8
                  }}
                />
                <ReferenceLine
                  y={optimalRange[1]}
                  stroke={isDark ? '#22c55e' : '#16a34a'}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  label={{
                    value: optimalRange[1],
                    position: 'left',
                    fill: isDark ? '#4ade80' : '#16a34a',
                    fontSize: 10,
                    fontWeight: 600,
                    offset: 8
                  }}
                />
              </>
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: lineColor,
                stroke: isDark ? '#1a1f2e' : '#ffffff',
                strokeWidth: 2.5
              }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row: Min, Max, Rata-Rata */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/40">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Min</span>
          <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200 ml-0.5">{stats.min}<span className="text-[10px] font-medium text-gray-400 ml-0.5">{stats.hasData ? unit.trim() : ''}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Maks</span>
          <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200 ml-0.5">{stats.max}<span className="text-[10px] font-medium text-gray-400 ml-0.5">{stats.hasData ? unit.trim() : ''}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lineColor }}></div>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Rata-Rata</span>
          <span className="text-[13px] font-bold text-gray-700 dark:text-gray-200 ml-0.5">{stats.avg}<span className="text-[10px] font-medium text-gray-400 ml-0.5">{stats.hasData ? unit.trim() : ''}</span></span>
        </div>
      </div>
    </div>
  );
};

function ReadingCard({ title, value, unit, icon, colorClass = "from-emerald-500 to-green-500", iconColor = "text-emerald-500", bgLight = "bg-emerald-50", bgDark = "dark:bg-emerald-500/10", loading }) {
  return (
    <div className={`relative overflow-hidden bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[24px] p-6 border border-white/40 dark:border-gray-700/50 flex flex-col justify-between min-h-[160px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group`}>
      {/* Soft gradient background hint */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClass} opacity-10 dark:opacity-20 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-30`}></div>

      <div className="flex justify-between items-start relative z-10 w-full mb-6">
        <h3 className="text-[17px] font-medium text-gray-700 dark:text-gray-300 leading-snug tracking-wide">{title}</h3>
        {icon && (
          <div className={`p-2.5 rounded-2xl ${bgLight} ${bgDark} shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 ml-2 shrink-0 border border-white/50 dark:border-gray-700/30`}>
            {React.cloneElement(icon, { className: `w-5 h-5 ${iconColor} stroke-[2.5]` })}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 relative z-10">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : (
          <>
            <span className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight drop-shadow-sm leading-none">{value ?? '—'}</span>
            {unit && (
              <span className="text-lg font-medium text-gray-400 dark:text-gray-500 ml-1 mb-1">{unit}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { isDark, toggleTheme } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rawData, loading } = useSensorData();

  // Get the latest value for each sensor
  const latestValues = useMemo(() => ({
    temperature: getLatestValue(rawData, DB_MAP['Suhu Rumah Kaca']),
    humidity: getLatestValue(rawData, DB_MAP['Kelembapan']),
    light: getLatestValue(rawData, DB_MAP['Intensitas Cahaya']),
    ph: getLatestValue(rawData, DB_MAP['pH']),
    tds: getLatestValue(rawData, DB_MAP['TDS']),
    suhuLarutan: getLatestValue(rawData, DB_MAP['Suhu Larutan']),
  }), [rawData]);

  // Process chart data for today's 24-hour view
  const chartData = useMemo(() => ({
    temperature: processChartData(rawData, DB_MAP['Suhu Rumah Kaca']),
    humidity: processChartData(rawData, DB_MAP['Kelembapan']),
    light: processChartData(rawData, DB_MAP['Intensitas Cahaya']),
    ph: processChartData(rawData, DB_MAP['pH']),
    tds: processChartData(rawData, DB_MAP['TDS']),
    suhuLarutan: processChartData(rawData, DB_MAP['Suhu Larutan']),
  }), [rawData]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto px-6 md:px-10 lg:px-14 py-8 md:py-10 animate-page-enter relative z-0">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-blue-200/20 dark:bg-blue-900/15 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Top Header */}
      <header className="flex justify-between items-center mb-10 mt-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Dashboard Monitoring</h1>

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

      <div className="max-w-7xl mx-auto w-full">
        {/* Current Reading */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-wide">Live Monitoring</h2>
            {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin ml-1" />}
            {!loading && rawData.length > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Live dari Supabase</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            <ReadingCard
              title="Suhu Rumah Kaca" value={latestValues.temperature} unit="°C"
              icon={<ThermometerSun />}
              colorClass="from-orange-500 to-red-500" iconColor="text-orange-500" bgLight="bg-orange-50" bgDark="dark:bg-orange-500/10"
              loading={loading}
            />
            <ReadingCard
              title="Kelembapan" value={latestValues.humidity} unit="%"
              icon={<Droplets />}
              colorClass="from-blue-400 to-cyan-500" iconColor="text-blue-500" bgLight="bg-blue-50" bgDark="dark:bg-blue-500/10"
              loading={loading}
            />
            <ReadingCard
              title="Intensitas Cahaya" value={latestValues.light} unit="lux"
              icon={<SunMedium />}
              colorClass="from-yellow-400 to-amber-500" iconColor="text-yellow-500" bgLight="bg-yellow-50" bgDark="dark:bg-yellow-500/10"
              loading={loading}
            />
            <ReadingCard
              title="pH" value={latestValues.ph} unit=""
              icon={<FlaskConical />}
              colorClass="from-purple-500 to-pink-500" iconColor="text-purple-500" bgLight="bg-purple-50" bgDark="dark:bg-purple-500/10"
              loading={loading}
            />
            <ReadingCard
              title="TDS" value={latestValues.tds} unit="ppm"
              icon={<Waves />}
              colorClass="from-teal-400 to-emerald-500" iconColor="text-teal-500" bgLight="bg-teal-50" bgDark="dark:bg-teal-500/10"
              loading={loading}
            />
            <ReadingCard
              title="Suhu Larutan" value={latestValues.suhuLarutan} unit="°C"
              icon={<Thermometer />}
              colorClass="from-rose-400 to-red-500" iconColor="text-rose-500" bgLight="bg-rose-50" bgDark="dark:bg-rose-500/10"
              loading={loading}
            />
          </div>
        </section>

        {/* 24-Hour History */}
        <section className="pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-wide">Data 24 Jam</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-12">
            <HistoryChart
              title="Suhu Rumah Kaca"
              data={chartData.temperature}
              yDomain={[15, 30]}
              isDark={isDark}
              unit="°C"
              optimalRange={optimalRanges['Suhu Rumah Kaca']}
            />
            <HistoryChart
              title="Kelembapan"
              data={chartData.humidity}
              yDomain={[50, 100]}
              isDark={isDark}
              unit="%"
              optimalRange={optimalRanges['Kelembapan']}
            />
            <HistoryChart
              title="Intensitas Cahaya"
              data={chartData.light}
              yDomain={[1500, 5000]}
              isDark={isDark}
              unit=" lux"
              optimalRange={optimalRanges['Intensitas Cahaya']}
            />
            <HistoryChart
              title="pH"
              data={chartData.ph}
              yDomain={[3, 9]}
              isDark={isDark}
              unit=""
              optimalRange={optimalRanges['pH']}
            />
            <HistoryChart
              title="TDS"
              data={chartData.tds}
              yDomain={[300, 2000]}
              isDark={isDark}
              unit=" ppm"
              optimalRange={optimalRanges['TDS']}
            />
            <HistoryChart
              title="Suhu Larutan"
              data={chartData.suhuLarutan}
              yDomain={[20, 30]}
              isDark={isDark}
              unit="°C"
              optimalRange={optimalRanges['Suhu Larutan']}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
