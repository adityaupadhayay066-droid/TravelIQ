import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAutoLogout } from '../hooks/useAutoLogout';

export default function SessionTimeoutModal() {
  const { user, logout } = useAuth();
  const { showWarning, secondsRemaining, extendSession } = useAutoLogout();

  if (!user || !showWarning) return null;

  const totalWarningSeconds = 60;
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalWarningSeconds) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl p-6 shadow-2xl overflow-hidden text-[#263238] dark:text-[#F7F5EF]"
          role="alertdialog"
          aria-labelledby="timeout-title"
          aria-describedby="timeout-desc"
        >
          {/* Subtle top indicator line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E3DED2] dark:bg-[#2A403A]">
            <div
              className="h-full bg-[#D96C4F] transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            {/* Pulsing Icon */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#D96C4F]/10 dark:bg-[#D96C4F]/20 flex items-center justify-center text-[#D96C4F] ring-8 ring-[#D96C4F]/5">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-[#D96C4F] text-white rounded-full">
                <ShieldAlert className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h2 id="timeout-title" className="text-xl font-bold font-heading text-[#173F3A] dark:text-[#EEF2ED]">
                Session Expiring Soon
              </h2>
              <p id="timeout-desc" className="text-xs sm:text-sm text-[#66736F] dark:text-[#A3B0AB] max-w-xs">
                You have been inactive for a while. For your security, you will be automatically logged out in:
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="py-2 px-6 rounded-xl bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] flex items-center gap-2">
              <span className="text-3xl font-extrabold font-mono text-[#D96C4F] tracking-tight">
                {secondsRemaining}
              </span>
              <span className="text-xs uppercase tracking-wider text-[#66736F] dark:text-[#A3B0AB] font-semibold">
                seconds
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
              <button
                type="button"
                onClick={extendSession}
                className="flex-1 py-3 px-4 rounded-xl bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#173F3A] font-semibold text-sm hover:bg-[#0F332F] dark:hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Stay Logged In
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="py-3 px-4 rounded-xl bg-transparent hover:bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/30 font-medium text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log Out Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
