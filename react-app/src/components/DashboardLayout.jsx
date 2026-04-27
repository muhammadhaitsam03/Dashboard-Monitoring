import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardTutorial from './DashboardTutorial';

export default function DashboardLayout() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // We pass the theme state down to all pages via Outlet context
  return (
    <div className="flex h-screen font-sans overflow-hidden transition-colors duration-300 bg-[#f1f2f1] dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar isDark={isDark} />
      <main className="flex-1 overflow-hidden relative">
        <Outlet context={{ isDark, toggleTheme }} />
      </main>
      <DashboardTutorial isDark={isDark} />
    </div>
  );
}
