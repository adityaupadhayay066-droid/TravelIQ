import React from 'react';
import { 
    UserPlus, Search, Train, MapPin, Sparkles, AlertCircle, 
    Upload, LogIn, Key, CheckCircle, ShieldAlert, FileText 
} from 'lucide-react';

export default function ActivityTimeline({ items = [] }) {
    if (!items || items.length === 0) {
        return (
            <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                No recent activity recorded.
            </p>
        );
    }

    const getIcon = (action = '', type = '') => {
        const act = (action + ' ' + type).toLowerCase();
        if (act.includes('user') || act.includes('register') || act.includes('signup')) return <UserPlus className="w-4 h-4 text-emerald-400" />;
        if (act.includes('search') || act.includes('query')) return <Search className="w-4 h-4 text-sky-400" />;
        if (act.includes('train')) return <Train className="w-4 h-4 text-blue-400" />;
        if (act.includes('destination') || act.includes('city')) return <MapPin className="w-4 h-4 text-amber-400" />;
        if (act.includes('ai') || act.includes('model')) return <Sparkles className="w-4 h-4 text-purple-400" />;
        if (act.includes('report') || act.includes('alert') || act.includes('security')) return <ShieldAlert className="w-4 h-4 text-rose-400" />;
        if (act.includes('import') || act.includes('upload') || act.includes('dataset')) return <Upload className="w-4 h-4 text-cyan-400" />;
        if (act.includes('login') || act.includes('auth')) return <LogIn className="w-4 h-4 text-teal-400" />;
        return <FileText className="w-4 h-4 text-slate-400" />;
    };

    return (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border)]">
            {items.map((item, idx) => (
                <div key={item.id || idx} className="relative flex items-start gap-3 group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] group-hover:border-sky-500 flex items-center justify-center transition-colors shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    </div>

                    <div className="flex-1 bg-[var(--color-soft)]/40 hover:bg-[var(--color-soft)]/70 p-3.5 rounded-xl border border-[var(--color-border)] transition">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)]">
                                    {getIcon(item.action, item.type)}
                                </div>
                                <span className="text-xs font-bold text-[var(--color-text)]">
                                    {item.title || item.action || 'Activity Event'}
                                </span>
                            </div>
                            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                                {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (item.time || 'Just now')}
                            </span>
                        </div>

                        {item.description || item.details ? (
                            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                                {item.description || item.details}
                            </p>
                        ) : null}

                        {item.user && (
                            <div className="mt-2 pt-2 border-t border-[var(--color-border)]/50 flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                                <span className="font-semibold text-[var(--color-text)]">{item.user.name || item.user.email}</span>
                                <span>•</span>
                                <span className="capitalize">{item.user.role || 'User'}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
