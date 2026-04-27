import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Sun,
  Moon,
  Download,
  CalendarDays
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

const CustomSelect = ({ value, onChange, options, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex items-center justify-between cursor-pointer select-none`}
      >
        <span className="truncate">{value}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 shrink-0 ml-1 opacity-60 ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
      </div>
      {isOpen && (
        <div className="absolute top-[110%] right-0 mt-1 min-w-[120px] max-h-[220px] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-1.5 animate-[fadeSlideDown_0.15s_ease-out] custom-scrollbar">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className={`px-3.5 py-2 text-[12px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors whitespace-nowrap ${value === opt ? 'font-semibold text-[#1E463A] bg-[#1E463A]/5 dark:text-emerald-400 dark:bg-emerald-900/10' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DB_MAP = {
  'Suhu Rumah Kaca': 'suhu-rumah-kaca',
  'Kelembapan': 'kelembapan',
  'Intensitas Cahaya': 'intensitas-cahaya',
  'pH': 'ph',
  'TDS': 'tds',
  'Suhu Larutan': 'suhu-larutan'
};

const formatDateToDDMMYYYY = (dateStringOrDate) => {
  if (!dateStringOrDate) return '';
  const d = new Date(dateStringOrDate);
  if (isNaN(d.getTime())) return dateStringOrDate;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const currentYearInt = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({length: 11}, (_, i) => String(currentYearInt - 5 + i));

const RANGE_OPTIONS = {
  Perjam: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}.00`),
  Perhari: ['1 Hari', '2 Hari', '3 Hari', '4 Hari', '5 Hari', '6 Hari'],
  Perminggu: ['1 Minggu', '2 Minggu', '3 Minggu', '4 Minggu', '5 Minggu'],
  Perbulan: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
};

const labelToIndex = (label, mode) => {
  if (mode === 'Perjam' || mode === 'Perbulan') {
    return RANGE_OPTIONS[mode].indexOf(label);
  }
  return 0;
};

const processSensorData = (rawData, dbKey, timeMode, targetDateStr, rangeStart, rangeEnd, spanLimit, selectedYear) => {
  if (!rawData || rawData.length === 0) return [];

  const now = targetDateStr ? new Date(`${targetDateStr}T00:00:00`) : new Date();

  if (timeMode === 'Perjam') {
    const buckets = Array(24).fill().map((_, i) => ({ time: i, label: `${String(i).padStart(2, '0')}.00`, sum: 0, count: 0, value: null }));
    rawData.forEach(row => {
      const d = new Date(row.created_at);
      if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const hour = d.getHours();
        if (row[dbKey] !== undefined && row[dbKey] !== null) {
          buckets[hour].sum += row[dbKey];
          buckets[hour].count++;
        }
      }
    });
    return buckets.map(b => ({ time: b.time, label: b.label, value: b.count > 0 ? parseFloat((b.sum / b.count).toFixed(2)) : null }));
  }

  if (timeMode === 'Perhari') {
    const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const start = new Date(`${targetDateStr}T00:00:00`);
    const spanDays = parseInt(spanLimit.split(' ')[0], 10) || 6;
    const end = new Date(start);
    end.setDate(start.getDate() + spanDays - 1);
    end.setHours(23, 59, 59, 999);
    
    const buckets = Array(spanDays).fill().map((_, i) => {
      const bDate = new Date(start);
      bDate.setDate(bDate.getDate() + i);
      const label = HARI_INDONESIA[bDate.getDay()];
      return { time: i, label, sum: 0, count: 0, value: null, targetDate: bDate.toDateString() };
    });

    rawData.forEach(row => {
      const d = new Date(row.created_at);
      if (d >= start && d <= end) {
        const dString = d.toDateString();
        const b = buckets.find(b => b.targetDate === dString);
        if (b && row[dbKey] !== undefined && row[dbKey] !== null) {
          b.sum += row[dbKey];
          b.count++;
        }
      }
    });
    return buckets.map(b => ({ time: b.time, label: b.label, value: b.count > 0 ? parseFloat((b.sum / b.count).toFixed(2)) : null }));
  }

  if (timeMode === 'Perminggu') {
    const start = new Date(`${targetDateStr}T00:00:00`);
    const spanWeeks = parseInt(spanLimit.split(' ')[0], 10) || 4;
    const end = new Date(start);
    end.setDate(start.getDate() + (spanWeeks * 7) - 1);
    end.setHours(23, 59, 59, 999);
    
    const buckets = Array(spanWeeks).fill().map((_, i) => {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (i * 7));
      const label = formatDateToDDMMYYYY(weekStart);
      return { time: i, label, sum: 0, count: 0, value: null };
    });

    rawData.forEach(row => {
      const d = new Date(row.created_at);
      if (d >= start && d <= end) {
        const dayOffset = Math.floor((d - start) / (1000 * 60 * 60 * 24));
        const wIdx = Math.floor(dayOffset / 7);
        if (wIdx >= 0 && wIdx < spanWeeks && row[dbKey] !== undefined && row[dbKey] !== null) {
          buckets[wIdx].sum += row[dbKey];
          buckets[wIdx].count++;
        }
      }
    });
    return buckets.map(b => ({ time: b.time, label: b.label, value: b.count > 0 ? parseFloat((b.sum / b.count).toFixed(2)) : null }));
  }

  if (timeMode === 'Perbulan') {
    const yearInt = parseInt(selectedYear, 10) || new Date().getFullYear();
    const buckets = Array(12).fill().map((_, i) => ({ time: i, label: RANGE_OPTIONS['Perbulan'][i], sum: 0, count: 0, value: null }));
    
    rawData.forEach(row => {
      const d = new Date(row.created_at);
      if (d.getFullYear() === yearInt) {
        const month = d.getMonth();
        if (row[dbKey] !== undefined && row[dbKey] !== null) {
          buckets[month].sum += row[dbKey];
          buckets[month].count++;
        }
      }
    });
    return buckets.map(b => ({ time: b.time, label: b.label, value: b.count > 0 ? parseFloat((b.sum / b.count).toFixed(2)) : null }));
  }

  return [];
};

const optimalRanges = {
  'Suhu Rumah Kaca': [20, 25],
  'Kelembapan': [80, 90],
  'Intensitas Cahaya': [2152, 4305],
  'pH': [5, 7],
  'TDS': [500, 1800],
  'Suhu Larutan': [22, 24]
};

const chartThemes = {
  'Suhu Rumah Kaca': { light: '#F97316', dark: '#FB923C' },
  'Kelembapan': { light: '#3B82F6', dark: '#60A5FA' },
  'Intensitas Cahaya': { light: '#EAB308', dark: '#FACC15' },
  'pH': { light: '#A855F7', dark: '#C084FC' },
  'TDS': { light: '#14B8A6', dark: '#2DD4BF' },
  'Suhu Larutan': { light: '#F43F5E', dark: '#FB7185' }
};

const CustomTooltip = ({ active, payload, label, unit, color }) => {
  if (active && payload && payload.length) {
    const displayLabel = payload[0]?.payload?.label || label;
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
          {displayLabel}
        </p>
        <p style={{ fontSize: '16px', fontWeight: 700, color: color, letterSpacing: '-0.02em' }}>
          {payload[0].value}{unit}
        </p>
      </div>
    );
  }
  return null;
};

const DetailedChartCard = ({ title, rawData, dbKey, yDomain, isDark, defaultTimeMode, unit = '', optimalRange }) => {
  const [timeMode, setTimeMode] = useState(defaultTimeMode || 'Perjam');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  });
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));

  const theme = chartThemes[title] || chartThemes['Suhu Rumah Kaca'];
  const lineColor = isDark ? theme.dark : theme.light;
  const gradientId = `hist-gradient-${title.replace(/\s/g, '-')}`;

  const yMin = yDomain[0];
  const yMax = yDomain[1];
  const yMid = parseFloat(((yMin + yMax) / 2).toFixed(1));
  const betterYTicks = [yMin, yMid, yMax];

  const [rangeStart, setRangeStart] = useState(RANGE_OPTIONS['Perjam'][0]);
  const [rangeEnd, setRangeEnd] = useState(RANGE_OPTIONS['Perjam'][23]);
  const [spanLimit, setSpanLimit] = useState(RANGE_OPTIONS['Perhari'][5]);

  const startOptions = timeMode === 'Perjam' || timeMode === 'Perbulan' 
    ? RANGE_OPTIONS[timeMode].filter((_, i) => i <= labelToIndex(rangeEnd, timeMode)) 
    : [];
  
  const endOptions = timeMode === 'Perjam' || timeMode === 'Perbulan' 
    ? RANGE_OPTIONS[timeMode].filter((_, i) => i >= labelToIndex(rangeStart, timeMode)) 
    : [];

  const handleStartChange = (val) => setRangeStart(val);
  const handleEndChange = (val) => setRangeEnd(val);

  const handleTimeChange = (newMode) => {
    setTimeMode(newMode);
    if (newMode === 'Perhari') {
       setSpanLimit('6 Hari');
    } else if (newMode === 'Perminggu') {
       setSpanLimit('4 Minggu');
    } else {
       setRangeStart(RANGE_OPTIONS[newMode][0]);
       setRangeEnd(RANGE_OPTIONS[newMode][RANGE_OPTIONS[newMode].length - 1]);
    }
  };

  const processedData = useMemo(() => {
    return processSensorData(rawData, dbKey, timeMode, selectedDate, rangeStart, rangeEnd, spanLimit, selectedYear);
  }, [rawData, dbKey, timeMode, selectedDate, rangeStart, rangeEnd, spanLimit, selectedYear]);

  let filteredData = [];
  let startIdx = 0;
  let endIdx = 0;

  if (['Perjam', 'Perbulan'].includes(timeMode)) {
    startIdx = labelToIndex(rangeStart, timeMode);
    endIdx = labelToIndex(rangeEnd, timeMode);
    filteredData = processedData.filter(d => d.time >= startIdx && d.time <= endIdx);
  } else {
    filteredData = processedData;
    startIdx = 0; 
    endIdx = filteredData.length > 0 ? filteredData.length - 1 : 0;
  }

  const activeData = filteredData.filter(d => d.value !== null);
  const minVal = activeData.length ? Math.min(...activeData.map(d => d.value)) : 0;
  const maxVal = activeData.length ? Math.max(...activeData.map(d => d.value)) : 0;
  const avgVal = activeData.length ? (activeData.reduce((acc, curr) => acc + curr.value, 0) / activeData.length).toFixed(1) : 0;

  let xTicks;
  if (['Perjam', 'Perbulan'].includes(timeMode)) {
    xTicks = startIdx === endIdx ? [startIdx] : [startIdx, endIdx];
  } else {
    xTicks = filteredData.map(d => d.time);
  }

  const getTickLabel = (val) => {
    const point = filteredData.find(d => d.time === val);
    return point ? point.label : '';
  };

  const handleDownloadCSV = () => {
    const headers = ['Time', title];
    const rows = filteredData.map(point => [point.label, point.value !== null ? point.value.toFixed(2) : '']);
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase()}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5 ml-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lineColor }}></div>
        <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-200 tracking-wide">{title}</h2>
      </div>

      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-5 pb-5 border border-gray-100/80 dark:border-gray-700/40 flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.03] dark:hover:shadow-black/20 group">

        <div id="tour-history-filters" className="flex justify-end items-center gap-2 mb-4 w-full flex-wrap">
          
          {timeMode === 'Perbulan' ? (
            <CustomSelect
              value={selectedYear}
              onChange={(val) => setSelectedYear(val)}
              options={YEAR_OPTIONS}
              className="w-[90px] text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-lg pl-3 pr-2 py-1.5 outline-none text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            />
          ) : (
            <div className="relative group">
              <div className="w-[115px] sm:w-[130px] text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-lg px-2 sm:px-3 py-1.5 text-gray-600 dark:text-gray-300 font-medium flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                <span>{formatDateToDDMMYYYY(selectedDate)}</span>
                <CalendarDays size={14} className="opacity-60" />
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}

          <CustomSelect
            value={timeMode}
            onChange={handleTimeChange}
            options={['Perjam', 'Perhari', 'Perminggu', 'Perbulan']}
            className="w-[90px] text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-lg pl-3 pr-2 py-1.5 outline-none text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          />
          
          {['Perjam', 'Perbulan'].includes(timeMode) ? (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-lg p-0.5 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
              <CustomSelect
                value={rangeStart}
                onChange={handleStartChange}
                options={startOptions}
                className="w-[95px] text-xs bg-transparent rounded-md pl-3 pr-2 py-1 outline-none text-gray-600 dark:text-gray-300 font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
              />
              <span className="text-gray-300 dark:text-gray-600 text-xs font-medium px-0.5">–</span>
              <CustomSelect
                value={rangeEnd}
                onChange={handleEndChange}
                options={endOptions}
                className="w-[95px] text-xs bg-transparent rounded-md pl-3 pr-2 py-1 outline-none text-gray-600 dark:text-gray-300 font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
              />
            </div>
          ) : (
            <CustomSelect
              value={spanLimit}
              onChange={(val) => setSpanLimit(val)}
              options={RANGE_OPTIONS[timeMode]}
              className="w-[105px] text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 rounded-lg pl-3 pr-2 py-1.5 outline-none text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            />
          )}

          <button
            onClick={handleDownloadCSV}
            title="Unduh CSV"
            className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 cursor-pointer border border-gray-200/80 dark:border-gray-700/60 shrink-0"
          >
            <Download size={13} strokeWidth={2} />
          </button>
        </div>

        <div className="w-full h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
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
                domain={[startIdx, endIdx]}
                type="number"
                ticks={xTicks}
                tickFormatter={(val) => getTickLabel(val)}
                tick={{ fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: 500 }}
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
                connectNulls={true}
                dot={{
                  r: 3,
                  fill: isDark ? '#1a1f2e' : '#ffffff',
                  stroke: lineColor,
                  strokeWidth: 2
                }}
                activeDot={{
                  r: 4,
                  fill: lineColor,
                  stroke: isDark ? '#1a1f2e' : '#ffffff',
                  strokeWidth: 2.5
                }}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100/80 dark:border-gray-700/60 flex justify-between items-center px-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1.5">Rata-rata</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-bold tracking-tight text-gray-800 dark:text-gray-200 leading-none" style={{ color: lineColor }}>{avgVal}</span>
              {unit && <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{unit.trim()}</span>}
            </div>
          </div>
          <div className="w-px h-10 bg-gray-200/80 dark:bg-gray-700/60"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1.5">Minimal</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-gray-600 dark:text-gray-300 leading-none">{minVal}</span>
              {unit && <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{unit.trim()}</span>}
            </div>
          </div>
          <div className="w-px h-10 bg-gray-200/80 dark:bg-gray-700/60"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1.5">Maksimal</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-gray-600 dark:text-gray-300 leading-none">{maxVal}</span>
              {unit && <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{unit.trim()}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useAuth } from '../context/AuthContext';

export default function History() {
  const { isDark, toggleTheme } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rawData, loading } = useSensorData();
  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto px-6 md:px-10 lg:px-14 py-8 md:py-10 animate-page-enter relative z-0">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-blue-200/20 dark:bg-blue-900/15 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <header className="flex justify-between items-center mb-10 mt-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Data Historis</h1>

        <div className="flex items-center gap-4 md:gap-6">
          <NotificationDropdown />

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

      <div className="max-w-7xl mx-auto w-full pb-16">
        <div id="tour-history-cards" className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10">
          <DetailedChartCard
            title="Suhu Rumah Kaca"
            rawData={rawData}
            dbKey={DB_MAP['Suhu Rumah Kaca']}
            yDomain={[15, 45]}
            isDark={isDark}
            defaultTimeMode="Perjam"
            unit="°C"
            optimalRange={optimalRanges['Suhu Rumah Kaca']}
          />
          <DetailedChartCard
            title="Kelembapan"
            rawData={rawData}
            dbKey={DB_MAP['Kelembapan']}
            yDomain={[40, 100]}
            isDark={isDark}
            defaultTimeMode="Perjam"
            unit="%"
            optimalRange={optimalRanges['Kelembapan']}
          />
          <DetailedChartCard
            title="Intensitas Cahaya"
            rawData={rawData}
            dbKey={DB_MAP['Intensitas Cahaya']}
            yDomain={[0, 5000]}
            isDark={isDark}
            defaultTimeMode="Perjam"
            unit=" lux"
            optimalRange={optimalRanges['Intensitas Cahaya']}
          />
          <DetailedChartCard
            title="pH"
            rawData={rawData}
            dbKey={DB_MAP['pH']}
            yDomain={[3, 9]}
            isDark={isDark}
            defaultTimeMode="Perjam"
            unit=""
            optimalRange={optimalRanges['pH']}
          />
          <DetailedChartCard
            title="TDS"
            rawData={rawData}
            dbKey={DB_MAP['TDS']}
            yDomain={[0, 2000]}
            isDark={isDark}
            defaultTimeMode="Perjam"
            unit=" ppm"
            optimalRange={optimalRanges['TDS']}
          />
          <DetailedChartCard
            title="Suhu Larutan"
            rawData={rawData}
            dbKey={DB_MAP['Suhu Larutan']}
            yDomain={[15, 35]}
            isDark={isDark}
            defaultTimeMode="Perjam"
            unit="°C"
            optimalRange={optimalRanges['Suhu Larutan']}
          />
        </div>
      </div>
    </div>
  );
}
