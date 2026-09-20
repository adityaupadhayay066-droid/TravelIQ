import React from 'react';

export function TableSkeleton({ rows = 5, cols = 6 }) {
    return (
        <div className="w-full space-y-3 p-4">
            <div className="h-10 bg-[var(--color-soft)]/60 rounded-xl animate-pulse" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                    {Array.from({ length: cols }).map((_, j) => (
                        <div
                            key={j}
                            className="h-9 bg-[var(--color-soft)]/40 rounded-lg animate-pulse flex-1"
                            style={{ animationDelay: `${(i * 0.1 + j * 0.05).toFixed(2)}s` }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="travel-card p-6 rounded-2xl animate-pulse space-y-4">
            <div className="h-4 bg-[var(--color-soft)] rounded w-1/3" />
            <div className="h-8 bg-[var(--color-soft)] rounded w-1/2" />
            <div className="h-4 bg-[var(--color-soft)] rounded w-2/3" />
        </div>
    );
}

export default function LoadingSkeleton({ type = 'table', ...props }) {
    if (type === 'card') return <CardSkeleton {...props} />;
    return <TableSkeleton {...props} />;
}
