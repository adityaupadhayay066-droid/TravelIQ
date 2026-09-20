import React, { useEffect, useState } from 'react';
import { Compass, Zap, Ticket, Leaf, TrendingUp } from 'lucide-react';

const KpiCard = ({ icon: Icon, label, value, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const isNumeric = !isNaN(value) || (typeof value === 'string' && !isNaN(value.replace(/,/g, '')));
    
    if (!isNumeric) {
      setCount(value);
      return;
    }

    const end = parseInt(value.toString().replace(/,/g, ''), 10) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }

    const duration = 1200; // 1.2s smooth count
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [value]);

  const displayValue = typeof count === 'number' ? count.toLocaleString() : count;

  return (
    <div className="travel-card p-4 sm:p-5 flex flex-col justify-between group">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 rounded-lg bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] group-hover:text-[#D96C4F] transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div>
        <h3 className="text-[#66736F] dark:text-[#A3B0AB] text-[11px] font-bold uppercase tracking-wider mb-1 font-heading">
          {label}
        </h3>
        <p className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] flex items-baseline gap-1 tracking-tight font-sans">
          {prefix && <span className="text-sm text-[#66736F] dark:text-[#A3B0AB] font-medium">{prefix}</span>}
          {displayValue}
          {suffix && <span className="text-sm text-[#66736F] dark:text-[#A3B0AB] font-medium">{suffix}</span>}
        </p>
      </div>
    </div>
  );
};

export default function KpiMetrics({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard icon={Compass} label="Total Trips" value={stats.trips || 0} />
      <KpiCard icon={Ticket} label="Active Bookings" value={3} />
      <KpiCard icon={Zap} label="Money Saved" value={stats.saved || 0} prefix="₹" />
      <KpiCard icon={Leaf} label="Carbon Saved" value={stats.carbon || 0} suffix=" kg" />
      <KpiCard icon={TrendingUp} label="Fav Transport" value="Rail" />
    </div>
  );
}
