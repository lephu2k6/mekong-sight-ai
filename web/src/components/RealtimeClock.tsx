import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

const getTimezoneLabel = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
  return `GMT${sign}${hours}:${minutes} · ${tz}`;
};

export const RealtimeClock: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timezone = useMemo(() => getTimezoneLabel(), []);

  return (
    <div className={`ui-realtime-clock ${className}`.trim()}>
      <span>
        <CalendarDays size={18} />
        {currentTime.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </span>
      <span>
        <Clock3 size={18} />
        {currentTime.toLocaleTimeString('vi-VN')}
      </span>
      <span className="ui-realtime-clock-zone">{timezone}</span>
    </div>
  );
};
