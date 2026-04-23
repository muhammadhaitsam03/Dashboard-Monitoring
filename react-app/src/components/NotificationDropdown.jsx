import React, { useState } from 'react';
import { Bell, X, Sparkles, ThermometerSun, Droplets, SunMedium, FlaskConical, Waves, Thermometer } from 'lucide-react';

// Dummy ML recommendations for threshold adjustments
const ML_RECOMMENDATIONS = [
  {
    id: 1,
    sensor: 'Suhu Rumah Kaca',
    icon: ThermometerSun,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
    currentMin: 20,
    currentMax: 27,
    suggestedMin: 18,
    suggestedMax: 24,
    unit: '°C',
    isNew: true,
  },
  {
    id: 2,
    sensor: 'Kelembapan',
    icon: Droplets,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-500/10',
    currentMin: 60,
    currentMax: 80,
    suggestedMin: 50,
    suggestedMax: 70,
    unit: '%',
    isNew: true,
  },
  {
    id: 3,
    sensor: 'pH',
    icon: FlaskConical,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-50 dark:bg-purple-500/10',
    currentMin: 5.5,
    currentMax: 6.5,
    suggestedMin: 6.0,
    suggestedMax: 7.0,
    unit: '',
    isNew: false,
  },
  {
    id: 4,
    sensor: 'Intensitas Cahaya',
    icon: SunMedium,
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-50 dark:bg-yellow-500/10',
    currentMin: 300,
    currentMax: 500,
    suggestedMin: 150,
    suggestedMax: 600,
    unit: 'lux',
    isNew: false,
  },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const newCount = ML_RECOMMENDATIONS.filter(r => r.isNew).length;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-2.5 rounded-full transition-all cursor-pointer relative"
      >
        <Bell className="w-[22px] h-[22px] stroke-[2]" />
        {newCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {newCount}
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
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notification Items */}
          <div className="max-h-[360px] overflow-y-auto">
            {ML_RECOMMENDATIONS.map((rec) => {
              const Icon = rec.icon;
              return (
                <div
                  key={rec.id}
                  className={`px-5 py-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors last:border-b-0 ${
                    rec.isNew ? 'bg-emerald-50/40 dark:bg-emerald-950/15' : ''
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
                        <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">{rec.sensor}</span>
                        {rec.isNew && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase rounded-full tracking-wider">New</span>
                        )}
                      </div>

                      {/* Current vs Suggested */}
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="text-gray-400 dark:text-gray-500">Current:</span>
                        <span className="font-medium text-gray-600 dark:text-gray-300">
                          {rec.currentMin} – {rec.currentMax} {rec.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[12px] mt-0.5">
                        <span className="text-emerald-500 dark:text-emerald-400">Suggested:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {rec.suggestedMin} – {rec.suggestedMax} {rec.unit}
                        </span>
                        {(rec.suggestedMin !== rec.currentMin || rec.suggestedMax !== rec.currentMax) && (
                          <span className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">⚠ adjust</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
              Based on PatchTST model forecast · Updated 5 min ago
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
