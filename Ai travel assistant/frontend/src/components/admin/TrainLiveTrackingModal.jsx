import React, { useState, useEffect } from 'react';
import { 
    Train, MapPin, Clock, Calendar, CheckCircle2, AlertTriangle, 
    ArrowRight, RefreshCw, Radio, Navigation, X, 
    CalendarDays, Activity, Search, ShieldCheck, Compass, Sparkles
} from 'lucide-react';
import adminApi from '../../utils/adminApi';
import StatusBadge from './StatusBadge';
import toast from 'react-hot-toast';

export default function TrainLiveTrackingModal({
    isOpen,
    onClose,
    trainNumber,
    initialDate = null
}) {
    const [loading, setLoading] = useState(false);
    const [trainData, setTrainData] = useState(null);
    const [stationFilter, setStationFilter] = useState('');
    
    // Journey Date state (defaults to today in YYYY-MM-DD)
    const [journeyDate, setJourneyDate] = useState(() => {
        if (initialDate) return initialDate;
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    const getDayName = (dateStr) => {
        try {
            const d = new Date(`${dateStr}T12:00:00Z`);
            return d.toLocaleDateString('en-US', { weekday: 'long' });
        } catch {
            return '';
        }
    };

    const fetchTracking = async (dateVal = journeyDate, silent = false) => {
        if (!trainNumber) return;
        if (!silent) setLoading(true);
        try {
            const selectedDay = getDayName(dateVal);
            const res = await adminApi.getTrainDetails(trainNumber, {
                journeyDate: dateVal,
                selectedDay
            });
            if (res.data?.success && res.data.train) {
                setTrainData(res.data.train);
            } else {
                toast.error('Failed to load train details.');
            }
        } catch (err) {
            console.error('fetchTracking error:', err);
            toast.error(err.response?.data?.message || 'Error loading train route and status.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && trainNumber) {
            fetchTracking(journeyDate);
        } else {
            setTrainData(null);
            setStationFilter('');
        }
    }, [isOpen, trainNumber, journeyDate]);

    if (!isOpen) return null;

    // Quick date shortcuts
    const todayStr = new Date().toISOString().split('T')[0];
    const yestDate = new Date(); yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toISOString().split('T')[0];
    const tomDate = new Date(); tomDate.setDate(tomDate.getDate() + 1);
    const tomStr = tomDate.toISOString().split('T')[0];

    const quickDates = [
        { label: 'Yesterday', val: yestStr },
        { label: 'Today', val: todayStr },
        { label: 'Tomorrow', val: tomStr }
    ];

    // Filter timeline stations if user searches within the route
    const timeline = trainData?.timeline || [];
    const filteredTimeline = stationFilter.trim()
        ? timeline.filter(s => 
            s.station_name.toLowerCase().includes(stationFilter.toLowerCase()) ||
            s.station_code.toLowerCase().includes(stationFilter.toLowerCase())
        )
        : timeline;

    const completedStops = timeline.filter(s => s.is_completed).length;
    const progressPercent = timeline.length > 0 
        ? Math.round((completedStops / Math.max(1, timeline.length)) * 100) 
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* 1. Modal Top Header */}
                <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            <Train className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                    #{trainData?.train_number || trainNumber}
                                </span>
                                <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)]">
                                    {trainData?.train_name || 'Loading train...'}
                                </h2>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {trainData?.service_type || 'Superfast Express'}
                                </span>
                            </div>
                            
                            {/* Origin -> Destination Subtitle */}
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-1 font-medium">
                                <span className="text-emerald-400 font-bold">{trainData?.source_station || 'Origin'}</span>
                                {trainData?.source_station_name && (
                                    <span className="text-[var(--color-text-muted)] hidden sm:inline">({trainData.source_station_name})</span>
                                )}
                                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                <span className="text-amber-400 font-bold">{trainData?.destination_station || 'Destination'}</span>
                                {trainData?.destination_station_name && (
                                    <span className="text-[var(--color-text-muted)] hidden sm:inline">({trainData.destination_station_name})</span>
                                )}
                                <span className="text-[var(--color-border)]">•</span>
                                <span>{trainData?.total_stops || timeline.length} Stations</span>
                                <span className="text-[var(--color-border)]">•</span>
                                <span>~{trainData?.total_distance_km || '1,384'} km</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchTracking(journeyDate, false)}
                            disabled={loading}
                            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] transition border border-transparent hover:border-[var(--color-border)]"
                            title="Refresh Live Telemetry"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] transition border border-transparent hover:border-[var(--color-border)]"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 2. Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    
                    {/* A. Weekly Running Days Bar (Where Is My Train style) */}
                    <div className="p-4 rounded-xl bg-[var(--color-soft)]/50 border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <CalendarDays className="w-4 h-4 text-sky-400" />
                            <span className="text-xs font-semibold text-[var(--color-text)]">
                                Weekly Schedule:
                            </span>
                            <span className="text-xs font-bold text-sky-400">
                                {trainData?.frequency || 'Daily'} ({trainData?.running_days || 'Daily'})
                            </span>
                        </div>

                        {/* 7 Day Pills: S M T W T F S */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {(trainData?.weekly_running_days || [
                                { code: 'MON', label: 'M', operates: true, name: 'Mon' },
                                { code: 'TUE', label: 'T', operates: true, name: 'Tue' },
                                { code: 'WED', label: 'W', operates: true, name: 'Wed' },
                                { code: 'THU', label: 'T', operates: true, name: 'Thu' },
                                { code: 'FRI', label: 'F', operates: true, name: 'Fri' },
                                { code: 'SAT', label: 'S', operates: true, name: 'Sat' },
                                { code: 'SUN', label: 'S', operates: true, name: 'Sun' }
                            ]).map((d, i) => (
                                <div
                                    key={i}
                                    title={`${d.name || d.code}: ${d.operates ? 'Operates' : 'Does not operate'}`}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all shadow-2xs select-none ${
                                        d.operates
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                                            : 'bg-[var(--color-surface)]/60 text-[var(--color-text-muted)] opacity-35 border border-[var(--color-border)]/50 line-through'
                                    }`}
                                >
                                    <span>{d.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* B. Date Selector & Operation Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)]">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--color-text-muted)]">Journey Date:</span>
                            <div className="flex items-center gap-1 bg-[var(--color-soft)] p-0.5 rounded-lg border border-[var(--color-border)]">
                                {quickDates.map((q) => (
                                    <button
                                        key={q.val}
                                        onClick={() => setJourneyDate(q.val)}
                                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                                            journeyDate === q.val
                                                ? 'bg-sky-500 text-white shadow-xs font-bold'
                                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                        }`}
                                    >
                                        {q.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                            <input
                                type="date"
                                value={journeyDate}
                                onChange={(e) => setJourneyDate(e.target.value)}
                                className="px-2.5 py-1 rounded-lg text-xs bg-[var(--color-soft)] border border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-sky-500"
                            />
                            <span className="text-xs text-[var(--color-text-muted)] font-medium">
                                ({getDayName(journeyDate)})
                            </span>
                        </div>
                    </div>

                    {/* Warning if train does not operate on this selected date */}
                    {trainData && trainData.operates_on_date === false && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2.5">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>
                                <strong>Operating Notice:</strong> {trainData.operation_note || `This train does not run on ${getDayName(journeyDate)}. Showing general schedule & timetable.`}
                            </span>
                        </div>
                    )}

                    {/* C. Live Telemetry Hero Banner (Where Is My Train Signature Card) */}
                    <div className="relative overflow-hidden rounded-2xl p-5 border border-sky-500/30 bg-linear-to-br from-sky-950/30 via-[var(--color-surface)] to-emerald-950/20 shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            
                            {/* Live status badge & message */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[11px] font-mono tracking-wider font-bold uppercase text-emerald-400">
                                        LIVE GPS TELEMETRY
                                    </span>
                                    <StatusBadge status={trainData?.live_status?.status || 'Running'} size="xs" />
                                    {trainData?.live_status?.delay_minutes > 0 ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                            +{trainData.live_status.delay_minutes} MIN DELAY
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            RIGHT TIME
                                        </span>
                                    )}
                                </div>

                                <div className="text-sm sm:text-base font-extrabold text-[var(--color-text)] flex items-center gap-2">
                                    <Radio className="w-4 h-4 text-sky-400 shrink-0 animate-pulse" />
                                    <span>
                                        {trainData?.live_status?.last_status_message || 'Tracking live train movement along route...'}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)] pt-1">
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                        Current: <strong className="text-[var(--color-text)]">{trainData?.live_status?.current_station_name || trainData?.live_status?.current_station_code || 'En Route'}</strong>
                                    </span>
                                    {trainData?.live_status?.next_station_code && (
                                        <span className="inline-flex items-center gap-1">
                                            <Navigation className="w-3.5 h-3.5 text-sky-400" />
                                            Next Stop: <strong className="text-[var(--color-text)]">{trainData.live_status.next_station_name || trainData.live_status.next_station_code}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Journey Progress Meter */}
                            <div className="md:text-right shrink-0">
                                <div className="text-xs text-[var(--color-text-muted)] font-medium">Route Progress</div>
                                <div className="text-xl font-mono font-black text-sky-400">{progressPercent}%</div>
                                <div className="w-36 h-2 rounded-full bg-[var(--color-soft)] overflow-hidden mt-1 border border-[var(--color-border)]">
                                    <div 
                                        className="h-full bg-linear-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                                    {completedStops} / {timeline.length} stops crossed
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* D. Route Stations Header & Filter */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[var(--color-text)]">
                                Complete Railway Route & Timetable
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-soft)] text-[var(--color-text-muted)] font-mono">
                                {timeline.length} stops
                            </span>
                        </div>

                        {/* Station search in route */}
                        <div className="relative w-44 sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Filter stations in route..."
                                value={stationFilter}
                                onChange={(e) => setStationFilter(e.target.value)}
                                className="w-full h-8 pl-8 pr-2.5 rounded-lg text-xs bg-[var(--color-soft)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-sky-500"
                            />
                        </div>
                    </div>

                    {/* E. 'Where Is My Train' Vertical Rail Route Timeline */}
                    <div className="relative rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 overflow-hidden">
                        
                        {loading ? (
                            <div className="py-16 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                                <span>Loading live route telemetry...</span>
                            </div>
                        ) : filteredTimeline.length === 0 ? (
                            <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
                                No station found matching "{stationFilter}"
                            </div>
                        ) : (
                            <div className="relative space-y-0">
                                {filteredTimeline.map((stop, idx) => {
                                    const isFirst = idx === 0;
                                    const isLast = idx === filteredTimeline.length - 1;
                                    const isCurrent = stop.is_current;
                                    const isCompleted = stop.is_completed;
                                    const isNext = stop.is_next;

                                    return (
                                        <div
                                            key={stop.stop_sequence || idx}
                                            className={`relative flex items-center gap-3 sm:gap-4 py-3.5 px-2 rounded-xl transition ${
                                                isCurrent 
                                                    ? 'bg-sky-500/10 border border-sky-500/30 shadow-xs' 
                                                    : 'hover:bg-[var(--color-soft)]/40'
                                            }`}
                                        >
                                            {/* Column 1: Time Details */}
                                            <div className="w-24 sm:w-28 text-right shrink-0">
                                                <div className="text-xs font-mono font-bold text-[var(--color-text)]">
                                                    {stop.departure_time 
                                                        ? (stop.actual_dep || stop.sched_dep) 
                                                        : (stop.actual_arr || stop.sched_arr)}
                                                </div>
                                                <div className="text-[10px] text-[var(--color-text-muted)] font-mono flex items-center justify-end gap-1">
                                                    {stop.arrival_time && stop.departure_time ? (
                                                        <span>Arr: {stop.sched_arr}</span>
                                                    ) : (
                                                        <span>{isFirst ? 'Origin' : 'Terminus'}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column 2: Railway Track Node Graphics */}
                                            <div className="relative flex flex-col items-center shrink-0 self-stretch justify-center w-6">
                                                {/* Connecting track line above */}
                                                {!isFirst && (
                                                    <div className={`absolute top-0 w-1 -translate-y-1/2 h-1/2 ${
                                                        isCompleted ? 'bg-emerald-500' : 'bg-[var(--color-border)]'
                                                    }`} />
                                                )}

                                                {/* Node Center Marker */}
                                                <div className="relative z-10">
                                                    {isCurrent ? (
                                                        <div className="relative flex items-center justify-center">
                                                            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-60"></span>
                                                            <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                                                                <Train className="w-4 h-4 animate-bounce" />
                                                            </div>
                                                        </div>
                                                    ) : isCompleted ? (
                                                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </div>
                                                    ) : isNext ? (
                                                        <div className="w-5 h-5 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center">
                                                            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] hover:border-sky-400 transition" />
                                                    )}
                                                </div>

                                                {/* Connecting track line below */}
                                                {!isLast && (
                                                    <div className={`absolute bottom-0 w-1 translate-y-1/2 h-1/2 ${
                                                        isCompleted ? 'bg-emerald-500' : 'bg-[var(--color-border)]'
                                                    }`} />
                                                )}
                                            </div>

                                            {/* Column 3: Station Info, Platform, Halt & Distance */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-xs sm:text-sm text-[var(--color-text)]">
                                                        {stop.station_name}
                                                    </span>
                                                    <span className="font-mono text-[11px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                                                        {stop.station_code}
                                                    </span>

                                                    {/* Live Position Flag */}
                                                    {isCurrent && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow-xs animate-pulse">
                                                            TRAIN IS HERE
                                                        </span>
                                                    )}
                                                    {isNext && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                            UPCOMING NEXT
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-muted)] mt-1">
                                                    {/* Platform info */}
                                                    <span className="px-1.5 py-0.2 rounded bg-[var(--color-soft)] text-[10px] font-mono text-[var(--color-text)] border border-[var(--color-border)] font-semibold">
                                                        {stop.platform || 'PF #1'}
                                                    </span>

                                                    {/* Halt time */}
                                                    {stop.halt_minutes > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
                                                            <Clock className="w-3 h-3 text-amber-400" />
                                                            {stop.halt_minutes} min halt
                                                        </span>
                                                    ) : (
                                                        <span>{isFirst ? 'Source' : isLast ? 'Destination' : 'No halt'}</span>
                                                    )}

                                                    {/* Distance */}
                                                    <span>• {stop.distance_km} km</span>

                                                    {/* Day count */}
                                                    <span>• Day {stop.day_count || 1}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Footer */}
                <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
                    <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>TravelIQ Telemetry synced with IRCTC Railway Timetables</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="btn-secondary !h-9 !px-4 text-xs font-semibold"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}
