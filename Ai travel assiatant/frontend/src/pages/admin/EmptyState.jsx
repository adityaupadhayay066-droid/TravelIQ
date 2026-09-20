import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
    icon: Icon = Inbox,
    title = 'No records found',
    description = 'There are no items matching your criteria at this time.',
    action
}) {
    return (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-soft)]/20">
            <div className="p-4 rounded-full bg-[var(--color-soft)] text-[var(--color-text-muted)] border border-[var(--color-border)] mb-4 shadow-inner">
                <Icon className="w-8 h-8 opacity-70" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)]">
                {title}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-sm mt-1 mb-5">
                {description}
            </p>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
}
