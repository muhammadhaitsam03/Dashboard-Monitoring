import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Sparkles,
  Clock
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LiveClock from '../components/LiveClock';

import { useAuth } from '../context/AuthContext';

export default function Prediction() {
  const { isDark, toggleTheme } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-4 border border-gray-100 dark:border-gray-700/50 shadow-sm">
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
          <span>Last updated: 2026-03-10 19:55 (local) · page refreshes every 60s (current hour prediction updates on the hour)</span>
        </div>

        {/* Predicted for this hour */}
        <div className="bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40 rounded-2xl px-7 py-5 transition-all hover:shadow-md">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2">
            Predicted for this hour
            <span className="font-normal text-gray-500 dark:text-gray-400 ml-2 text-[13px]">
              (2026-03-10 19:00, from prediction_forecast.csv)
            </span>
          </h3>
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
            Temperature 21.8°C, clear, humidity 0.84 (0–1), light 13 W/m², pH 6.52.
          </p>
        </div>

        {/* Current conditions (realtime) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl px-7 py-5 transition-all hover:shadow-md">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2">
            Current conditions (realtime)
          </h3>
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
            Today's temperature is 27.3°C. Weather: cloudy. Humidity 0.56 (0–1). Light intensity
            290 W/m². pH is 6.62. Optimal for red cabbage lettuce (hydroponic): temperature 18–24°C,
            humidity 0.50–0.70, light 150–600 W/m², pH 6.0–7.0.
          </p>
        </div>

        {/* Model forecast (PatchTST) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl px-7 py-5 transition-all hover:shadow-md">
          <h3 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 mb-2">
            Model forecast (PatchTST)
          </h3>
          <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed space-y-1">
            <p>
              Next 24h (model): 20.6°C clear humidity 0.83 light -2 W/m² pH 6.52, 12h: 24.9°C
              humidity 0.70 light 618
            </p>
            <p>
              Next 7 days (model): day1 20.6°C, day2 20.6°C, day3 20.6°C, day4 20.7°C, day5 20.6°C,
              day6 20.6°C, day7 20.6°C
            </p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-md border border-gray-100 dark:border-gray-700/50 rounded-2xl px-7 py-6 transition-all hover:shadow-md">
          <h3 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 mb-3">
            Recommendation
          </h3>
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-[1.8]">
            Adjust the hydroponic water temperature to cool down the system since the current
            temperature of 27.3°C is too high for red cabbage lettuce, which prefers temperatures
            between 18–24°C. Use cooling methods like chillers or aerators to reach the optimal range.
            Additionally, maintain the humidity between 0.50 and 0.70 since the current level of 0.56
            and forecasted humidity of 0.83 are outside the ideal range. Monitor and adjust pH levels
            around 6.62, which is at the upper end of the recommended range of 6.0–7.0. Ensure the
            light intensity does not drop below the optimal level of 150 W/m² and manage the light
            schedule to prevent excess light, especially since forecasted light levels rise to 618 W/m²,
            which is at the upper end of the acceptable range.
          </p>
        </div>

      </div>
    </div>
  );
}
