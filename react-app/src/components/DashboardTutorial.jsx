import React, { useState, useEffect, useRef } from 'react';
import { Joyride } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';

// ─── Session keys ─────────────────────────────────────────────────────────────
const KEY_DONE = 'tutorial_done';       // tour fully finished/skipped this session
const KEY_ACTIVE = 'tutorial_active';     // mid-tour cross-page navigation in progress
const KEY_NEXT = 'tutorial_next_page';  // which page should auto-start next

// ─── Full tour order (matches routes in App.jsx) ─────────────────────────────
const TOUR_ORDER = ['/home', '/history', '/brain', '/threshold', '/actuator', '/about', '/account'];

// ─── Steps per page ───────────────────────────────────────────────────────────
const TOUR_STEPS = {
  '/home': [
    {
      target: 'body',
      title: 'Selamat Datang di Dashboard! 👋',
      content: 'Mari kita lihat sekilas fitur utama dashboard ini agar Anda bisa langsung memonitor lahan dengan maksimal.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-live-monitoring',
      title: 'Pemantauan Real-Time',
      content: 'Di sini Anda dapat memantau data sensor secara langsung. Data diperbarui otomatis dari ESP32 setiap beberapa detik.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'body',
      title: 'Analisis Tren 24 Jam',
      content: 'Grafik di bawah memvisualisasikan data sensor selama 24 jam terakhir. Garis hijau putus-putus menandakan rentang nilai optimal.',
      placement: 'center',
      disableBeacon: true,
    },
  ],
  '/history': [
    {
      target: 'body',
      title: 'Halaman Data Historis 📊',
      content: 'Di sini Anda bisa melihat rekaman data sensor dari waktu ke waktu — per jam, hari, minggu, hingga bulanan.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-history-filters',
      title: 'Filter Waktu Lengkap',
      content: 'Gunakan kontrol ini untuk mengganti rentang waktu tampilan grafik. Anda juga bisa mengunduh data dalam format CSV.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'body',
      title: 'Grafik Interaktif',
      content: 'Arahkan kursor ke grafik untuk melihat nilai spesifik pada jam tertentu, lengkap dengan indikator rentang optimal.',
      placement: 'center',
      disableBeacon: true,
    },
  ],
  '/brain': [
    {
      target: 'body',
      title: 'AI & Prediksi 🤖',
      content: 'Halaman ini adalah pusat kecerdasan sistem. AI memproses data historis dan cuaca untuk memberikan analisis prediktif.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-brain-assistant',
      title: 'AI Plant Assistant',
      content: 'Chat dengan AI untuk mendapatkan rekomendasi tindakan berdasarkan kondisi sensor terkini dan cuaca.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-brain-forecast',
      title: 'Prediksi & Rekomendasi',
      content: 'Lihat perkiraan tren suhu dan cuaca hingga 24 jam ke depan, serta rekomendasi penyesuaian otomatis untuk menjaga kualitas panen.',
      placement: 'center',
      disableBeacon: true,
    },
  ],
  '/threshold': [
    {
      target: 'body',
      title: 'Halaman Threshold ⚙️',
      content: 'Di sini Anda bisa mengatur batas nilai optimal untuk setiap sensor. Sistem akan memberikan notifikasi jika data melewati batas ini.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-threshold-sensors',
      title: 'Pilih Sensor',
      content: 'Pilih sensor yang ingin Anda atur batas optimalnya dari daftar ini.',
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
      target: 'body',
      title: 'Kontrol Manual',
      content: 'Atur rentang minimum dan maksimum secara manual. Jika data melewati batas ini, sistem akan menyalakan aktuator secara otomatis.',
      placement: 'center',
      disableBeacon: true,
    },
  ],
  '/actuator': [
    {
      target: 'body',
      title: 'Halaman Aktuator 🔌',
      content: 'Pantau status semua perangkat aktuator yang terhubung ke sistem secara real-time.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#tour-actuator-summary',
      title: 'Ringkasan Status',
      content: 'Lihat sekilas jumlah perangkat yang sedang aktif dan tidak aktif dalam satu tampilan.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'body',
      title: 'Kontrol Perangkat',
      content: 'Aktuator akan menyala otomatis saat sensor melewati batas threshold yang telah Anda atur.',
      placement: 'center',
      disableBeacon: true,
    },
  ],
  '/about': [
    {
      target: 'body',
      title: 'Tentang Aplikasi ℹ️',
      content: 'Halaman ini berisi informasi tentang sistem monitoring dan tim di balik pengembangan proyek ini.',
      placement: 'center',
      disableBeacon: true,
    },
  ],
  '/account': [
    {
      target: 'body',
      title: 'Akun Saya 👤',
      content: 'Di sini Anda bisa memperbarui profil, mengubah foto, dan mengganti kata sandi akun Anda.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: 'body',
      title: 'Tutorial Selesai! 🎉',
      content: 'Selamat! Anda sudah mengenal semua fitur utama dashboard monitoring ini. Selamat memonitor lahan Anda!',
      placement: 'center',
      disableBeacon: true,
      isGlobalLast: true,
    },
  ],
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({
  index,
  step,
  tooltipProps,
  primaryProps,
  skipProps,
  isLastStep,
  size,
  isDark,
  onCrossPageNext,  // called when navigating to the next page
  onGlobalFinish,   // called when the very last step is done
  onSkipAll,        // called when user wants to skip the entire tour
}) => {
  const isNavigatingToNextPage = isLastStep && !step.isGlobalLast;

  const handlePrimary = (e) => {
    if (step.isGlobalLast) {
      // ✅ Mark entire tour complete IMMEDIATELY on button click (not async)
      primaryProps.onClick(e);
      if (onGlobalFinish) onGlobalFinish();
    } else if (isNavigatingToNextPage) {
      // Navigate to next page
      primaryProps.onClick(e);
      if (onCrossPageNext) onCrossPageNext();
    } else {
      primaryProps.onClick(e);
    }
  };

  const handleSkip = (e) => {
    skipProps.onClick(e);
    if (onSkipAll) onSkipAll();
  };

  return (
    <div
      {...tooltipProps}
      style={{ fontFamily: 'inherit' }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-5 max-w-[320px] mx-2 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

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
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-4 bg-emerald-500' : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                  }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* "Lewati" only on the very first step of the whole tour */}
            {index === 0 && (
              <button
                onClick={handleSkip}
                className="text-[12px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-wider"
              >
                Lewati
              </button>
            )}
            <button
              onClick={handlePrimary}
              className="bg-[#1E463A] hover:bg-[#2a5d4d] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[12px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
            >
              {step.isGlobalLast
                ? 'Selesai 🎉'
                : isLastStep
                  ? 'Halaman Berikutnya →'
                  : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardTutorial({ isDark }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const navigatingRef = useRef(false); // prevents double-navigation

  useEffect(() => {
    setRun(false);
    navigatingRef.current = false;

    const path = location.pathname;

    // If the entire tour is done this session → skip
    if (sessionStorage.getItem(KEY_DONE)) return;

    const pageSteps = TOUR_STEPS[path];
    if (!pageSteps) return;

    // Start on /home (first page), OR when we're the expected next page in the flow
    const isFirstPage = path === TOUR_ORDER[0];
    const isActiveTour = sessionStorage.getItem(KEY_ACTIVE) === 'true';
    const expectedNext = sessionStorage.getItem(KEY_NEXT);
    const shouldStart = isFirstPage || (isActiveTour && expectedNext === path);

    if (!shouldStart) return;

    setSteps(pageSteps);

    // Scroll to top so visible elements are in frame
    const scrollEl = document.querySelector('.flex-1.flex.flex-col.h-screen.overflow-y-auto');
    if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });

    const timer = setTimeout(() => setRun(true), 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Called when user clicks "Halaman Berikutnya →" (last step, not global last)
  const handleCrossPageNext = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    const currentIdx = TOUR_ORDER.indexOf(location.pathname);
    if (currentIdx !== -1 && currentIdx < TOUR_ORDER.length - 1) {
      const nextPath = TOUR_ORDER[currentIdx + 1];
      sessionStorage.setItem(KEY_ACTIVE, 'true');
      sessionStorage.setItem(KEY_NEXT, nextPath);
      setRun(false);
      setTimeout(() => navigate(nextPath), 350);
    }
  };

  // Called when user clicks "Lewati"
  const handleSkipAll = () => {
    setRun(false);
    sessionStorage.setItem(KEY_DONE, 'true');
    sessionStorage.removeItem(KEY_ACTIVE);
    sessionStorage.removeItem(KEY_NEXT);
  };

  // Called when user clicks "Selesai 🎉" on the very last step
  // Setting KEY_DONE HERE (synchronously) prevents any race condition
  // where navigating to /home before STATUS.FINISHED fires would restart the tour
  const handleGlobalFinish = () => {
    setRun(false);
    setSteps([]);
    sessionStorage.setItem(KEY_DONE, 'true');
    sessionStorage.removeItem(KEY_ACTIVE);
    sessionStorage.removeItem(KEY_NEXT);
  };

  const handleJoyrideCallback = (data) => {
    const { type, index } = data;

    // Scroll the custom container to the target element before each step
    if (type === 'step:before') {
      const step = steps[index];
      if (step?.target && step.target !== 'body') {
        const element = document.querySelector(step.target);
        if (element) {
          const container =
            element.closest('.overflow-y-auto') ||
            document.querySelector('.flex-1.flex.flex-col.h-screen.overflow-y-auto');
          if (container) {
            const offset =
              element.getBoundingClientRect().top -
              container.getBoundingClientRect().top +
              container.scrollTop - 120;
            container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
          }
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
      showProgress={false}
      showSkipButton={false}
      steps={steps}
      disableScrolling={true}
      disableOverlayClose={false}
      spotlightClicks={false}
      tooltipComponent={(props) => (
        <CustomTooltip
          {...props}
          isDark={isDark}
          onCrossPageNext={handleCrossPageNext}
          onGlobalFinish={handleGlobalFinish}
          onSkipAll={handleSkipAll}
        />
      )}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#10b981',
        },
        overlay: {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)',
        },
        spotlight: {
          borderRadius: '16px',
        },
      }}
    />
  );
}
