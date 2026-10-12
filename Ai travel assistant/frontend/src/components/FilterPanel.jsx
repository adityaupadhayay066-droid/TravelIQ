import React from 'react';
import { Filter, Train, Plane, Bus, Armchair, X, RotateCcw } from 'lucide-react';

export default function FilterPanel({
  selectedTransport = ['Train', 'Flight', 'Bus'],
  onToggleTransport,
  priceMax = 15000,
  onPriceMaxChange,
  selectedStops = ['Non-stop', '1 Stop', '2+ Stops'],
  onToggleStop,
  selectedClasses = [],
  onToggleClass,
  onReset,
  hideHeader = false,
  onClose
}) {
  const travelClassOptions = [
    { id: 'SL', label: 'Sleeper Class (SL)' },
    { id: '2S', label: 'Second Sitting (2S)' },
    { id: 'CC', label: 'AC Chair Car (CC)' },
    { id: 'EC', label: 'Executive Class (EC)' },
    { id: '3A', label: 'Third AC (3A)' },
    { id: '2A', label: 'Second AC (2A)' },
    { id: '1A', label: 'First AC (1A)' },
    { id: 'Economy', label: 'Flight Economy' },
    { id: 'AC Sleeper', label: 'Bus AC Sleeper' }
  ];

  return (
    <div className={`space-y-5 text-left ${hideHeader ? 'p-0' : 'bg-white dark:bg-[#18222D] border border-[#E3E7EA] dark:border-slate-800 rounded-xl p-5 shadow-xs'}`}>
      
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E7EA] dark:border-slate-800">
          <h3 className="font-bold text-sm text-[#202A32] dark:text-white flex items-center gap-2 font-heading">
            <Filter className="w-4 h-4 text-[#244C66] dark:text-[#5B8AA9]" />
            <span>Filters</span>
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={onReset}
              className="text-xs font-semibold text-[#66737D] hover:text-[#244C66] dark:hover:text-[#5B8AA9] cursor-pointer flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-[#89939B] hover:text-[#202A32] dark:hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transport Type */}
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#66737D] dark:text-slate-400">
          Transport Mode
        </h4>
        <div className="space-y-2">
          {[
            { id: 'Train', label: 'Indian Railways', icon: Train },
            { id: 'Flight', label: 'Domestic Flights', icon: Plane },
            { id: 'Bus', label: 'Interstate Buses', icon: Bus }
          ].map(({ id, label, icon: Icon }) => (
            <label key={id} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#202A32] dark:text-slate-300 hover:text-[#244C66] dark:hover:text-white transition-colors">
              <input 
                type="checkbox"
                checked={selectedTransport.includes(id)}
                onChange={() => onToggleTransport && onToggleTransport(id)}
                className="rounded border-[#E3E7EA] dark:border-slate-700 accent-[#244C66] focus:ring-[#244C66]"
              />
              <Icon className="w-4 h-4 text-[#66737D]" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E3E7EA] dark:border-slate-800">
        <div className="flex justify-between items-center text-xs font-bold text-[#66737D] dark:text-slate-400">
          <span>Max Budget</span>
          <span className="text-[#244C66] dark:text-[#5B8AA9] font-mono text-sm font-extrabold">₹{priceMax.toLocaleString('en-IN')}</span>
        </div>
        <input 
          type="range"
          min="400"
          max="20000"
          step="200"
          value={priceMax}
          onChange={(e) => onPriceMaxChange && onPriceMaxChange(Number(e.target.value))}
          className="w-full accent-[#244C66] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-[#89939B]">
          <span>₹400</span>
          <span>₹20,000+</span>
        </div>
      </div>

      {/* Stops */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E3E7EA] dark:border-slate-800">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#66737D] dark:text-slate-400">
          Route Stops
        </h4>
        <div className="space-y-2">
          {['Non-stop', '1 Stop', '2+ Stops'].map((stop) => (
            <label key={stop} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#202A32] dark:text-slate-300 hover:text-[#244C66] dark:hover:text-white transition-colors">
              <input 
                type="checkbox"
                checked={selectedStops.includes(stop)}
                onChange={() => onToggleStop && onToggleStop(stop)}
                className="rounded border-[#E3E7EA] dark:border-slate-700 accent-[#244C66] focus:ring-[#244C66]"
              />
              <span>{stop}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Travel Class Selection */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E3E7EA] dark:border-slate-800">
        <div className="flex justify-between items-center">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#66737D] dark:text-slate-400 flex items-center gap-1.5">
            <Armchair className="w-3.5 h-3.5 text-[#244C66] dark:text-[#5B8AA9]" />
            <span>Travel Class</span>
          </h4>
          {selectedClasses.length > 0 && (
            <span className="text-[10px] bg-[#EAF0F4] text-[#244C66] px-1.5 py-0.5 rounded font-bold font-mono">
              {selectedClasses.length} selected
            </span>
          )}
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {travelClassOptions.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#202A32] dark:text-slate-300 hover:text-[#244C66] dark:hover:text-white py-0.5 transition-colors">
              <input 
                type="checkbox"
                checked={selectedClasses.includes(id)}
                onChange={() => onToggleClass && onToggleClass(id)}
                className="rounded border-[#E3E7EA] dark:border-slate-700 accent-[#244C66] focus:ring-[#244C66]"
              />
              <span className="truncate">{label}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}
