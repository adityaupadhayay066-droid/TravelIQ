import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, X, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function SOSModal({ isOpen, onClose }) {
  const [status, setStatus] = useState('idle'); // idle, loading, success
  const [alertData, setAlertData] = useState(null);

  const handleSendSOS = async () => {
    setStatus('loading');
    try {
      // Retrieve location if possible, otherwise use fallback
      let locString = 'Unknown Location';
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        locString = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
      } catch (err) {
        console.warn('Geolocation failed or denied');
      }

      const { data } = await api.post('/sos/trigger', { location: locString });
      setAlertData(data);
      setStatus('success');
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'Failed to send SOS. Please try again or call local authorities.';
      toast.error(msg);
      setStatus('idle');
      if (error.response?.status === 429) {
        onClose();
      }
    }
  };

  const resetAndClose = () => {
    setStatus('idle');
    setAlertData(null);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl w-full max-w-md overflow-hidden relative shadow-sm"
        >
          {status === 'idle' && (
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-full bg-[#B94A48]/10 flex items-center justify-center border border-[#B94A48]/20">
                  <AlertTriangle className="w-8 h-8 text-[#B94A48]" />
                </div>
                <button onClick={resetAndClose} className="text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2">Emergency SOS</h2>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mb-6">
                Are you sure you want to send an emergency alert? This will immediately notify the administrative team and send an alert to your registered email with your current location.
              </p>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSendSOS}
                  className="w-full bg-[#B94A48] hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Send SOS
                </button>
                <button 
                  onClick={resetAndClose}
                  className="w-full bg-transparent hover:bg-[#F7F5EF] dark:hover:bg-[#213530] text-[#263238] dark:text-[#F7F5EF] font-semibold py-3 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-12 h-12 text-[#B94A48] animate-spin mb-4" />
              <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2">Broadcasting Alert...</h2>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Transmitting location and device telemetry</p>
            </div>
          )}

          {status === 'success' && (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-[#4F7D62]/10 flex items-center justify-center border border-[#4F7D62]/20 mb-6"
              >
                <ShieldCheck className="w-10 h-10 text-[#4F7D62]" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2">Emergency Alert Sent</h2>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mb-6">
                Your SOS has been successfully broadcasted. Please stay safe.
              </p>

              <div className="bg-[#F7F5EF] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-4 w-full mb-6 text-left">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#66736F] dark:text-[#A3B0AB]">Status</span>
                  <span className="text-[#4F7D62] font-bold uppercase">Dispatched</span>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#66736F] dark:text-[#A3B0AB]">Time Sent</span>
                  <span className="text-[#263238] dark:text-[#F7F5EF]">{new Date(alertData?.timestamp || Date.now()).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#66736F] dark:text-[#A3B0AB]">Reference ID</span>
                  <span className="text-[#263238] dark:text-[#F7F5EF] font-mono">SOS-{alertData?.alertId || 'UNKNOWN'}</span>
                </div>
              </div>

              <button 
                onClick={resetAndClose}
                className="w-full bg-transparent hover:bg-[#F7F5EF] dark:hover:bg-[#213530] text-[#263238] dark:text-[#F7F5EF] font-semibold py-3 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
