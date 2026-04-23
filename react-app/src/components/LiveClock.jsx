import { useState, useEffect } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const day = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return (
    <div className="hidden sm:flex flex-col items-end select-none leading-tight">
      <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
        {day} {month} {year}
      </span>
      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tabular-nums tracking-wider mt-0.5">
        {hours}.{minutes}.{seconds}
      </span>
    </div>
  );
}
