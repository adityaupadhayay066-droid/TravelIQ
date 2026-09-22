import { useState, useEffect } from 'react';

export default function useMouseTilt(ref, options = {}) {
  const { maxRotation = 8, perspective = 1000, scale = 1.01 } = options;
  const [style, setStyle] = useState({});

  useEffect(() => {
    const element = ref?.current;
    if (!element || window.innerWidth < 768) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Mouse position relative to center
      const x = e.clientX - rect.left - width / 2;
      const y = e.clientY - rect.top - height / 2;
      
      // Normalize values between -1 and 1
      const normalizedX = x / (width / 2);
      const normalizedY = y / (height / 2);
      
      const rotateX = -normalizedY * maxRotation;
      const rotateY = normalizedX * maxRotation;
      
      setStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
        transition: 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)',
      });
    };

    const handleMouseLeave = () => {
      setStyle({
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
        transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, maxRotation, perspective, scale]);

  return style;
}
