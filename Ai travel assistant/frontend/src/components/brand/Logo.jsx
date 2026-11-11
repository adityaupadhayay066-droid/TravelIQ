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
      className="relative flex-shrink-0 flex items-center justify-center rounded-lg bg-[#244C66] text-white shadow-xs transition-opacity duration-200 group-hover:opacity-90"
    >
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
      </svg>
    </div>
  );

  // Render text wordmark
  const renderWordmark = () => (
    <div className="flex flex-col leading-none">
      <div className="flex items-center gap-1.5">
        <span
          className={`font-bold tracking-tight ${fontSize} text-[#244C66] dark:text-[#F0F4F7]`}
        >
          {BRAND.name}
        </span>
      </div>
      {withTagline && (
        <span className="text-[9.5px] font-medium text-[#89939B] tracking-wider uppercase leading-none mt-0.5 hidden xs:inline">
          {BRAND.tagline}
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

