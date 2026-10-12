import React, { useState } from 'react';
import { IndianRupee, PieChart, Train, Hotel, Utensils, Compass, ShieldAlert, Sparkles, Plus, Minus } from 'lucide-react';

const BUDGET_PRESETS = [10000, 15000, 25000, 40000, 60000];

export default function TravelBudgetPlanner({ initialBudget = 15000, destination = 'Manali' }) {
  const [totalBudget, setTotalBudget] = useState(initialBudget);
  const [customInput, setCustomInput] = useState(initialBudget.toString());

  // Proportions: 40% transport, 27% hotel, 17% food, 10% activities, 6% emergency
  const transport = Math.round(totalBudget * 0.40);
  const accommodation = Math.round(totalBudget * 0.27);
  const food = Math.round(totalBudget * 0.17);
  const activities = Math.round(totalBudget * 0.10);
  const emergency = totalBudget - (transport + accommodation + food + activities);

  const categories = [
    {
      name: 'Transportation',
      amount: transport,
      pct: 40,
      color: '#0D9488',
      bgColor: 'bg-teal-600',
      icon: Train,
      detail: 'Trains (AC 3T/Sleeper), Local Cab, Bus connections'
    },
    {
      name: 'Accommodation',
      amount: accommodation,
      pct: 27,
      color: '#0284C7',
      bgColor: 'bg-sky-600',
      icon: Hotel,
      detail: 'Comfortable 3-star stays & verified boutique guesthouses'
    },
    {
      name: 'Food & Dining',
      amount: food,
      pct: 17,
      color: '#F59E0B',
      bgColor: 'bg-amber-500',
      icon: Utensils,
      detail: 'Local thalis, authentic dining, street snacks & beverages'
    },
    {
      name: 'Activities & Sightseeing',
      amount: activities,
      pct: 10,
      color: '#10B981',
      bgColor: 'bg-emerald-600',
      icon: Compass,
      detail: 'Monument tickets, adventure passes, local guides'
    },
    {
      name: 'Emergency & Incidentals',
      amount: emergency,
      pct: 6,
      color: '#8B5CF6',
      bgColor: 'bg-purple-500',
      icon: ShieldAlert,
      detail: 'Buffer for transit delays, medical, or spontaneous plans'
    }
  ];

  const handleBudgetChange = (val) => {
    const num = Math.max(2000, Math.min(200000, parseInt(val) || 0));
    setTotalBudget(num);
    setCustomInput(num.toString());
  };

  return (
    <div className="bg-white dark:bg-[#0E1726] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-heading">
              Smart Travel Budget Planner
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Optimized budget distribution for journeys to {destination} and across India.
          </p>
        </div>

        {/* Total Budget Pill Display */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total:</span>
          <span className="text-lg sm:text-xl font-black text-teal-600 dark:text-teal-400 font-mono">
            ₹{totalBudget.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Preset Buttons & Custom Slider */}
      <div className="py-4 space-y-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quick Presets:</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleBudgetChange(preset)}
                className={`py-1.5 px-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer border text-center ${
                  totalBudget === preset
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-teal-500'
                }`}
              >
                ₹{preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Budget Scale</span>
            <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">₹{totalBudget.toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min="5000"
            max="60000"
            step="1000"
            value={totalBudget}
            onChange={(e) => handleBudgetChange(e.target.value)}
            className="w-full accent-teal-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Stacked Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-[#E3DED2] dark:bg-[#273E36] overflow-hidden flex">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              title={`${cat.name}: ₹${cat.amount.toLocaleString('en-IN')} (${cat.pct}%)`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] px-0.5">
          <span>Transport (40%)</span>
          <span>Stays (27%)</span>
          <span>Food (17%)</span>
          <span>Activities (10%)</span>
          <span>Buffer (6%)</span>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const isLastOdd = idx === categories.length - 1 && categories.length % 2 !== 0;
          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border border-[#E3DED2] dark:border-[#273E36] bg-[#FFFDF7] dark:bg-[#101B17] hover:border-[#14532D]/40 dark:hover:border-[#489A6B]/40 transition-colors ${
                isLastOdd ? 'sm:col-span-2' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg text-white shrink-0 ${cat.bgColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#1F2933] dark:text-[#F7F5EF] truncate">
                    {cat.name}
                  </span>
                </div>
                <span className="text-xs font-black font-mono text-[#14532D] dark:text-[#EEF2ED] shrink-0 bg-[#EEF2ED] dark:bg-[#1D322B] px-2 py-0.5 rounded-md">
                  ₹{cat.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight">
                {cat.detail}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
