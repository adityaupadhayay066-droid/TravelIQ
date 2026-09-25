import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook: shrinks floating elements while the user is scrolling,
 * then smoothly restores them to full size once scrolling stops.
 *
 * @param {number} shrinkTo   – target scale while scrolling (default 0.65)
 * @param {number} restoreMs  – ms after last scroll event to restore (default 350)
 * @returns {number} scale    – current scale value (0.65 while scrolling, 1 when idle)
 */
export default function useScrollShrink(shrinkTo = 0.65, restoreMs = 350) {
  const [isScrolling, setIsScrolling] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleScrollActivity = () => {
      setIsScrolling(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, restoreMs);
    };

    // Capture true is crucial to intercept scroll events from any nested scroll containers
    window.addEventListener('scroll', handleScrollActivity, { capture: true, passive: true });
    document.addEventListener('scroll', handleScrollActivity, { capture: true, passive: true });
    window.addEventListener('wheel', handleScrollActivity, { passive: true });
    window.addEventListener('touchmove', handleScrollActivity, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollActivity, { capture: true });
      document.removeEventListener('scroll', handleScrollActivity, { capture: true });
      window.removeEventListener('wheel', handleScrollActivity);
      window.removeEventListener('touchmove', handleScrollActivity);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [restoreMs]);

  return isScrolling ? shrinkTo : 1;
}

