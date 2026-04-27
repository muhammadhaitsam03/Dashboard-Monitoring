import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useLocation } from 'react-router-dom';

const CustomTooltip = ({
  index,
  step,
  tooltipProps,
  primaryProps,
  skipProps,
  isLastStep,
  size,
  isDark
}) => {
  return (
    <div
      {...tooltipProps}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl p-5 max-w-[320px] mx-2 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

      <div className="relative z-10">
        <h3 className="text-[17px] font-bold text-gray-800 dark:text-gray-100 mb-2 leading-snug">
          {step.title}
        </h3>

        <p className="text-[13.5px] text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          {step.content}
        </p>

        <div className="flex items-center justify-between mt-2">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: size }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index
                    ? 'w-4 bg-emerald-500'
                    : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                  }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {index > 0 && !isLastStep && (
              <button
                {...skipProps}
                className="text-[12px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-wider"
              >
                Skip
              </button>
            )}
            <button
              {...primaryProps}
              className="bg-[#1E463A] hover:bg-[#2a5d4d] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[12px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
            >
              {isLastStep ? 'Selesai' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TOUR_STEPS = {
  '/home': [
    {
      target: 'body',
      title: 'Selamat Datang di Dashboard!',
      content: 'Mari kita lihat sekilas fitur utama dashboard ini agar Anda bisa langsung memonitor lahan dengan maksimal.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-live-monitoring',
      title: 'Pemantauan Real-Time',
      content: 'Di sini Anda dapat memantau data sensor secara langsung. Data ini diperbarui otomatis dari ESP32 setiap beberapa detik.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-history-charts',
      title: 'Analisis Tren 24 Jam',
      content: 'Evaluasi performa seharian penuh. Grafik ini memvisualisasikan data sensor selama 24 jam terakhir. Perhatikan garis putus-putus hijau yang menandakan batas optimal.',
      placement: 'top',
      disableBeacon: true,
    }
  ],
  '/history': [
    {
      target: '#tour-history-filters',
      title: 'Filter Waktu Lengkap',
      content: 'Gunakan filter ini untuk melihat data harian, mingguan, hingga bulanan. Anda juga bisa mengunduh data dalam format CSV.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-history-cards',
      title: 'Grafik Interaktif',
      content: 'Arahkan kursor ke grafik untuk melihat nilai spesifik pada jam tertentu beserta indikator rentang optimal.',
      placement: 'top',
      disableBeacon: true,
    }
  ],
  '/threshold': [
    {
      target: '#tour-threshold-sensors',
      title: 'Pilih Sensor',
      content: 'Pilih sensor yang ingin Anda atur batas optimalnya dari sidebar ini.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '#tour-threshold-automl',
      title: 'Mode Auto ML',
      content: 'Aktifkan Auto ML untuk membiarkan AI mengatur batas terbaik secara otomatis berdasarkan prediksi kondisi lingkungan.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-threshold-controls',
      title: 'Kontrol Manual',
      content: 'Atur rentang minimum dan maksimum secara manual. Jika data melewati batas ini, sistem akan memberikan notifikasi dan menyalakan aktuator.',
      placement: 'top',
      disableBeacon: true,
    }
  ],
  '/actuator': [
    {
      target: '#tour-actuator-summary',
      title: 'Status Keseluruhan',
      content: 'Pantau jumlah perangkat yang sedang menyala atau mati dalam satu pandangan.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-actuator-cards',
      title: 'Kendalikan Perangkat',
      content: 'Lihat status aktuator saat ini. Jika sistem menggunakan mode otomatis, aktuator ini akan menyala dengan sendirinya saat sensor melewati batas threshold.',
      placement: 'top',
      disableBeacon: true,
    }
  ],
  '/brain': [
    {
      target: '#tour-brain-assistant',
      title: 'AI Plant Assistant',
      content: 'Halaman ini adalah pusat kecerdasan sistem. AI memproses jutaan poin data historis dan cuaca untuk memberikan analisis prediktif.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-brain-forecast',
      title: 'Prediksi Cuaca & Rekomendasi',
      content: 'Lihat perkiraan tren suhu dan cuaca hingga 24 jam ke depan, serta rekomendasi penyesuaian otomatis untuk menjaga kualitas panen.',
      placement: 'top',
      disableBeacon: true,
    }
  ]
};

export default function DashboardTutorial({ isDark }) {
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    // Reset run state on route change
    setRun(false);

    const path = location.pathname;
    const pageSteps = TOUR_STEPS[path];

    if (pageSteps && pageSteps.length > 0) {
      // Check if tutorial for THIS specific page has been completed in this session
      const storageKey = `tutorial_completed_${path.replace('/', '')}`;
      const isCompleted = localStorage.getItem(storageKey);

      if (!isCompleted) {
        setSteps(pageSteps);

        // Give the page a tiny bit of time to mount DOM elements (animations, etc)
        const timer = setTimeout(() => {
          setRun(true);
          localStorage.setItem(storageKey, 'true');
        }, 500);

        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname]);

  const handleJoyrideCallback = (data) => {
    const { status, type, index } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
    }

    // Handle manual scrolling since the dashboard uses a custom scroll container (flex-1 overflow-y-auto)
    if (type === 'step:before') {
      const step = steps[index];
      if (step && step.target && step.target !== 'body') {
        const element = document.querySelector(step.target);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
        }
      }
    }
  };

  if (!steps.length) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      showProgress
      showSkipButton
      steps={steps}
      disableScrolling={true}
      disableOverlayClose={false}
      tooltipComponent={(props) => <CustomTooltip {...props} isDark={isDark} />}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#10b981',
        },
        overlay: {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
        }
      }}
    />
  );
}
