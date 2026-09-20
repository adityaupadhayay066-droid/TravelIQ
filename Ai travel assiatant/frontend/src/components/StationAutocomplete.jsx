import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { MapPin, Search } from 'lucide-react';

export default function StationAutocomplete({ value, onChange, placeholder, inputPlaceholder, icon: Icon = MapPin, active, onFocus, onBlur, inputRef, showVoiceBtn }) {
  // Handle both string and object value props gracefully
  const getDisplayName = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.station_name || '';
  };

  const [query, setQuery] = useState(getDisplayName(value));
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const displayName = getDisplayName(value);
    if (displayName !== query) {
      setQuery(displayName);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        if (onBlur) onBlur();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    try {
      const response = await api.get(`/travel/stations/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: abortControllerRef.current.signal
      });
      setSuggestions(response.data);
      setShowDropdown(true);
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error("Error fetching stations:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    // Clear selected value if typing
    if (value) {
      onChange(null);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (val.trim() === '') {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce
    typingTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 300);
  };

  const handleSelect = (station) => {
    setQuery(station.station_name);
    onChange(station);
    setShowDropdown(false);
    if (onBlur) onBlur();
  };

  return (
    <div className="relative flex-1 w-full" ref={wrapperRef}>
      <div className={`flex items-center bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl p-3 border transition-colors h-[58px] ${active ? 'border-[#173F3A] dark:border-[#EEF2ED] bg-[#FFFFFF] dark:bg-[#1B2C28]' : 'border-[#E3DED2] dark:border-[#2A403A] hover:border-[#173F3A]/50 dark:hover:border-[#EEF2ED]/50'}`}>
        <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${active ? 'text-[#173F3A] dark:text-[#EEF2ED]' : 'text-[#66736F] dark:text-[#A3B0AB]'}`} />
        <div className="flex flex-col w-full relative overflow-hidden">
          <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-medium uppercase tracking-wider truncate">{placeholder}</span>
          <input 
            ref={inputRef}
            type="text" 
            value={query} 
            onChange={handleInputChange}
            onFocus={() => {
              if (onFocus) onFocus();
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder={inputPlaceholder || "Search city or station code..."}
            className="bg-transparent border-none outline-none text-[#263238] dark:text-[#F7F5EF] font-bold w-full placeholder-[#66736F]/60 dark:placeholder-[#A3B0AB]/60 text-xs sm:text-sm focus:ring-0 p-0 m-0" 
          />
        </div>
        {showVoiceBtn}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-[#FFFFFF] dark:bg-[#1B2C28] max-h-60 overflow-y-auto rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)] border border-[#E3DED2] dark:border-[#2A403A]">
          <ul className="py-2">
            {suggestions.map((station, i) => (
              <li 
                key={station.id || i}
                onClick={() => handleSelect(station)}
                className="px-4 py-2 hover:bg-[#EEF2ED] dark:hover:bg-[#213530] cursor-pointer flex justify-between items-center transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-[#263238] dark:text-[#F7F5EF] text-sm font-medium">{station.station_name}</span>
                  <span className="text-[#66736F] dark:text-[#A3B0AB] text-xs">{station.city || 'India'}</span>
                </div>
                <div className="bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] text-xs px-2 py-1 rounded border border-[#E3DED2] dark:border-[#2A403A]">
                  {station.station_code}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
