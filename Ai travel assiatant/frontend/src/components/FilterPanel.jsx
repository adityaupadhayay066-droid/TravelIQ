import React from 'react';
import { Filter, Train, Plane, Bus, Armchair } from 'lucide-react';

export default function FilterPanel({
  selectedTransport = ['Train', 'Flight', 'Bus'],
  onToggleTransport,
  priceMax = 15000,
  onPriceMaxChange,
  selectedStops = ['Non-stop', '1 Stop', '2+ Stops'],
  onToggleStop,
  selectedClasses = [],
  onToggleClass,
  onReset
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
    <div className="bg-white dark:bg-[#1b2c28] border border-[#E3DED2] dark:border-[#2a403a] rounded-[12px] p-5 space-y-5 text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E3DED2] dark:border-[#2a403a]">
        <h3 className="font-bold text-base text-[#173F3A] dark:text-white flex items-center gap-2 font-heading">
          <Filter className="w-4 h-4 text-[#D96C4F]" /> Filters
        </h3>
        <button 
          onClick={onReset}
          className="text-xs font-semibold text-[#D96C4F] hover:underline cursor-pointer"
        >
          Reset All
        </button>
      </div>

      {/* Transport Type */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
          Transport Type
        </h4>
        <div className="space-y-2">
          {[
            { id: 'Train', icon: Train },
            { id: 'Flight', icon: Plane },
            { id: 'Bus', icon: Bus }
          ].map(({ id, icon: Icon }) => (
            <label key={id} className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-[#263238] dark:text-[#F7F5EF]">
              <input 
                type="checkbox"
                checked={selectedTransport.includes(id)}
                onChange={() => onToggleTransport && onToggleTransport(id)}
                className="rounded border-[#E3DED2] text-[#173F3A] focus:ring-[#173F3A]"
              />
              <Icon className="w-4 h-4 text-[#66736F]" />
              <span>{id}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Travel Class Selection */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E3DED2] dark:border-[#2a403a]">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1.5">
            <Armchair className="w-3.5 h-3.5 text-[#173F3A] dark:text-[#EEF2ED]" /> Travel Class
          </h4>
          {selectedClasses.length > 0 && (
            <span className="text-[10px] bg-[#D96C4F]/10 text-[#D96C4F] px-1.5 py-0.5 rounded font-bold font-mono">
              {selectedClasses.length} selected
            </span>
          )}
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {travelClassOptions.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#263238] dark:text-[#F7F5EF] hover:text-[#173F3A] dark:hover:text-white py-0.5">
              <input 
                type="checkbox"
                checked={selectedClasses.includes(id)}
                onChange={() => onToggleClass && onToggleClass(id)}
                className="rounded border-[#E3DED2] text-[#173F3A] focus:ring-[#173F3A]"
              />
              <span className="truncate">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E3DED2] dark:border-[#2a403a]">
        <div className="flex justify-between items-center text-xs font-bold text-[#66736F] dark:text-[#A3B0AB]">
          <span>Max Price</span>
          <span className="text-[#173F3A] dark:text-white font-mono text-sm">₹{priceMax.toLocaleString()}</span>
        </div>
        <input 
          type="range"
          min="300"
          max="15000"
          step="200"
          value={priceMax}
          onChange={(e) => onPriceMaxChange && onPriceMaxChange(Number(e.target.value))}
          className="w-full accent-[#D96C4F] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-[#66736F]">
          <span>₹300</span>
          <span>₹15,000+</span>
        </div>
      </div>

      {/* Stops */}
      <div className="space-y-2.5 pt-3.5 border-t border-[#E3DED2] dark:border-[#2a403a]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB]">
          Stops
        </h4>
        <div className="space-y-2">
          {['Non-stop', '1 Stop', '2+ Stops'].map((stop) => (
            <label key={stop} className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-[#263238] dark:text-[#F7F5EF]">
              <input 
                type="checkbox"
                checked={selectedStops.includes(stop)}
                onChange={() => onToggleStop && onToggleStop(stop)}
                className="rounded border-[#E3DED2] text-[#173F3A] focus:ring-[#173F3A]"
              />
              <span>{stop}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}

