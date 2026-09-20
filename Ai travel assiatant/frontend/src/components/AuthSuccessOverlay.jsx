import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthSuccessOverlay({ mode, userName, onComplete }) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  // Framer Motion Variants for smooth subtle entries
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay: 0.1
      }
    },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } },
  };

  const checkmarkPathVariants = {
    hidden: { pathLength: 0 },
    visible: { 
      pathLength: 1, 
      transition: { 
        duration: 0.6, 
        ease: 'easeInOut', 
        delay: 0.2 
      } 
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#263238]/40 px-4"
      >
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative z-10 w-full max-w-md bg-[#FFFFFF] dark:bg-[#1B2C28] p-10 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm text-center flex flex-col items-center space-y-6 overflow-hidden"
        >
          {/* Success Checkmark */}
          <div className="relative flex items-center justify-center w-20 h-20">
            <svg 
              className="w-16 h-16 text-[#4F7D62]" 
              viewBox="0 0 52 52" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.circle 
                cx="26" 
                cy="26" 
                r="24" 
                stroke="currentColor" 
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
              <motion.path 
                d="M16 26l7 7 13-13" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                variants={checkmarkPathVariants}
              />
            </svg>
          </div>

          {/* Welcome Message Headers */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] tracking-tight font-sans">
              {mode === 'login' ? 'Welcome Back' : 'Account Created'}
            </h3>
            {userName && (
              <p className="text-lg font-semibold text-[#173F3A] dark:text-[#EEF2ED]">
                Ready for your next journey, {userName}?
              </p>
            )}
            <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm font-medium">
              {mode === 'login' ? 'Login Successful' : 'Your profile has been secured successfully.'}
            </p>
          </div>

          {/* Separator */}
          <div className="w-full h-px bg-[#E3DED2] dark:bg-[#2A403A]" />

          {/* Countdown & Redirect Status */}
          <div className="space-y-3 w-full">
            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider font-semibold">
              Continuing to Home
            </p>
            
            {/* Animated scale/fade numbers for countdown */}
            <div className="h-10 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={countdown}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF]"
                >
                  {countdown}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Custom linear progress bar */}
            <div className="w-full bg-[#EEF2ED] dark:bg-[#213530] h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
                className="h-full bg-[#173F3A] dark:bg-[#EEF2ED] rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
