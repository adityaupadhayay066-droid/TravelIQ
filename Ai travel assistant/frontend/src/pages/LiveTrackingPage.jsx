import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Train, Clock, MapPin, CheckCircle2, Navigation, AlertTriangle, 
    RefreshCw, Route, Zap, Compass, Radio, Info, CalendarDays, Activity,
    Layers, LayoutGrid
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

// Leaflet Map Imports
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Map
const stationIcon = new L.DivIcon({
    className: 'custom-station-wrapper',
    html: `<div class="station-marker-dot"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const trainIcon = new L.DivIcon({
    className: 'custom-train-wrapper',
    html: `<div class="train-pulse-marker">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <rect x="4" y="3" width="16" height="16" rx="2"></rect>
               <path d="M4 11h16"></path>
               <path d="M12 3v8"></path>
               <path d="m8 19-2 3"></path>
               <path d="m16 19 2 3"></path>
               <circle cx="8" cy="15" r="1" fill="currentColor"></circle>
               <circle cx="16" cy="15" r="1" fill="currentColor"></circle>
             </svg>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

// Debounce hook
function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

export default function LiveTrackingPage() {
    const [trainQuery, setTrainQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [trackingData, setTrackingData] = useState(null);
    const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'timeline'

    // Date Selection State
    const [journeyDate, setJourneyDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    // Autocomplete
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const searchRef = useRef(null);
    const debouncedQuery = useDebounce(trainQuery, 300);

    // Recent searches
    const [recentSearches, setRecentSearches] = useState(() => {
        const local = localStorage.getItem('tiq_recent_tracks');
        return local ? JSON.parse(local) : [];
    });

    // Auto-refresh timer
    const [autoRefresh, setAutoRefresh] = useState(false);
    const refreshIntervalRef = useRef(null);
    const [, setLastRefreshed] = useState(null);

    // Fetch autocomplete suggestions
    useEffect(() => {
        if (debouncedQuery.length >= 2) {
            setLoadingSuggestions(true);
            api.get(`/travel/trains/search?q=${encodeURIComponent(debouncedQuery)}`)
                .then(res => {
                    setSuggestions(res.data || []);
                    setShowSuggestions(true);
                })
                .catch(() => setSuggestions([]))
                .finally(() => setLoadingSuggestions(false));
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [debouncedQuery]);

    // Click-outside handler for suggestions
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-refresh logic
    useEffect(() => {
        if (autoRefresh && trackingData) {
            refreshIntervalRef.current = setInterval(() => {
                handleSearch(trackingData.train_number, journeyDate, true);
            }, 30000);
        }
        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, [autoRefresh, trackingData, journeyDate]);

    // Trigger search automatically when date changes if train is already selected
    useEffect(() => {
        if (trackingData) {
            handleSearch(trackingData.train_number, journeyDate);
        }
    }, [journeyDate]);

    const getDayName = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { weekday: 'long' });
    };

    const handleSearch = async (num, dateOverride, silent = false) => {
        const query = num || trainQuery;
        const dateToUse = dateOverride || journeyDate;
        const selectedDay = getDayName(dateToUse);

        if (!query) {
            toast.error('Please enter a train number or name.');
            return;
        }

        setSearching(true);
        try {
            const trainNumber = query.trim();
            const res = await api.get(`/travel/trains/live-status/${trainNumber}?journeyDate=${dateToUse}&selectedDay=${selectedDay}`);
            
            setTrackingData(res.data);
            setLastRefreshed(new Date());

            const updatedRecents = [
                { number: res.data.train_number, name: res.data.train_name },
                ...recentSearches.filter(s => s.number !== res.data.train_number)
            ].slice(0, 6);
            setRecentSearches(updatedRecents);
            localStorage.setItem('tiq_recent_tracks', JSON.stringify(updatedRecents));
            
            if (!silent) toast.success(`Tracking ${res.data.train_name} for ${selectedDay}, ${dateToUse}`);
        } catch (error) {
            if (error.response?.status === 400) {
                if (!silent) toast.error(error.response.data.message || 'Train does not run on this day.');
                setTrackingData(null);
            } else {
                if (!silent) toast.error(error.response?.data?.message || 'Train not found or error loading schedule.');
                setTrackingData(null);
            }
        } finally {
            setSearching(false);
            setShowSuggestions(false);
        }
    };

    const triggerRefresh = () => {
        if (trackingData) handleSearch(trackingData.train_number, journeyDate, true);
    };

    const selectSuggestion = (train) => {
        setTrainQuery(train.train_number);
        setShowSuggestions(false);
        handleSearch(train.train_number, journeyDate);
    };

    // Calculate quick dates for Date Selector
    const getQuickDates = () => {
        const today = new Date();
        const yest = new Date(today); yest.setDate(yest.getDate() - 1);
        const tom = new Date(today); tom.setDate(tom.getDate() + 1);
        
        return [
            { label: 'Yesterday', value: yest.toISOString().split('T')[0] },
            { label: 'Today', value: today.toISOString().split('T')[0] },
            { label: 'Tomorrow', value: tom.toISOString().split('T')[0] }
        ];
    };

    // Compute derived data
    const getProgressPercent = () => {
        if (!trackingData?.timeline?.length) return 0;
        if (trackingData.live_status.status === 'Completed') return 100;
        if (trackingData.live_status.status === 'Not Started') return 0;
        const currentIdx = trackingData.timeline.findIndex(s => s.station_code === trackingData.live_status.last_crossed_station || s.station_code === trackingData.live_status.current_station_code);
        if (currentIdx === -1) return 0;
        return Math.round(((currentIdx) / (trackingData.timeline.length - 1)) * 100);
    };

    const getStatusConfig = (status, delay) => {
        if (status === 'Completed') {
            return { 
                gradient: 'bg-emerald-500', 
                bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
                text: 'text-emerald-700 dark:text-emerald-300', 
                border: 'border-emerald-500/30', 
                label: 'Journey Completed', 
                icon: CheckCircle2 
            };
        }
        if (status === 'Not Started') {
            return { 
                gradient: 'bg-slate-500', 
                bg: 'bg-slate-500/10 dark:bg-slate-500/20', 
                text: 'text-slate-700 dark:text-slate-300', 
                border: 'border-slate-400/30', 
                label: 'Not Yet Departed', 
                icon: Clock 
            };
        }
        if (delay === 0) {
            return { 
                gradient: 'bg-emerald-500', 
                bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
                text: 'text-emerald-700 dark:text-emerald-300', 
                border: 'border-emerald-500/30', 
                label: 'Running On Time', 
                icon: Zap 
            };
        }
        if (delay > 0 && delay <= 15) {
            return { 
                gradient: 'bg-amber-500', 
                bg: 'bg-amber-500/10 dark:bg-amber-500/20', 
                text: 'text-amber-700 dark:text-amber-300', 
                border: 'border-amber-500/30', 
                label: `Late by ${delay} min`, 
                icon: AlertTriangle 
            };
        }
        return { 
            gradient: 'bg-rose-500', 
            bg: 'bg-rose-500/10 dark:bg-rose-500/20', 
            text: 'text-rose-700 dark:text-rose-300', 
            border: 'border-rose-500/30', 
            label: `Delayed ${delay} min`, 
            icon: AlertTriangle 
        };
    };

    const getTrainDetails = () => {
        if (!trackingData?.timeline?.length) return {};
        const timeline = trackingData.timeline;
        const source = timeline[0];
        const destination = timeline[timeline.length - 1];
        
        let durationHours = 0;
        if (source.departure_time && destination.arrival_time) {
            const parseTime = (t) => {
                if (!t) return 0;
                const parts = t.split(':');
                return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
            };
            const depMins = parseTime(source.departure_time);
            const arrMins = parseTime(destination.arrival_time);
            const dayDiff = (destination.day_count || 1) - (source.day_count || 1);
            let totalMins = dayDiff * 24 * 60 + arrMins - depMins;
            if (totalMins < 0) totalMins += 24 * 60;
            durationHours = totalMins / 60;
        }

        const num = parseInt(trackingData.train_number.replace(/\D/g, '')) || 12345;
        let trainType = 'Express';
        if (num >= 12000 && num <= 12999) trainType = 'Superfast Express';
        else if (num >= 20000 && num <= 22999) trainType = 'Rajdhani / Premium';
        else if (num >= 12000 && num < 12100) trainType = 'Shatabdi';
        else if (num >= 10000 && num <= 11999) trainType = 'Mail Express';
        else if (num >= 50000 && num <= 59999) trainType = 'Passenger';

        let runningDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        if (num % 7 === 1) runningDays = ['Mon', 'Wed', 'Fri'];
        else if (num % 7 === 2) runningDays = ['Tue', 'Thu', 'Sat'];
        else if (num % 7 === 3) runningDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        else if (num % 7 === 4) runningDays = ['Wed', 'Fri', 'Sun'];

        const classes = ['2S', 'SL', '3A', '2A', '1A'];
        if (trainType.includes('Rajdhani') || trainType.includes('Premium')) {
            classes.splice(0, 2);
            classes.push('EC');
        }

        const totalStops = timeline.length;
        const estimatedDistance = Math.round(durationHours * 55 + totalStops * 12);

        return {
            source,
            destination,
            trainType,
            runningDays,
            classes,
            durationHours,
            totalStops,
            estimatedDistance
        };
    };

    const formatDuration = (hours) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    const formatTime12h = (timeStr) => {
        if (!timeStr) return '--';
        const parts = timeStr.split(':');
        let h = parseInt(parts[0]) || 0;
        const m = parts[1] || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    };

    const details = trackingData ? getTrainDetails() : null;
    const statusConfig = trackingData ? getStatusConfig(trackingData.live_status.status, trackingData.live_status.delay_minutes) : null;
    const progressPercent = trackingData ? getProgressPercent() : 0;
    const StatusIcon = statusConfig?.icon || Clock;

    // Map Route Processing
    let polylinePositions = [];
    let completedPositions = [];
    let activeLat = 20.5937; // Default India
    let activeLng = 78.9629;
    if (trackingData && trackingData.timeline) {
        polylinePositions = trackingData.timeline
            .filter(stop => stop.latitude && stop.longitude)
            .map(stop => [stop.latitude, stop.longitude]);
            
        const currentIdx = trackingData.timeline.findIndex(s => s.station_code === trackingData.live_status.last_crossed_station || s.station_code === trackingData.live_status.current_station_code);
        completedPositions = trackingData.timeline
            .filter((stop, idx) => stop.latitude && stop.longitude && (idx <= currentIdx || stop.is_completed))
            .map(stop => [stop.latitude, stop.longitude]);
            
        if (trackingData.live_status.current_lat && trackingData.live_status.current_lng) {
            activeLat = trackingData.live_status.current_lat;
            activeLng = trackingData.live_status.current_lng;
            completedPositions.push([activeLat, activeLng]);
        } else if (polylinePositions.length > 0) {
            activeLat = polylinePositions[0][0];
            activeLng = polylinePositions[0][1];
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 text-slate-900 dark:text-slate-100 relative">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Navigation className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Where is My Train?
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                Algorithmic live tracking & map visualization
                            </p>
                        </div>
                    </div>

                    {trackingData && (
                        <div className="flex items-center gap-3 shrink-0">
                            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none bg-white dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={autoRefresh}
                                    onClick={() => setAutoRefresh(!autoRefresh)}
                                    className={`w-9 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ${
                                        autoRefresh ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                >
                                    <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                        autoRefresh ? 'translate-x-4.5' : 'translate-x-0.5'
                                    }`} />
                                </button>
                                <span>Auto-refresh</span>
                            </label>

                            <button 
                                onClick={triggerRefresh} 
                                className="p-2 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all cursor-pointer" 
                                title="Refresh Telemetry Now"
                            >
                                <RefreshCw className={`w-4 h-4 ${searching ? 'animate-spin text-blue-500' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ═══ LEFT PANEL: Search & Info ═══ */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Search & Date Card */}
                    <div className="bg-white dark:bg-slate-900/90 p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl relative">
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Track Your Train
                        </h2>

                        <form onSubmit={(e) => { e.preventDefault(); handleSearch(trainQuery, journeyDate); }} className="space-y-4">
                            {/* Train Search Input */}
                            <div className="relative" ref={searchRef}>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Train Number or Name
                                </label>
                                <div className="relative flex items-center">
                                    <Train className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        placeholder="e.g. 12801 or Purushottam"
                                        value={trainQuery}
                                        onChange={(e) => setTrainQuery(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl py-2.5 px-4 pl-10 text-sm font-semibold transition-all text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                    {loadingSuggestions && (
                                        <div className="absolute right-3.5">
                                            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Autocomplete Dropdown */}
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
                                        >
                                            {suggestions.map((train, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => selectSuggestion(train)}
                                                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all border-b border-slate-100 dark:border-slate-800 last:border-none cursor-pointer group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                        <Train className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                            {train.train_name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                                            #{train.train_number}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Date Selection */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                                    <span>Journey Date</span>
                                    <span className="text-blue-600 dark:text-blue-400 font-bold lowercase first-letter:uppercase">
                                        {getDayName(journeyDate)}
                                    </span>
                                </label>
                                
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    {getQuickDates().map(d => {
                                        const isSelected = journeyDate === d.value;
                                        return (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => setJourneyDate(d.value)}
                                                className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/25' 
                                                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                {d.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <input
                                    type="date"
                                    value={journeyDate}
                                    onChange={(e) => setJourneyDate(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none rounded-xl py-2 px-3.5 text-sm font-semibold text-slate-900 dark:text-white cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>

                            {/* Primary Action Button (High Contrast & Visible) */}
                            <button
                                type="submit"
                                disabled={searching}
                                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                                className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 !text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] text-sm tracking-wide"
                            >
                                {searching ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin !text-white" />
                                        <span className="!text-white font-bold">Locating Train...</span>
                                    </>
                                ) : (
                                    <>
                                        <Navigation className="w-4 h-4 !text-white" />
                                        <span className="!text-white font-bold">Locate Train</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Train Details Card */}
                    {trackingData && details && (
                        <motion.div 
                            initial={{ opacity: 0, y: 12 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900/90 p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl space-y-4"
                        >
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-blue-500" /> Train Information
                            </h3>

                            {/* Source → Destination Corridor */}
                            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
                                <div className="text-left flex-1 min-w-0">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Source</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {details.source?.station_name || details.source?.station_code}
                                    </p>
                                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                        {details.source?.departure_time ? formatTime12h(details.source.departure_time) : '--'}
                                    </p>
                                </div>

                                <div className="flex flex-col items-center shrink-0 px-1">
                                    <div className="w-16 sm:w-20 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                            <Train className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 mt-2">
                                        {details.durationHours ? formatDuration(details.durationHours) : '--'}
                                    </p>
                                </div>

                                <div className="text-right flex-1 min-w-0">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Destination</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {details.destination?.station_name || details.destination?.station_code}
                                    </p>
                                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                        {details.destination?.arrival_time ? formatTime12h(details.destination.arrival_time) : '--'}
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Train Type</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{details.trainType}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Distance (est.)</p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{details.estimatedDistance} km</p>
                                </div>
                            </div>

                            {/* Running Days */}
                            <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                                    <CalendarDays className="w-3.5 h-3.5 text-blue-500" /> Running Days
                                </p>
                                <div className="flex gap-1.5 flex-wrap">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                        const active = details.runningDays?.includes(day);
                                        const isSelected = getDayName(journeyDate) === day;
                                        return (
                                            <span 
                                                key={day} 
                                                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                                                    isSelected 
                                                        ? 'bg-blue-600 text-white shadow-xs font-extrabold' 
                                                        : active 
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700' 
                                                            : 'bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 line-through opacity-40'
                                                }`}
                                            >
                                                {day.substring(0, 3)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* ═══ RIGHT PANEL: Live Status + Route + Map ═══ */}
                <div className="lg:col-span-8 space-y-6">
                    {!trackingData ? (
                        <div className="h-full min-h-[500px] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-10 shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                                <Compass className="w-8 h-8 opacity-70" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Select Date & Train</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-2 leading-relaxed">
                                Enter a train number (e.g. 12801) or name, pick your travel date, and view simulated live GPS telemetry and complete station timeline.
                            </p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* LIVE STATUS CARD */}
                            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-sm">
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusConfig.gradient}`} />
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-[10px] uppercase font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                <Radio className="w-3 h-3 text-blue-500 animate-pulse" /> LIVE
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                Journey: {journeyDate}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                                            {trackingData.train_name}
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">#{trackingData.train_number}</p>
                                    </div>

                                    {/* Status Badge (Never Clipped) */}
                                    <div className={`px-3.5 py-2 border rounded-xl ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 self-start sm:self-auto`}>
                                        <StatusIcon className="w-4 h-4 shrink-0" />
                                        <span>{statusConfig.label}</span>
                                    </div>
                                </div>

                                {/* Status Message */}
                                {trackingData.live_status.last_status_message && (
                                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3 mb-4">
                                        <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                                            {trackingData.live_status.last_status_message}
                                        </p>
                                    </div>
                                )}

                                {/* Progress Bar (Clean Track & High Visibility) */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <span>Journey Progress</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-mono">{progressPercent}%</span>
                                    </div>
                                    <div 
                                        className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-hidden relative"
                                        aria-hidden="true"
                                    >
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercent}%` }}
                                            transition={{ duration: 1.2, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${statusConfig.gradient}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* VIEW MODE SELECTOR TOOLBAR */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Route className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    Route Telemetry & GPS Tracking
                                </h3>

                                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('split')}
                                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            viewMode === 'split' 
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" /> Split View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('map')}
                                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            viewMode === 'map' 
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <MapPin className="w-3.5 h-3.5" /> Map View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('timeline')}
                                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            viewMode === 'timeline' 
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Layers className="w-3.5 h-3.5" /> Timeline
                                    </button>
                                </div>
                            </div>

                            {/* MAP AND ROUTE TIMELINE */}
                            <div className={`grid gap-6 ${
                                viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
                            }`}>
                                {/* ── MAP CONTAINER (No Watermarks, Dark Themed) ── */}
                                {(viewMode === 'split' || viewMode === 'map') && (
                                    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 rounded-2xl overflow-hidden h-[520px] relative shadow-sm">
                                        <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Live GPS Trace</span>
                                        </div>
                                        
                                        <MapContainer 
                                            center={[activeLat, activeLng]} 
                                            zoom={6} 
                                            scrollWheelZoom={true} 
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            {/* OpenStreetMap TileLayer: 100% Free, NO API KEY REQUIRED, NO WATERMARK */}
                                            <TileLayer
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            />

                                            {/* Full Route Polyline */}
                                            {polylinePositions.length > 0 && (
                                                <Polyline 
                                                    positions={polylinePositions} 
                                                    color="#94a3b8" 
                                                    weight={3} 
                                                    opacity={0.5}
                                                    dashArray="6, 10" 
                                                />
                                            )}
                                            {/* Completed Route Polyline */}
                                            {completedPositions.length > 0 && (
                                                <Polyline 
                                                    positions={completedPositions} 
                                                    color="#2563eb" 
                                                    weight={4} 
                                                    opacity={0.85}
                                                />
                                            )}

                                            {/* Station Markers */}
                                            {trackingData.timeline.map((stop, idx) => {
                                                if (!stop.latitude || !stop.longitude) return null;
                                                return (
                                                    <Marker 
                                                        key={`station-${idx}`} 
                                                        position={[stop.latitude, stop.longitude]} 
                                                        icon={stationIcon}
                                                        opacity={stop.is_completed ? 0.6 : 1}
                                                    >
                                                        <Popup className="custom-dark-popup">
                                                            <div className="p-1">
                                                                <strong className="text-slate-900 dark:text-white text-xs font-bold">
                                                                    {stop.station_name} ({stop.station_code})
                                                                </strong>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                                                                    Day {stop.day_count} • Stop #{stop.stop_sequence}
                                                                </p>
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                );
                                            })}

                                            {/* Current Train GPS Marker */}
                                            {trackingData.live_status.current_lat && trackingData.live_status.current_lng && (
                                                <Marker 
                                                    position={[trackingData.live_status.current_lat, trackingData.live_status.current_lng]} 
                                                    icon={trainIcon}
                                                    zIndexOffset={1000}
                                                >
                                                    <Popup>
                                                        <div className="p-1">
                                                            <strong className="text-xs font-bold text-slate-900 dark:text-white">Current Location</strong>
                                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {trackingData.live_status.last_status_message}
                                                            </p>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            )}
                                        </MapContainer>
                                    </div>
                                )}

                                {/* ── ROUTE TIMELINE (Perfect Alignment & Zero Text Overflow) ── */}
                                {(viewMode === 'split' || viewMode === 'timeline') && (
                                    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl h-[520px] flex flex-col shadow-sm">
                                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                <Route className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Route Stops ({trackingData.timeline.length})</span>
                                            </h4>
                                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
                                                {details?.durationHours ? `${formatDuration(details.durationHours)} journey` : ''}
                                            </span>
                                        </div>

                                        {/* Timeline scroll container */}
                                        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar relative space-y-2.5">
                                            {/* Mathematically Centered Timeline Vertical Track */}
                                            <div className="absolute left-[19px] top-4 bottom-6 w-[2px] bg-slate-200 dark:bg-slate-800" />
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${progressPercent}%` }}
                                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                                className="absolute left-[19px] top-4 w-[2px] bg-gradient-to-b from-blue-500 to-indigo-600"
                                            />

                                            {trackingData.timeline.map((stop, i) => {
                                                const hasPassed = stop.is_completed;
                                                const isCurrentlyHere = stop.is_current || trackingData.live_status.current_station_code === stop.station_code;
                                                const isSource = i === 0;
                                                const isDest = i === trackingData.timeline.length - 1;

                                                return (
                                                    <div key={i} className="flex items-start gap-3 relative group">
                                                        {/* Column 1: Centered Node Gutter (Centered at x=20px) */}
                                                        <div className="w-10 shrink-0 flex justify-center pt-3 relative z-10">
                                                            {isCurrentlyHere ? (
                                                                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-blue-500/20 shadow-md">
                                                                    <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                                                </div>
                                                            ) : hasPassed ? (
                                                                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-emerald-500/20">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 group-hover:scale-110 transition-transform" />
                                                            )}
                                                        </div>

                                                        {/* Column 2: Station Card (Responsive & Overflow-Free) */}
                                                        <div className={`flex-1 min-w-0 p-3 rounded-xl border transition-all ${
                                                            isCurrentlyHere 
                                                                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-sm' 
                                                                : hasPassed 
                                                                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-80' 
                                                                    : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                                        }`}>
                                                            {/* Station Header Row: Code + Name on left, Scheduled Times on right */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                                                            {stop.station_code}
                                                                        </span>
                                                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                                                            {stop.station_name}
                                                                        </h4>
                                                                    </div>

                                                                    {/* Metadata Badges Sub-Row */}
                                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                                        {isSource && (
                                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                                                                                SOURCE
                                                                            </span>
                                                                        )}
                                                                        {isDest && (
                                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
                                                                                DESTINATION
                                                                            </span>
                                                                        )}
                                                                        {isCurrentlyHere && (
                                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                                                                                ● CURRENT STOP
                                                                            </span>
                                                                        )}
                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                                            Stop #{stop.stop_sequence || i + 1}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Time Column (Right aligned, Structured, Never clipped) */}
                                                                <div className="shrink-0 text-right font-mono text-[11px] space-y-0.5">
                                                                    {isSource ? (
                                                                        <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-right border border-slate-200/60 dark:border-slate-700/60">
                                                                            <span className="text-[9px] text-slate-400 block font-sans font-semibold">Departs</span>
                                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                                {formatTime12h(stop.departure_time || stop.estimated_departure)}
                                                                            </span>
                                                                        </div>
                                                                    ) : isDest ? (
                                                                        <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-right border border-slate-200/60 dark:border-slate-700/60">
                                                                            <span className="text-[9px] text-slate-400 block font-sans font-semibold">Arrives</span>
                                                                            <span className="font-bold text-slate-900 dark:text-white">
                                                                                {formatTime12h(stop.arrival_time || stop.estimated_arrival)}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-right">
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <span className="text-slate-400 text-[10px]">Arr:</span>
                                                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                                    {formatTime12h(stop.estimated_arrival || stop.arrival_time)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center justify-end gap-1">
                                                                                <span className="text-slate-400 text-[10px]">Dep:</span>
                                                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                                    {formatTime12h(stop.estimated_departure || stop.departure_time)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            
            {/* Custom Embedded CSS for Leaflet & Scrollbars */}
            <style dangerouslySetInnerHTML={{__html: `
                /* Leaflet Popups */
                .leaflet-popup-content-wrapper { 
                    background: #ffffff; 
                    color: #0f172a; 
                    border-radius: 12px; 
                    border: 1px solid #e2e8f0; 
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2); 
                }
                .dark .leaflet-popup-content-wrapper { 
                    background: #1e293b !important; 
                    color: #f8fafc !important; 
                    border-color: #334155 !important; 
                }
                .leaflet-popup-tip { 
                    background: #ffffff; 
                    border: 1px solid #e2e8f0; 
                }
                .dark .leaflet-popup-tip { 
                    background: #1e293b !important; 
                    border-color: #334155 !important; 
                }
                .leaflet-container { 
                    font-family: inherit; 
                    background-color: #f8fafc;
                }
                .dark .leaflet-container { 
                    background-color: #0f172a !important; 
                }

                /* Dark Tiles Filter for OpenStreetMap (No API key needed) */
                .dark .leaflet-tile-pane {
                    filter: brightness(0.7) invert(1) contrast(2.8) hue-rotate(200deg) saturate(0.3) brightness(0.85);
                }

                /* Leaflet Bar / Zoom Controls */
                .leaflet-bar {
                    border-radius: 10px !important;
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.12) !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
                }
                .dark .leaflet-bar {
                    border-color: #334155 !important;
                }
                .dark .leaflet-bar a {
                    background-color: #1e293b !important;
                    color: #f8fafc !important;
                    border-bottom: 1px solid #334155 !important;
                }
                .dark .leaflet-bar a:hover {
                    background-color: #334155 !important;
                }

                /* Custom Station & Train Markers */
                .station-marker-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 9999px;
                    background: #ffffff;
                    border: 2.5px solid #2563eb;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    transition: transform 0.2s ease;
                }
                .station-marker-dot:hover {
                    transform: scale(1.3);
                }
                .dark .station-marker-dot {
                    background: #0f172a;
                    border-color: #38bdf8;
                }

                .train-pulse-marker {
                    width: 38px;
                    height: 38px;
                    border-radius: 9999px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    border: 3px solid #ffffff;
                    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                }
                .dark .train-pulse-marker {
                    background: linear-gradient(135deg, #38bdf8, #0284c7);
                    color: #0f172a;
                    border-color: #0f172a;
                    box-shadow: 0 4px 14px rgba(56, 189, 248, 0.45);
                }

                /* Custom Slim Scrollbars */
                .custom-scrollbar::-webkit-scrollbar { 
                    width: 5px; 
                }
                .custom-scrollbar::-webkit-scrollbar-track { 
                    background: transparent; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(148, 163, 184, 0.3); 
                    border-radius: 9999px; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                    background: rgba(148, 163, 184, 0.5); 
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(100, 116, 139, 0.3); 
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
                    background: rgba(100, 116, 139, 0.5); 
                }
            `}} />
        </div>
    );
}
