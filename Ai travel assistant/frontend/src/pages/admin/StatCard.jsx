import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

export default function StatCard({
    title,
    value,
    subtitle,
    change,
    isPositive = true,
    icon: Icon,
    iconColor = 'text-sky-500',
    iconBg = 'bg-sky-500/10 border-sky-500/20',
    gradient = 'from-sky-500/5 to-transparent',
    onClick
}) {
    return (
        <motion.div
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            onClick={onClick}
            className={`travel-card relative overflow-hidden p-5 rounded-2xl border transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-sky-500/40' : ''}`}
        >
            {/* Ambient subtle glow background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none opacity-60`} />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {title}
                    </span>
                    <div className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight text-[var(--color-text)] font-heading">
                        {value}
                    </div>
                </div>

                {Icon && (
                    <div className={`p-3 rounded-xl border ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>

            {(subtitle || change) && (
                <div className="relative z-10 mt-4 flex items-center gap-2 pt-2 border-t border-[var(--color-border)]/60 text-xs">
                    {change && (
                        <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${
                            isPositive
                                ? 'text-emerald-500 bg-emerald-500/10'
                                : 'text-rose-500 bg-rose-500/10'
                        }`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            {change}
                        </span>
                    )}
                    {subtitle && (
                        <span className="text-[var(--color-text-muted)] truncate">
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </motion.div>
    );
}
