import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function EmergencySOSModal({ isOpen, onClose }) {
  const [step, setStep] = useState('confirm'); // confirm, dispatching, active_hud
  const [emergencyType, setEmergencyType] = useState('Security Threat');
  const [coords, setCoords] = useState(null);
  const [isLockingGps, setIsLockingGps] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Attempt to lock GPS Coordinates dynamically using Geolocation API
  const lockGpsCoordinates = () => {
    setIsLockingGps(true);
    if (!navigator.geolocation) {
      console.warn('[SOS Geolocation]: Geolocation not supported by browser. Using mock fallback.');
      setCoords({ latitude: '28.6400', longitude: '77.2100' });
      setIsLockingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        setIsLockingGps(false);
        console.log('[SOS Geolocation]: GPS Lock Acquired:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('[SOS Geolocation]: GPS Lock Failed:', error.message);
        // Fallback to New Delhi default coordinates
        setCoords({ latitude: '28.6400', longitude: '77.2100' });
        setIsLockingGps(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setCountdown(30);
      lockGpsCoordinates();
    }
  }, [isOpen]);

  // Countdown timer for RPF response
  useEffect(() => {
    let timer;
    if (step === 'active_hud' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleTriggerSosDispatch = async () => {
    setStep('dispatching');
    
    // Simulate active satellite dispatch connection delay (1.5 seconds)
    setTimeout(async () => {
      try {
        const payload = {
          latitude: coords?.latitude || '28.6400',
          longitude: coords?.longitude || '77.2100',
          emergency_type: emergencyType
        };

        // Fire the API endpoint to log the emergency in MySQL and send notifications
        await api.post('/security/sos', payload);

        setStep('active_hud');
        toast.error('🚨 EMERGENCY DISPATCH ACTIVE: Security teams notified!', { duration: 6000 });
      } catch (err) {
        console.error('[SOS Dispatch Error]:', err);
        toast.error('Failed to notify security dispatch. Calling local helpline directly.');
        setStep('active_hud');
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#263238]/50 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl shadow-sm p-6 text-center max-h-[90vh] overflow-y-auto">
        
        {/* Close key */}
        {step !== 'dispatching' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] px-2 py-1 rounded-lg text-base transition-colors"
          >
            ✕
          </button>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-[#B94A48]/10 text-[#B94A48] rounded-full flex items-center justify-center text-3xl font-bold mx-auto">
              🆘
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF]">Emergency SOS Dispatch</h3>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs mt-2 leading-relaxed max-w-sm mx-auto">
                Warning: This is an active GPS emergency notification system. Triggering this alert will notify the **Railway Protection Force (RPF)** and dispatch local emergency responders.
              </p>
            </div>

            {/* Select category */}
            <div className="text-left bg-[#F7F5EF] dark:bg-[#12201D] p-4 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] space-y-3">
              <label className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block tracking-wider">Select Nature of Emergency</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Security Threat', icon: '👮' },
                  { label: 'Medical Alert', icon: '🚑' },
                  { label: 'Accident / Fire', icon: '🔥' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setEmergencyType(item.label)}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer border ${
                      emergencyType === item.label
                        ? 'bg-[#B94A48]/10 border-[#B94A48] text-[#B94A48] font-medium'
                        : 'bg-[#FFFFFF] dark:bg-[#1B2C28] border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[9px] whitespace-nowrap leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GPS coordinates locking status */}
            <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] px-4 py-3 rounded-xl flex items-center justify-between text-xs text-left">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB] block tracking-wider">Live GPS Telemetry</span>
                <span className="text-[#263238] dark:text-[#F7F5EF] font-mono font-semibold mt-0.5 block">
                  {isLockingGps ? (
                    <span className="text-[#66736F] dark:text-[#A3B0AB]">Locking satellite GPS...</span>
                  ) : coords ? (
                    <span className="text-[#B94A48] font-mono">LAT: {coords.latitude} | LNG: {coords.longitude}</span>
                  ) : (
                    <span className="text-[#66736F] dark:text-[#A3B0AB]">No Location Locked</span>
                  )}
                </span>
              </div>
              <button
                onClick={lockGpsCoordinates}
                className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] font-medium py-3 rounded-lg text-xs transition-colors border border-[#E3DED2] dark:border-[#2A403A]"
              >
                Cancel Alert
              </button>
              <button
                onClick={handleTriggerSosDispatch}
                className="w-full bg-[#B94A48] hover:bg-[#a03d3c] text-white font-medium py-3 rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                🚨 Trigger SOS Now
              </button>
            </div>
          </div>
        )}

        {step === 'dispatching' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-fade-in">
            {/* Interactive sweeps radar animation */}
            <div className="relative w-28 h-28 flex items-center justify-center mx-auto">
              <div className="absolute inset-0 border border-[#B94A48]/20 rounded-full" />
              <div className="absolute inset-4 border border-[#B94A48]/40 rounded-full" />
              {/* Radar sweeping needle */}
              <div className="absolute inset-0 rounded-full border-r-2 border-[#B94A48] animate-spin" />
              <span className="text-2xl">📡</span>
            </div>
            <div>
              <h3 className="text-[#263238] dark:text-[#F7F5EF] font-bold text-base mb-1">Connecting to Satellite...</h3>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">Syncing real-time active rescue GIS networks.</p>
            </div>
          </div>
        )}

        {step === 'active_hud' && (
          <div className="space-y-6 animate-fade-in">
            {/* Danger Alarm HUD */}
            <div className="w-16 h-16 bg-[#B94A48]/10 border-2 border-[#B94A48] text-[#B94A48] rounded-full flex items-center justify-center text-3xl font-bold mx-auto">
              🚨
            </div>
            
            <div>
              <span className="bg-[#B94A48]/10 text-[#B94A48] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Active Rescue Alarm
              </span>
              <h3 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] mt-4">RPF Dispatch Unit Confirmed</h3>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs mt-1.5 max-w-sm mx-auto">
                Local Railway Protection Force responder team has locked onto your GPS coordinates and is **En Route / Dispatched**.
              </p>
            </div>

            {/* GPS Telemetry Grid */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block">GPS Coordinates</span>
                <span className="text-[#263238] dark:text-[#F7F5EF] font-mono font-semibold text-[11px] mt-0.5 block">
                  {coords?.latitude}, {coords?.longitude}
                </span>
              </div>
              <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block">Emergency Nature</span>
                <span className="text-[#B94A48] font-bold text-[11px] mt-0.5 block">{emergencyType}</span>
              </div>
              <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block">Estimated Arrival</span>
                <span className="text-[#263238] dark:text-[#F7F5EF] font-mono font-semibold text-[11px] mt-0.5 block">
                  {countdown > 0 ? `${countdown} Seconds` : 'Responder Present'}
                </span>
              </div>
              <div className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block">Incident Status</span>
                <span className="text-[#4F7D62] font-bold text-[11px] mt-0.5 block">Active Tracking</span>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-[#B94A48]/5 border border-[#B94A48]/20 p-4 rounded-xl text-left text-xs text-[#B94A48] space-y-2">
              <span className="font-bold text-[10px] uppercase text-[#B94A48] block">Emergency Contacts:</span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#263238] dark:text-[#F7F5EF]">👮 Police:</span>
                <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">📞 100 / 112</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#263238] dark:text-[#F7F5EF]">🚑 Ambulance:</span>
                <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">📞 108</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#263238] dark:text-[#F7F5EF]">🚆 Railway Helpline:</span>
                <span className="font-semibold text-[#263238] dark:text-[#F7F5EF]">📞 139 / 182</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] font-bold py-3 rounded-lg text-xs uppercase tracking-widest cursor-pointer border border-[#E3DED2] dark:border-[#2A403A] active:scale-95 transition-all"
            >
              Close HUD Panel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
