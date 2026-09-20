import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Train, Clock, MapPin, CheckCircle2, Navigation, AlertTriangle, ArrowRight, RefreshCw, Calendar,
    Route, Zap, ChevronRight, Compass, Radio, Info, CalendarDays, Activity
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
    className: 'custom-station-marker',
    html: `<div class="w-3.5 h-3.5 bg-[#FFFFFF] dark:bg-[#1B2C28] border-2 border-[#173F3A] dark:border-[#EEF2ED] rounded-full hover:scale-110 transition-all shadow-[0_4px_16px_rgba(23,63,58,0.06)]"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
});

const trainIcon = new L.DivIcon({
    className: 'custom-train-marker',
    html: `<div class="w-12 h-12 bg-[#173F3A] dark:bg-[#EEF2ED] border-4 border-[#FFFFFF] dark:border-[#1B2C28] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(23,63,58,0.06)] relative">
             
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-[#FFFFFF] dark:text-[#173F3A]" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
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
    const [lastRefreshed, setLastRefreshed] = useState(null);

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
            let trainNumber = query.trim();
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
                // Keep the old tracking data if they just changed the date to an invalid one, or clear it?
                // Let's clear it so they know it's invalid.
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
        if (status === 'Completed') return { gradient: 'bg-[#4F7D62]', bg: 'bg-[#4F7D62]/10', text: 'text-[#4F7D62]', border: 'border-[#4F7D62]/30', label: 'Journey Completed', icon: CheckCircle2 };
        if (status === 'Not Started') return { gradient: 'bg-[#66736F] dark:bg-[#A3B0AB]', bg: 'bg-[#66736F]/10', text: 'text-[#66736F] dark:text-[#A3B0AB]', border: 'border-[#66736F]/30', label: 'Not Yet Departed', icon: Clock };
        if (delay === 0) return { gradient: 'bg-[#4F7D62]', bg: 'bg-[#4F7D62]/10', text: 'text-[#4F7D62]', border: 'border-[#4F7D62]/30', label: 'Running On Time', icon: Zap };
        if (delay > 0 && delay <= 15) return { gradient: 'bg-[#E5B85C]', bg: 'bg-[#E5B85C]/10', text: 'text-[#E5B85C]', border: 'border-[#E5B85C]/30', label: `Late by ${delay} min`, icon: AlertTriangle };
        return { gradient: 'bg-[#B94A48]', bg: 'bg-[#B94A48]/10', text: 'text-[#B94A48]', border: 'border-[#B94A48]/30', label: `Delayed ${delay} min`, icon: AlertTriangle };
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

    const getUpcomingStations = () => {
        if (!trackingData?.timeline?.length) return [];
        let currentIdx = trackingData.timeline.findIndex(s => s.station_code === trackingData.live_status.next_station_code);
        if (currentIdx === -1) {
            currentIdx = trackingData.timeline.findIndex(s => s.station_code === trackingData.live_status.current_station_code);
        }
        if (currentIdx === -1) return trackingData.timeline.slice(0, 5);
        return trackingData.timeline.slice(currentIdx, currentIdx + 5);
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
    const upcomingStations = trackingData ? getUpcomingStations() : [];
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
        <div className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full text-[#263238] dark:text-[#F7F5EF] bg-[#F7F5EF] dark:bg-[#12201D] relative">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="bg-[#173F3A] dark:bg-[#EEF2ED] p-3 rounded-lg shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
                                <Navigation className="w-7 h-7 text-[#FFFFFF] dark:text-[#173F3A]" />
                            </div>
                            
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4F7D62] rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#263238] dark:text-[#F7F5EF]">
                                Where is My Train?
                            </h1>
                            <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-0.5">Algorithmic live tracking & map visualization</p>
                        </div>
                    </div>
                    {trackingData && (
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-[#66736F] dark:text-[#A3B0AB] cursor-pointer select-none">
                                <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${autoRefresh ? 'bg-[#173F3A] dark:bg-[#EEF2ED]' : 'bg-[#E3DED2] dark:bg-[#2A403A]'}`}
                                    onClick={() => setAutoRefresh(!autoRefresh)}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${autoRefresh ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                                </div>
                                Auto-refresh
                            </label>
                            <button onClick={triggerRefresh} className="p-2 rounded-lg bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-all cursor-pointer" title="Refresh Now">
                                <RefreshCw className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ═══ LEFT PANEL: Search & Info ═══ */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Search & Date Card */}
                    <div className="relative bg-[#FFFFFF] dark:bg-[#1B2C28] p-5 border border-[#E3DED2] dark:border-[#2A403A] shadow-[0_4px_16px_rgba(23,63,58,0.06)] rounded-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#173F3A] dark:bg-[#EEF2ED]/5 rounded-full blur-3xl pointer-events-none" />
                        
                        <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-[#263238] dark:text-[#F7F5EF]">
                            <Search className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" /> Track Your Train
                        </h2>

                        <form onSubmit={(e) => { e.preventDefault(); handleSearch(trainQuery, journeyDate); }} className="space-y-4">
                            {/* Train Search */}
                            <div className="relative" ref={searchRef}>
                                <label className="block text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-1">Train Number or Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 12801 or Purushottam"
                                    value={trainQuery}
                                    onChange={(e) => setTrainQuery(e.target.value)}
                                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                    className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] hover:border-[#173F3A] dark:hover:border-[#EEF2ED] focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:outline-none rounded-lg py-2.5 px-4 pl-10 text-sm font-bold transition-all text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB]"
                                />
                                <Train className="absolute left-3.5 top-[28px] w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                                {loadingSuggestions && (
                                    <div className="absolute right-3.5 top-[28px]">
                                        <RefreshCw className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB] animate-spin" />
                                    </div>
                                )}

                                {/* Autocomplete */}
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute top-full mt-2 left-0 w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg shadow-[0_4px_16px_rgba(23,63,58,0.06)] z-50 overflow-hidden  max-h-64 overflow-y-auto"
                                        >
                                            {suggestions.map((train, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => selectSuggestion(train)}
                                                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[#FFFFFF] dark:bg-[#1B2C28] transition-all border-b border-[#E3DED2] dark:border-[#2A403A] last:border-none cursor-pointer group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-[#173F3A] dark:bg-[#EEF2ED]/10 flex items-center justify-center shrink-0">
                                                        <Train className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] group-hover:text-[#D96C4F] transition-colors truncate">{train.train_name}</p>
                                                        <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-mono">#{train.train_number}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Date Selection */}
                            <div>
                                <label className="block text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-1 flex justify-between items-center">
                                    Journey Date
                                    <span className="text-[#173F3A] dark:text-[#EEF2ED]">{getDayName(journeyDate)}</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    {getQuickDates().map(d => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setJourneyDate(d.value)}
                                            className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                journeyDate === d.value 
                                                    ? 'bg-[#173F3A] dark:bg-[#EEF2ED]/20 border-brand-primary/50 text-[#173F3A] dark:text-[#EEF2ED]' 
                                                    : 'bg-[#F7F5EF] dark:bg-[#12201D] border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:bg-[#EEF2ED] dark:hover:bg-[#213530]'
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="date"
                                    value={journeyDate}
                                    onChange={(e) => setJourneyDate(e.target.value)}
                                    className="w-full bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] hover:border-[#173F3A] dark:hover:border-[#EEF2ED] focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:outline-none rounded-lg py-2 px-3 text-sm font-bold text-[#263238] dark:text-[#F7F5EF] cursor-pointer"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={searching}
                                className="w-full cursor-pointer bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-[#263238] dark:text-[#F7F5EF] py-3 rounded-lg font-bold text-sm shadow-[0_4px_16px_rgba(23,63,58,0.06)] transition-all flex items-center justify-center gap-2 disabled:opacity-55 active:scale-[0.98]"
                            >
                                {searching ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <><Navigation className="w-4 h-4" /> Locate Train</>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Train Details Card */}
                    {trackingData && details && (
                        <motion.div 
                            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            className=" p-5 border border-[#E3DED2] dark:border-[#2A403A] bg-[#0f172a]/60 rounded-xl space-y-4"
                        >
                            <h3 className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider flex items-center gap-1.5">
                                <Info className="w-3 h-3" /> Train Information
                            </h3>

                            {/* Source → Destination */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A]">
                                <div className="text-center flex-1 min-w-0">
                                    <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Source</p>
                                    <p className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] truncate">{details.source?.station_name || details.source?.station_code}</p>
                                    <p className="text-[10px] font-mono text-[#66736F] dark:text-[#A3B0AB]">{details.source?.departure_time ? formatTime12h(details.source.departure_time) : '--'}</p>
                                </div>
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-16 h-[2px] bg-[#E3DED2] dark:bg-[#2A403A] relative">
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#173F3A] dark:bg-[#EEF2ED] flex items-center justify-center">
                                            <Train className="w-2 h-2 text-[#263238] dark:text-[#F7F5EF]" />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] mt-1">{details.durationHours ? formatDuration(details.durationHours) : '--'}</p>
                                </div>
                                <div className="text-center flex-1 min-w-0">
                                    <p className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Destination</p>
                                    <p className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] truncate">{details.destination?.station_name || details.destination?.station_code}</p>
                                    <p className="text-[10px] font-mono text-[#66736F] dark:text-[#A3B0AB]">{details.destination?.arrival_time ? formatTime12h(details.destination.arrival_time) : '--'}</p>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A]">
                                    <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider">Train Type</p>
                                    <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] mt-1">{details.trainType}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A]">
                                    <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider">Distance (est.)</p>
                                    <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] mt-1">{details.estimatedDistance} km</p>
                                </div>
                            </div>

                            {/* Running Days */}
                            <div>
                                <p className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                                    <CalendarDays className="w-3 h-3" /> Running Days
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                        const active = details.runningDays?.includes(day);
                                        const isSelected = getDayName(journeyDate) === day;
                                        return (
                                            <span key={day} className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all ${
                                                isSelected ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] border border-[#173F3A]' :
                                                active ? 'bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A]' : 
                                                'bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] border border-transparent'
                                            }`}>
                                                {day.substring(0,3)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* ═══ RIGHT PANEL: Live Status + Route + Map ═══ */}
                <div className="lg:col-span-8 space-y-5">
                    {!trackingData ? (
                        <div className="h-full min-h-[500px] bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl flex flex-col items-center justify-center text-center p-10">
                            <Compass className="w-16 h-16 text-[#66736F] dark:text-[#A3B0AB] mb-4 opacity-40" />
                            <h3 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] font-heading">Select Date & Train</h3>
                            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] max-w-sm mt-2">The new tracking engine algorithmically simulates the exact train position by combining your selected journey date with real-time schedule checks.</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                            {/* LIVE STATUS HEADER */}
                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] p-6 rounded-xl relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 ${statusConfig.gradient}`} />
                                
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] uppercase font-mono bg-[#173F3A] dark:bg-[#EEF2ED]/15 text-[#173F3A] dark:text-[#EEF2ED] px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                                                <Radio className="w-3 h-3 " /> LIVE
                                            </span>
                                            <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-bold bg-[#FFFFFF] dark:bg-[#1B2C28] px-2 py-0.5 rounded">
                                                Journey: {journeyDate}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-bold text-[#263238] dark:text-[#F7F5EF] leading-tight">
                                            {trackingData.train_name}
                                        </h2>
                                        <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] font-mono mt-0.5">#{trackingData.train_number}</p>
                                    </div>
                                    <div className={`px-4 py-2.5 border rounded-lg ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} text-sm font-bold text-center flex items-center gap-2 shrink-0`}>
                                        <StatusIcon className="w-4 h-4" />
                                        {statusConfig.label}
                                    </div>
                                </div>

                                {/* Status Message */}
                                {trackingData.live_status.last_status_message && (
                                    <div className="p-3.5 rounded-lg bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] flex items-start gap-3 mb-5">
                                        <Activity className="w-5 h-5 text-[#D96C4F] shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-[#263238] dark:text-[#F7F5EF]">{trackingData.live_status.last_status_message}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="mb-5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase">Journey Progress</span>
                                        <span className="text-[10px] text-[#173F3A] dark:text-[#EEF2ED] font-mono font-bold">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-[#FFFFFF] dark:bg-[#1B2C28] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercent}%` }}
                                            transition={{ duration: 1.2, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${statusConfig.gradient} relative`}
                                        >
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg shadow-brand-primary/50" />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>

                            {/* MAP AND ROUTE TIMELINE TABS/SPLIT */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* MAP CONTAINER */}
                                <div className=" border border-[#E3DED2] dark:border-[#2A403A] bg-[#0f172a]/60 rounded-xl overflow-hidden h-[500px] relative">
                                    <div className="absolute top-4 left-4 z-[400] bg-[#FFFFFF]/90 dark:bg-[#1B2C28]/90 border border-[#E3DED2] dark:border-[#2A403A] px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                                        <span className="text-xs font-bold">Live GPS Trace</span>
                                    </div>
                                    <MapContainer 
                                        center={[activeLat, activeLng]} 
                                        zoom={6} 
                                        scrollWheelZoom={true} 
                                        style={{ height: '100%', width: '100%', backgroundColor: '#F7F5EF' }}
                                    >
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                                        />
                                        {/* Full Route Polyline (dashed gray) */}
                                        {polylinePositions.length > 0 && (
                                            <Polyline 
                                                positions={polylinePositions} 
                                                color="#66736F" 
                                                weight={3} 
                                                opacity={0.4}
                                                dashArray="6, 12" 
                                            />
                                        )}
                                        {/* Completed Route Polyline (solid blue) */}
                                        {completedPositions.length > 0 && (
                                            <Polyline 
                                                positions={completedPositions} 
                                                color="#173F3A" 
                                                weight={4} 
                                                opacity={0.8}
                                            />
                                        )}

                                        {/* Station Markers */}
                                        {trackingData.timeline.map((stop, idx) => {
                                            if (!stop.latitude || !stop.longitude) return null;
                                            const isSource = idx === 0;
                                            const isDest = idx === trackingData.timeline.length - 1;
                                            return (
                                                <Marker 
                                                    key={`station-${idx}`} 
                                                    position={[stop.latitude, stop.longitude]} 
                                                    icon={stationIcon}
                                                    opacity={stop.is_completed ? 0.5 : 1}
                                                >
                                                    <Popup className="dark-popup">
                                                        <div className="p-1">
                                                            <strong className="text-[#263238] text-sm font-bold font-heading">{stop.station_name} ({stop.station_code})</strong>
                                                            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] m-0 p-0">Day {stop.day_count} • Stop #{stop.stop_sequence}</p>
                                                        </div>
                                                    </Popup>
                                                </Marker>
                                            );
                                        })}

                                        {/* Current Position Marker (The Train) */}
                                        {trackingData.live_status.current_lat && trackingData.live_status.current_lng && (
                                            <Marker 
                                                position={[trackingData.live_status.current_lat, trackingData.live_status.current_lng]} 
                                                icon={trainIcon}
                                                zIndexOffset={1000}
                                            >
                                                <Popup>
                                                    <strong>Current Location</strong><br/>
                                                    {trackingData.live_status.last_status_message}
                                                </Popup>
                                            </Marker>
                                        )}
                                    </MapContainer>
                                </div>

                                {/* ROUTE TIMELINE */}
                                <div className=" border border-[#E3DED2] dark:border-[#2A403A] bg-[#0f172a]/40 p-5 rounded-xl h-[500px] overflow-y-auto custom-scrollbar">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-5 sticky top-0 bg-[#FFFFFF] dark:bg-[#1B2C28] py-2 z-10">
                                        <Route className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" /> Route Timeline
                                    </h3>

                                    <div className="relative pl-8 border-l-2 border-[#E3DED2] dark:border-[#2A403A] space-y-2 mt-2">
                                        {/* Animated progress line */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${progressPercent}%` }}
                                            transition={{ duration: 1.5, ease: 'easeOut' }}
                                            className="absolute left-[-2px] top-0 w-0.5 bg-[#173F3A] dark:bg-[#EEF2ED]"
                                        />

                                        {trackingData.timeline.map((stop, i) => {
                                            const hasPassed = stop.is_completed;
                                            const isCurrentlyHere = stop.is_current || trackingData.live_status.current_station_code === stop.station_code;
                                            const isSource = i === 0;
                                            const isDest = i === trackingData.timeline.length - 1;

                                            return (
                                                <div key={i} className="relative group">
                                                    {/* Node */}
                                                    <div className={`absolute left-[-41px] top-3 transition-all ${
                                                        isCurrentlyHere 
                                                            ? 'w-7 h-7 rounded-full bg-[#173F3A] dark:bg-[#EEF2ED] border-[3px] border-[#FFFFFF] dark:border-[#1B2C28] scale-110 z-10 shadow-lg shadow-[0_4px_16px_rgba(23,63,58,0.06)] flex items-center justify-center' 
                                                            : hasPassed 
                                                                ? 'w-5 h-5 rounded-full bg-[#D96C4F] border-2 border-[#FFFFFF] dark:border-[#1B2C28] flex items-center justify-center' 
                                                                : 'w-5 h-5 rounded-full bg-[#EEF2ED] dark:bg-[#213530] border-2 border-[#E3DED2] dark:border-[#2A403A] flex items-center justify-center'
                                                    }`}>
                                                        {isCurrentlyHere && <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
                                                        {hasPassed && !isCurrentlyHere && <CheckCircle2 className="w-3 h-3 text-[#263238] dark:text-[#F7F5EF]" />}
                                                    </div>

                                                    {/* Station Card */}
                                                    <div className={`p-3 rounded-lg border transition-all ml-1 ${
                                                        isCurrentlyHere 
                                                            ? 'bg-[#173F3A] dark:bg-[#EEF2ED]/10 border-[#173F3A] dark:border-[#EEF2ED] shadow-lg shadow-[0_4px_16px_rgba(23,63,58,0.06)]' 
                                                            : hasPassed 
                                                                ? 'bg-[#FFFFFF] dark:bg-[#1B2C28] border-transparent opacity-60' 
                                                                : 'bg-[#F7F5EF] dark:bg-[#12201D] border-white/[0.03] hover:bg-[#EEF2ED] dark:hover:bg-[#213530]'
                                                    }`}>
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[10px] font-bold text-[#66736F] dark:text-[#A3B0AB] bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] px-2 py-0.5 rounded font-mono shrink-0">
                                                                    {stop.station_code}
                                                                </span>
                                                                <div>
                                                                    <h4 className={`text-sm font-bold ${isCurrentlyHere ? 'text-[#173F3A] dark:text-[#EEF2ED]' : 'text-[#263238] dark:text-[#F7F5EF]'}`}>
                                                                        {stop.station_name}
                                                                        {isSource && <span className="ml-2 text-[9px] text-emerald-400 font-mono">(SOURCE)</span>}
                                                                        {isDest && <span className="ml-2 text-[9px] text-rose-400 font-mono">(DEST)</span>}
                                                                        {isCurrentlyHere && <span className="ml-2 text-[9px] text-[#173F3A] dark:text-[#EEF2ED] font-mono ">● HERE</span>}
                                                                    </h4>
                                                                </div>
                                                            </div>
                                                            <div className="text-left sm:text-right flex sm:flex-col gap-3 sm:gap-0.5">
                                                                <div className="text-[11px]">
                                                                    {stop.estimated_arrival ? (
                                                                        <div>
                                                                            <span className="text-[#66736F] dark:text-[#A3B0AB]">Arr: </span>
                                                                            <span className="font-bold">{formatTime12h(stop.estimated_arrival)}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[#66736F] dark:text-[#A3B0AB]">Origin</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] mt-0.5">
                                                                    {stop.estimated_departure ? (
                                                                        <div>
                                                                            <span className="text-[#66736F] dark:text-[#A3B0AB]">Dep: </span>
                                                                            <span className="font-bold">{formatTime12h(stop.estimated_departure)}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[#66736F] dark:text-[#A3B0AB]">Terminus</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            
            {/* Custom Styles for Map popups and scrollbars */}
            <style dangerouslySetInnerHTML={{__html: `
                .leaflet-popup-content-wrapper { background: var(--color-surface); color: var(--color-text); border-radius: 8px; border: 1px solid var(--color-border); box-shadow: 0 4px 16px rgba(23,63,58,0.06); }
                .leaflet-popup-tip { background: var(--color-surface); border: 1px solid var(--color-border); }
                .leaflet-container { font-family: inherit; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}} />
        </div>
    );
}
