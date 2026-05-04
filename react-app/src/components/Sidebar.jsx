import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  History as HistoryIcon,
  BrainCircuit,
  MoreHorizontal,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', path: '/home', icon: HomeIcon },
  { id: 'history', path: '/history', icon: HistoryIcon },
  { id: 'brain', path: '/brain', icon: BrainCircuit },
  {
    id: 'threshold', path: '/threshold', icon: props => (
      <svg
        {...props}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M4 21h16M7 21v-5s-2-1-2-1M7 18s2-1 2-1M17 21v-4s2-1 2-1M17 19s-2-1 2-1M10 9a2 2 0 0 1 4 0M8 6a6 6 0 0 1 8 0M12 18v3M8 21v-2h3" />
        <rect x="10" y="11" width="4" height="7" rx="1" />
        <circle cx="12" cy="14.5" r="0.5" fill="currentColor" />
      </svg>
    )
  },
  {
    id: 'actuator', path: '/actuator', icon: props => (
      <svg
        {...props}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    )
  },
  { id: 'about', path: '/about', icon: MoreHorizontal },
];

export default function Sidebar({ isDark }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  const buttonRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

  const activeIndex = useMemo(() => {
    return NAV_ITEMS.findIndex(item => location.pathname.startsWith(item.path));
  }, [location.pathname]);

  const activePage = activeIndex !== -1 ? NAV_ITEMS[activeIndex].id : null;

  const updateIndicator = useCallback(() => {
    if (activeIndex === -1 || !sidebarRef.current || !buttonRefs.current[activeIndex]) return;
    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const btnRect = buttonRefs.current[activeIndex].getBoundingClientRect();
    const btnCenter = btnRect.top + btnRect.height / 2 - sidebarRect.top;
    const indicatorHeight = btnRect.height + 20;
    setIndicatorStyle({ top: btnCenter - indicatorHeight / 2, height: indicatorHeight, opacity: 1 });
  }, [activeIndex]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div className="flex h-screen py-4 pl-4 pointer-events-none relative z-20">
      <aside ref={sidebarRef} className="w-[80px] md:w-[100px] bg-[#385344] flex flex-col items-center py-6 shadow-xl shrink-0 transition-colors duration-300 rounded-[50px] h-full pointer-events-auto relative overflow-hidden">

        {/* Active Indicator (The sliding cutout) */}
        {activePage && (
          <div
            className="absolute right-0 w-[calc(100%-1.25rem)] bg-[#f1f2f1] dark:bg-gray-900 rounded-l-[35px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
            style={{
              top: `${indicatorStyle.top}px`,
              height: `${indicatorStyle.height}px`,
              opacity: indicatorStyle.opacity,
            }}
          >
            {/* Top curve */}
            <div className="absolute -top-[35px] right-0 w-[35px] h-[35px] pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,transparent_35px,#f1f2f1_36px)] transition-all duration-300 dark:opacity-0"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,transparent_35px,#111827_36px)] transition-all duration-300 opacity-0 dark:opacity-100"></div>
            </div>
            {/* Bottom curve */}
            <div className="absolute -bottom-[35px] right-0 w-[35px] h-[35px] pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,transparent_35px,#f1f2f1_36px)] transition-all duration-300 dark:opacity-0"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,transparent_35px,#111827_36px)] transition-all duration-300 opacity-0 dark:opacity-100"></div>
            </div>
          </div>
        )}

        {/* Logo */}
        <div
          className="w-14 h-14 rounded-full mb-8 flex items-center justify-center relative z-10 shrink-0 overflow-hidden bg-white/90 dark:bg-white/15 shadow-md"
        >
          <img src="/logo.png" alt="Dashboard Logo" className="w-14 h-14 object-contain" />
        </div>

        <nav className="flex flex-col gap-1 flex-1 w-full relative z-10 justify-center">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                ref={el => buttonRefs.current[index] = el}
                onClick={() => navigate(item.path)}
                className={`
                  relative flex justify-center items-center w-full group py-3 transition-all duration-300 cursor-pointer
                  ${isActive ? '' : 'text-white'}
                `}
              >
                <div className={`
                  p-2 rounded-full transition-all duration-300
                  ${isActive ? 'bg-transparent' : 'group-hover:bg-white/10'}
                `}>
                  <Icon className={`
                    w-7 h-7 transition-all duration-500
                    ${isActive ? 'text-[#385344] dark:text-white scale-90 stroke-[2.5]' : 'text-white stroke-[1.5]'}
                  `} />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <button onClick={() => navigate('/login')} className="flex justify-center w-full text-white hover:bg-white/10 p-3 rounded-xl mt-auto transition-all pointer-events-auto cursor-pointer relative z-10 shrink-0">
          <LogOut className="w-7 h-7 stroke-[2] rotate-180" />
        </button>
      </aside>
    </div>
  );
}
