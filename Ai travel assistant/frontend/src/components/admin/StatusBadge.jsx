import React from 'react';

export default function StatusBadge({ status, size = 'sm' }) {
    if (!status) return null;

    const normalized = String(status).toLowerCase();

    let style = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

    if (['active', 'operational', 'confirmed', 'success', 'paid', 'resolved', 'indexed', 'true', 'open'].includes(normalized)) {
        if (normalized === 'open') {
            style = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        } else {
            style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        }
    } else if (['investigating', 'pending', 'processing', 'in progress', 'medium', 'warning', 'delayed'].includes(normalized)) {
        style = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    } else if (['deactivated', 'deleted', 'cancelled', 'failed', 'critical', 'high', 'error', 'down', 'rejected'].includes(normalized)) {
        style = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    } else if (['super_admin', 'admin'].includes(normalized)) {
        style = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    } else if (['data_manager'].includes(normalized)) {
        style = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    } else if (['support_admin'].includes(normalized)) {
        style = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }

    const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

    return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClass} ${style}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            <span className="capitalize">{status}</span>
        </span>
    );
}
