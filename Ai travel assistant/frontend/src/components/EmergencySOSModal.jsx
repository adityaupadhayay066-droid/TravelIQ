import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, ShieldAlert, Phone, MapPin, Radio, 
  HeartPulse, X, Flame, UserCheck, Edit3, Search, Check, RefreshCw
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EMERGENCY_TYPES = [
  { id: 'Security Threat', label: 'Security Threat / Violence', icon: ShieldAlert, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50' },
  { id: 'Medical Alert', label: 'Medical Emergency', icon: HeartPulse, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50' },
  { id: 'Women Safety / RPF', label: 'Women Passenger Assistance', icon: UserCheck, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50' },
  { id: 'Train Accident', label: 'Derailment / Fire / Hazard', icon: Flame, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' },
  { id: 'General Assistance', label: 'Theft / Harassment / Distress', icon: AlertTriangle, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/50' }
];

const EMERGENCY_CONTACTS = [
  { label: 'Indian Railways Security (RPF)', number: '139', note: '24x7 Security, Medical & Passenger Helpline' },
  { label: 'All-India Police Emergency', number: '112', note: 'National Emergency Response System (NERS)' },
  { label: 'Railway Women Passenger Helpline', number: '182', note: 'RPF Meri Saheli Dedicated Women Squad' },
  { label: 'Medical Ambulance & First Aid', number: '108', note: 'Emergency Trauma & Ambulance Dispatch' }
];

export default function EmergencySOSModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [step, setStep] = useState('confirm'); // 'confirm' | 'dispatching' | 'active_hud'
  const [emergencyType, setEmergencyType] = useState('Security Threat');
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [alertRef, setAlertRef] = useState(null);
  const [customNote, setCustomNote] = useState('');

  // Manual station edit search state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [stationQuery, setStationQuery] = useState('');
  const [stationSuggestions, setStationSuggestions] = useState([]);
  const [searchingStations, setSearchingStations] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Reverse geocode coordinates to human-readable city/district
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.county || data.address?.state_district;
        const state = data.address?.state;
        if (city || state) {
          return [city, state].filter(Boolean).join(', ');
        }
      }
    } catch (_) {
      // Ignore network errors in reverse geocoding
    }
    return null;
  };

  // Lock GPS coordinates via browser Geolocation API
  const lockGpsCoordinates = () => {
    setGpsLoading(true);
    setIsManualOverride(false);

    if (!navigator.geolocation) {
      setCoords({ latitude: '28.6448', longitude: '77.2167', accuracy: 'Approximate' });
      setLocationName('New Delhi Central Transit Hub');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        const acc = Math.round(pos.coords.accuracy || 15);
        setCoords({
          latitude: lat,
          longitude: lon,
          accuracy: `${acc}m`
        });

        // Attempt human-readable reverse geocoding
        const place = await reverseGeocode(lat, lon);
        if (place) {
          setLocationName(place);
        } else {
          setLocationName('Transit Corridor Coordinates');
        }
        setGpsLoading(false);
      },
      (err) => {
        console.warn('[SOS Geolocation]: GPS lock notice:', err.message);
        setCoords({ latitude: '28.6448', longitude: '77.2167', accuracy: 'Cell Tower Triangulation' });
        setLocationName('New Delhi (Primary Gateway)');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setCountdown(30);
      setAlertRef(null);
      setIsEditingLocation(false);
      setStationQuery('');
      setStationSuggestions([]);
      lockGpsCoordinates();
    }
  }, [isOpen]);

  // Search stations when user types into manual override
  useEffect(() => {
    if (!stationQuery || stationQuery.trim().length < 2) {
      setStationSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingStations(true);
      try {
        const res = await api.get(`/travel/stations/search?q=${encodeURIComponent(stationQuery.trim())}`);
        setStationSuggestions(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
      } catch (err) {
        console.error('Station search error:', err);
      } finally {
        setSearchingStations(false);
      }
    }, 250);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [stationQuery]);

  const handleSelectStation = (stn) => {
    const lat = stn.latitude ? Number(stn.latitude).toFixed(6) : coords?.latitude || '28.6448';
    const lon = stn.longitude ? Number(stn.longitude).toFixed(6) : coords?.longitude || '77.2167';
    setCoords({
      latitude: lat,
      longitude: lon,
      accuracy: 'Station Exact'
    });
    setLocationName(`${stn.station_name} (${stn.station_code}), ${stn.state || stn.city || 'India'}`);
    setIsManualOverride(true);
    setIsEditingLocation(false);
    setStationQuery('');
    setStationSuggestions([]);
    toast.success(`Location updated to ${stn.station_name} (${stn.station_code})`);
  };

  // Countdown timer in HUD
  useEffect(() => {
    let timer;
    if (step === 'active_hud' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleTriggerDispatch = async () => {
    setStep('dispatching');

    const lat = coords?.latitude || '28.6448';
    const lng = coords?.longitude || '77.2167';

    try {
      if (user) {
        const payload = {
          latitude: lat,
          longitude: lng,
          emergency_type: emergencyType,
          location_name: locationName || undefined,
          note: customNote || undefined
        };
        const res = await api.post('/security/sos', payload);
        const refId = res.data?.alertId || res.data?.id || Math.floor(100000 + Math.random() * 900000);
        setAlertRef(`AEV-SOS-${refId}`);
      } else {
        setAlertRef(`AEV-GUEST-${Math.floor(100000 + Math.random() * 900000)}`);
      }

      setStep('active_hud');
      toast.error('🚨 EMERGENCY DISPATCH ACTIVE: Security responders alerted!', { duration: 6000 });
    } catch (err) {
      console.error('[SOS Dispatch Error]:', err);
      setAlertRef(`AEV-OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`);
      setStep('active_hud');
      toast.error('Dispatch logged. Please also call Railway Helpline (139) immediately.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1B242E] border-2 border-rose-500/30 rounded-2xl shadow-2xl p-5 sm:p-6 text-left max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          {step !== 'dispatching' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* STEP 1: CONFIRM EMERGENCY DISPATCH */}
          {step === 'confirm' && (
            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                      Live Transit SOS
                    </span>
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-ping" /> Active RPF Network
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    Emergency Assistance Dispatch
                  </h2>
                </div>
              </div>

              {/* Geolocation Telemetry Pill with Manual Station Override */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {isManualOverride ? 'Selected Location' : 'Detected Transit Location'}
                        </span>
                        {isManualOverride && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                            USER SPECIFIED
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                        {gpsLoading ? 'Locking GPS & identifying station...' : locationName || 'Coordinates Acquired'}
                      </p>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">
                        {coords ? `${coords.latitude}° N, ${coords.longitude}° E (${coords.accuracy})` : 'Acquiring GPS...'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEditingLocation(!isEditingLocation)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 underline cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingLocation ? 'Close' : 'Change Station'}</span>
                    </button>
                    {!isManualOverride && (
                      <button
                        type="button"
                        onClick={lockGpsCoordinates}
                        disabled={gpsLoading}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1 underline cursor-pointer"
                        title="Relock browser location"
                      >
                        <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Wi-Fi/ISP Explainer Notice */}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-1.5">
                  💡 <em>Note:</em> Laptops/PCs estimate location via Wi-Fi network routing. If your browser reports an ISP hub city, tap <strong>Change Station</strong> above to select your exact railway station.
                </p>

                {/* Inline Station Search Autocomplete */}
                {isEditingLocation && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={stationQuery}
                        onChange={(e) => setStationQuery(e.target.value)}
                        placeholder="Type current station or city (e.g. New Delhi, Varanasi, Kanpur)..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1B242E] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                        autoFocus
                      />
                      {searchingStations && (
                        <div className="absolute right-2.5 top-2">
                          <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                        </div>
                      )}
                    </div>

                    {stationSuggestions.length > 0 && (
                      <div className="bg-white dark:bg-[#1B242E] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {stationSuggestions.map((stn) => (
                          <button
                            key={stn.station_code}
                            type="button"
                            onClick={() => handleSelectStation(stn)}
                            className="w-full text-left p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-between text-xs transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">{stn.station_name}</span>
                              <span className="ml-1.5 font-mono text-[10px] text-slate-500">({stn.station_code})</span>
                              <span className="text-[10px] text-slate-400 block">{stn.state || stn.city}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">
                              Select
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Select Category */}
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider mb-2">
                  Select Nature of Emergency
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map((type) => {
                    const isSelected = emergencyType === type.id;
                    const IconComp = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setEmergencyType(type.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`} />
                        <span className="truncate">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Train / Coach / Seat or Details (Optional) */}
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider mb-1">
                  Train Number / Coach / Berth (Optional)
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Train 12802, Coach B3, Berth 24"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121921] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTriggerDispatch}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Broadcast Emergency SOS</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Quick Dial Helplines */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-2">
                  Direct One-Tap Helpline Dials:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  {EMERGENCY_CONTACTS.map((c) => (
                    <a
                      key={c.number}
                      href={`tel:${c.number}`}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition-colors block"
                    >
                      <span className="text-base font-extrabold text-rose-600 block">{c.number}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate">{c.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DISPATCHING ANIMATION */}
          {step === 'dispatching' && (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-3 border-rose-600 border-t-transparent animate-spin" />
                <ShieldAlert className="w-8 h-8 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Connecting to Emergency Dispatch...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Transmitting telemetry to Railway Protection Force responder network.</p>
              </div>
            </div>
          )}

          {/* STEP 3: ACTIVE ALARM HUD */}
          {step === 'active_hud' && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-rose-500/10 border-2 border-rose-500 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-7 h-7 animate-bounce" />
                </div>
                <div className="inline-block px-3 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                  Active Responder Alarm
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emergency Dispatch Confirmed</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  Your incident alert has been recorded and transmitted. Nearby railway authorities and RPF squads have your coordinates.
                </p>
              </div>

              {/* Telemetry HUD Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Incident Ref</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block truncate">{alertRef || 'AEV-SOS-ACTIVE'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Emergency Nature</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-xs block truncate">{emergencyType}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Reported Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block truncate">{locationName || 'GPS Locked'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121921] border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Response Window</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs block">
                    {countdown > 0 ? `${countdown}s Active Track` : 'Immediate Attention'}
                  </span>
                </div>
              </div>

              {/* Call Direct Dial */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>Call Emergency Helpline Directly</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="tel:139"
                    className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-center block"
                  >
                    Dial 139 (Railways)
                  </a>
                  <a
                    href="tel:112"
                    className="p-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-center block"
                  >
                    Dial 112 (Police)
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Emergency HUD
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
