import React from 'react';
import { motion } from 'framer-motion';

export default function ChartCard({
    title,
    subtitle,
    children,
    actions,
    className = '',
    headerClassName = ''
}) {
    return (
        <div className={`travel-card p-5 md:p-6 rounded-2xl flex flex-col justify-between ${className}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 ${headerClassName}`}>
                <div>
                    <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>

            <div className="flex-1 w-full min-h-[260px]">
                {children}
            </div>
        </div>
    );
}
