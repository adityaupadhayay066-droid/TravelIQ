import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/branding';

/**
 * AEVORA Official Logo Component
 * Renders high-fidelity vector branding across all screen densities.
 */
export const Logo = ({
  variant = 'full',      // 'full' | 'icon' | 'wordmark' | 'badge'
  theme = 'auto',        // 'auto' | 'dark' | 'light'
  size = 'md',           // 'sm' | 'md' | 'lg' | 'xl'
  withTagline = false,
  to = '/',
  className = '',
  link = true,
}) => {
  // Height presets
  const sizeMap = {
    sm: { height: 26, iconSize: 24, fontSize: 'text-base' },
    md: { height: 34, iconSize: 32, fontSize: 'text-xl' },
    lg: { height: 44, iconSize: 40, fontSize: 'text-2xl' },
    xl: { height: 54, iconSize: 48, fontSize: 'text-3xl' },
  };

  const { iconSize, fontSize } = sizeMap[size] || sizeMap.md;

  // Render pure SVG Monogram
  const renderIcon = () => (
    <div
      style={{ width: iconSize, height: iconSize }}
      className="relative flex-shrink-0 flex items-center justify-center rounded-xl bg-[#0B132B] p-1.5 shadow-sm border border-slate-700/50 group-hover:border-sky-500/50 transition-all duration-200"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="aevora-comp-grad" x1="8" y1="56" x2="56" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
        <path d="M32 10 L14 52 L22.5 52 L32 28 L41.5 52 L50 52 L32 10 Z" fill="url(#aevora-comp-grad)" />
        <path d="M21 39 L47 31 L41 36 L25 41 Z" fill="#FFFFFF" opacity="0.95" />
        <polygon points="32,23 35.5,28 32,33 28.5,28" fill="#FFFFFF" />
        <circle cx="47" cy="31" r="2.5" fill="#38BDF8" />
      </svg>
    </div>
  );

  // Render text wordmark
  const renderWordmark = () => (
    <div className="flex flex-col leading-none">
      <div className="flex items-center gap-1.5">
        <span
          className={`font-['Sora'] font-extrabold tracking-[0.14em] uppercase ${fontSize} ${
            theme === 'light'
              ? 'text-slate-900'
              : theme === 'dark'
              ? 'text-white'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {BRAND.name}
        </span>
      </div>
      {withTagline && (
        <span className="text-[9px] font-medium tracking-[0.22em] uppercase text-slate-400 dark:text-slate-400 mt-0.5">
          Travel Intelligence
        </span>
      )}
    </div>
  );

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {(variant === 'full' || variant === 'icon' || variant === 'badge') && renderIcon()}
      {(variant === 'full' || variant === 'wordmark') && renderWordmark()}
      {variant === 'badge' && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/30">
          PRO
        </span>
      )}
    </div>
  );

  if (link && to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;

