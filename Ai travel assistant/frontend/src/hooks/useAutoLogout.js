import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'traveliq_last_active_time';
const TIMEOUT_CONFIG_KEY = 'traveliq_session_timeout_mins';
const DEFAULT_TIMEOUT_MINS = 15;
const WARNING_THRESHOLD_SECONDS = 60; // Show warning 60 seconds before logout
const THROTTLE_MS = 1000; // Throttle event listeners

export const useAutoLogout = (customTimeoutMinutes = null) => {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_THRESHOLD_SECONDS);
  
  // Timeout in minutes: prop override -> localStorage -> default 15 mins
  const getTimeoutMinutes = useCallback(() => {
    if (customTimeoutMinutes && typeof customTimeoutMinutes === 'number') {
      return customTimeoutMinutes;
    }
    const saved = localStorage.getItem(TIMEOUT_CONFIG_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_TIMEOUT_MINS;
  }, [customTimeoutMinutes]);

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const logoutTriggeredRef = useRef(false);

  // Extend or reset the session activity timestamp
  const extendSession = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    logoutTriggeredRef.current = false;
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch (e) {
      // ignore storage access errors in private mode
    }
    setShowWarning(false);
    setSecondsRemaining(WARNING_THRESHOLD_SECONDS);
  }, []);

  // Update activity timestamp with throttle
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current > THROTTLE_MS) {
      lastThrottleRef.current = now;
      lastActivityRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
      } catch (e) {
        // ignore
      }
      // If warning modal is open and user acts, dismiss it and refresh
      setShowWarning((prev) => {
        if (prev) {
          setSecondsRemaining(WARNING_THRESHOLD_SECONDS);
          return false;
        }
        return false;
      });
    }
  }, []);

  // Synchronize across tabs when localStorage is updated in another tab
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime)) {
          lastActivityRef.current = remoteTime;
          setShowWarning(false);
          setSecondsRemaining(WARNING_THRESHOLD_SECONDS);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Listen to user interaction events when authenticated
  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    // Initialize timestamp on login
    extendSession();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];
    const eventOptions = { passive: true };

    events.forEach((event) => {
      window.addEventListener(event, recordActivity, eventOptions);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, recordActivity, eventOptions);
      });
    };
  }, [user, recordActivity, extendSession]);

  // Main inactivity timer interval check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeoutMs = getTimeoutMinutes() * 60 * 1000;
      
      // Check latest time from localStorage in case another tab updated it
      let latestActivity = lastActivityRef.current;
      const storedTime = localStorage.getItem(STORAGE_KEY);
      if (storedTime) {
        const parsed = parseInt(storedTime, 10);
        if (!isNaN(parsed) && parsed > latestActivity) {
          latestActivity = parsed;
          lastActivityRef.current = parsed;
        }
      }

      const elapsed = now - latestActivity;
      const remainingMs = timeoutMs - elapsed;
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingSecs <= 0) {
        if (!logoutTriggeredRef.current) {
          logoutTriggeredRef.current = true;
          setShowWarning(false);
          toast('You have been logged out due to inactivity.', {
            icon: '⏱️',
            duration: 5000,
            style: {
              background: '#1B2C28',
              color: '#F7F5EF',
              border: '1px solid #D96C4F',
            }
          });
          logout();
        }
      } else if (remainingSecs <= WARNING_THRESHOLD_SECONDS) {
        setShowWarning(true);
        setSecondsRemaining(remainingSecs);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, logout, getTimeoutMinutes]);

  return {
    showWarning,
    secondsRemaining,
    extendSession,
    timeoutMinutes: getTimeoutMinutes(),
  };
};

export default useAutoLogout;
