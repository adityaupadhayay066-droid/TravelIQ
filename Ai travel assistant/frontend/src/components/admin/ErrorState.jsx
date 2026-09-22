import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
    title = 'Unable to load data',
    message = 'An unexpected network error occurred while communicating with the server.',
    onRetry
}) {
    return (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5 my-4">
            <div className="p-3.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-3.5">
                <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)]">
                {title}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] max-w-md mt-1 mb-5">
                {message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn-secondary text-sm inline-flex items-center gap-2 !h-9 !px-4 hover:border-rose-500/40"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                </button>
            )}
        </div>
    );
}
