import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Sun,
  Moon,
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';

// Actuator data with custom SVG icons
const ACTUATORS = [
  {
    id: 'pompa_nutrisi',
    label: 'Pompa Nutrisi',
    description: 'Mengatur distribusi larutan nutrisi ke tanaman',
    isOn: true,
    colorOn: 'from-teal-400 to-emerald-500',
    iconColor: 'text-teal-500',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-500/10',
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V18M12 18C8 18 5 15 5 12V8h14v4c0 3-3 6-7 6Z" />
        <path d="M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2" />
        <path d="M9 12h6M12 12v3" />
        <circle cx="12" cy="3" r="1" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'pompa_air',
    label: 'Pompa Air',
    description: 'Mengatur sirkulasi air dalam sistem hidroponik',
    isOn: true,
    colorOn: 'from-blue-400 to-cyan-500',
    iconColor: 'text-blue-500',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-500/10',
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.09 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
        <path d="M12.56 14.06c1.32 0 2.39-1.1 2.39-2.43 0-.7-.34-1.36-1.02-1.91-.68-.56-1.17-1.2-1.37-2.02-.2.82-.69 1.46-1.37 2.02-.68.55-1.02 1.21-1.02 1.91 0 1.33 1.07 2.43 2.39 2.43z" />
        <path d="M17 18.8c1.76 0 3.2-1.46 3.2-3.24 0-.92-.46-1.8-1.37-2.55-.91-.75-1.5-1.6-1.83-2.71-.33 1.11-.92 1.96-1.83 2.71-.91.75-1.37 1.63-1.37 2.55 0 1.78 1.44 3.24 3.2 3.24z" />
      </svg>
    )
  },
  {
    id: 'kipas',
    label: 'Kipas Exhaust',
    description: 'Mengatur sirkulasi udara dan suhu rumah kaca',
    isOn: false,
    colorOn: 'from-orange-400 to-red-500',
    iconColor: 'text-orange-500',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-500/10',
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12c-1.5-3-1-7 2-9 0 3 1.5 5 4 6s4 4 3 7c-1-1-3-1.5-5-1" />
        <path d="M12 12c1.5 3 1 7-2 9 0-3-1.5-5-4-6s-4-4-3-7c1 1 3 1.5 5 1" />
        <path d="M12 12c3 1.5 7 1 9-2-3 0-5-1.5-6-4s-4-4-7-3c1 1 1.5 3 1 5" />
        <path d="M12 12c-3-1.5-7-1-9 2 3 0 5 1.5 6 4s4 4 7 3c-1-1-1.5-3-1-5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  {
    id: 'lampu_grow',
    label: 'Lampu Grow',
    description: 'Memberikan cahaya tambahan untuk pertumbuhan tanaman',
    isOn: true,
    colorOn: 'from-yellow-400 to-amber-500',
    iconColor: 'text-yellow-500',
    bgLight: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-500/10',
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6M10 22h4" />
        <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
        <line x1="12" y1="6" x2="12" y2="10" />
        <line x1="10" y1="8" x2="14" y2="8" />
      </svg>
    )
  },
  {
    id: 'solenoid_valve',
    label: 'Solenoid Valve',
    description: 'Mengontrol aliran air masuk ke sistem irigasi',
    isOn: false,
    colorOn: 'from-purple-400 to-indigo-500',
    iconColor: 'text-purple-500',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-500/10',
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="8" width="10" height="8" rx="1" />
        <path d="M3 12h4M17 12h4" />
        <path d="M10 8V5M14 8V5" />
        <path d="M10 16v3M14 16v3" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  },
  {
    id: 'misting',
    label: 'Misting System',
    description: 'Mengatur kelembapan udara melalui kabut air halus',
    isOn: true,
    colorOn: 'from-sky-400 to-blue-500',
    iconColor: 'text-sky-500',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-500/10',
    icon: (props) => (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242" />
        <path d="M8 19v1M8 22v1M12 19v1M12 22v1M16 19v1M16 22v1" />
      </svg>
    )
  },
];

function ActuatorCard({ actuator }) {
  const Icon = actuator.icon;
  const isOn = actuator.isOn;

  return (
    <div className={`relative overflow-hidden bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[24px] p-6 border border-white/40 dark:border-gray-700/50 flex flex-col justify-between min-h-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group`}>
      {/* Gradient blob */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${actuator.colorOn} ${isOn ? 'opacity-15 dark:opacity-25' : 'opacity-5 dark:opacity-10'} rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-20 dark:group-hover:opacity-30`}></div>

      {/* Top row: icon + status */}
      <div className="flex justify-between items-start relative z-10 w-full mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${actuator.bgLight} ${actuator.bgDark} shadow-sm backdrop-blur-md transition-transform duration-300 group-hover:scale-110 border border-white/50 dark:border-gray-700/30`}>
            <Icon className={`w-6 h-6 ${actuator.iconColor} stroke-[2]`} />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-gray-700 dark:text-gray-200 leading-snug tracking-wide">{actuator.label}</h3>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-4 relative z-10">{actuator.description}</p>

      {/* Status indicator */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          {/* Pulsing dot */}
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
            {isOn && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-50"></div>
            )}
          </div>
          <span className={`text-sm font-semibold tracking-wide ${isOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {isOn ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        {/* Status badge */}
        <div className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${isOn
            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-sm'
            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
          }`}>
          {isOn ? 'ON' : 'OFF'}
        </div>
      </div>
    </div>
  );
}

import { useAuth } from '../context/AuthContext';

export default function Actuator() {
  const { isDark, toggleTheme } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();

  const activeCount = ACTUATORS.filter(a => a.isOn).length;
  const inactiveCount = ACTUATORS.filter(a => !a.isOn).length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto px-6 md:px-10 lg:px-14 py-8 md:py-10 animate-page-enter relative z-0">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[600px] h-[600px] bg-blue-200/20 dark:bg-blue-900/15 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Top Header */}
      <header className="flex justify-between items-center mb-10 mt-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-white tracking-tight">Aktuator</h1>

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
        {/* Summary Stats */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-wide">Ringkasan Status</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total */}
            <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[20px] p-5 border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Aktuator</p>
              <p className="text-4xl font-bold text-gray-800 dark:text-white tracking-tight">{ACTUATORS.length}</p>
            </div>
            {/* Active */}
            <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[20px] p-5 border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Aktif</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{activeCount}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</span>
                </div>
              </div>
            </div>
            {/* Inactive */}
            <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[20px] p-5 border border-white/40 dark:border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Tidak Aktif</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-gray-400 dark:text-gray-500 tracking-tight">{inactiveCount}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Offline</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Actuator Cards */}
        <section className="pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#1E463A] dark:bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 tracking-wide">Status Aktuator</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {ACTUATORS.map(actuator => (
              <ActuatorCard key={actuator.id} actuator={actuator} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
