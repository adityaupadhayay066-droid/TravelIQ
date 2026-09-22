import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bell, CheckCheck, Trash2, ShieldAlert, AlertCircle, 
    Upload, Sparkles, RefreshCw, Filter, Check, CheckCircle 
} from 'lucide-react';
import StatusBadge from '../../components/admin/StatusBadge';
import EmptyState from '../../components/admin/EmptyState';
import adminApi from '../../utils/adminApi';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterSeverity, setFilterSeverity] = useState('all');
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getNotifications();
            if (res.data?.success) {
                setNotifications(res.data.notifications || []);
            }
        } catch {
            setNotifications([
                { id: 1, type: 'critical_report', title: 'Critical Issue Reported on AI Routing', message: 'User reported high-pass winter road recommended in Leh-Manali region. Review prompt safety constraints.', severity: 'critical', read: false, action_url: '/admin/reports', created_at: new Date() },
                { id: 2, type: 'data_import', title: 'Indian Railways Master Schedule Synced', message: '1,420 express trains and 640 station coordinates successfully verified.', severity: 'success', read: true, action_url: '/admin/trains', created_at: new Date(Date.now() - 60 * 60000) },
                { id: 3, type: 'security_alert', title: 'Multiple Failed Admin Login Attempts', message: '5 failed login attempts detected from IP 192.168.1.104 targeting admin@traveliq.com.', severity: 'warning', read: false, action_url: '/admin/logs', created_at: new Date(Date.now() - 120 * 60000) }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await adminApi.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            toast.success('Marked as read.');
        } catch {
            toast.error('Failed to update notification.');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await adminApi.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All notifications marked as read.');
        } catch {
            toast.error('Failed to mark all as read.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminApi.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification removed.');
        } catch {
            toast.error('Failed to delete notification.');
        }
    };

    const filtered = notifications.filter(n => {
        if (filterSeverity === 'all') return true;
        return n.severity === filterSeverity;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        Admin Notifications & Alerts
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        System telemetry alerts, dataset import logs, security warnings, and urgent user reports.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleMarkAllRead}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark All Read</span>
                    </button>
                    <button
                        onClick={fetchNotifications}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Severity Filters */}
            <div className="flex items-center gap-2">
                {['all', 'critical', 'warning', 'success', 'info'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterSeverity(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                            filterSeverity === s
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-soft)]'
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={Bell}
                        title="No notifications"
                        description="You're all caught up! No notifications matching this filter."
                    />
                ) : (
                    filtered.map((n) => (
                        <div
                            key={n.id}
                            className={`travel-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 ${
                                !n.read ? 'bg-sky-500/5 border-sky-500/30' : ''
                            }`}
                        >
                            <div className="flex items-start gap-3.5 min-w-0">
                                <div className="p-2.5 rounded-xl bg-[var(--color-soft)] shrink-0 mt-0.5">
                                    {n.severity === 'critical' ? (
                                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                                    ) : n.severity === 'warning' ? (
                                        <AlertCircle className="w-5 h-5 text-amber-400" />
                                    ) : n.severity === 'success' ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                    ) : (
                                        <Bell className="w-5 h-5 text-sky-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-[var(--color-text)] truncate">
                                            {n.title}
                                        </h4>
                                        <StatusBadge status={n.severity || 'info'} size="xs" />
                                        {!n.read && (
                                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                                        {n.message}
                                    </p>
                                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono mt-2 inline-block">
                                        {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                {n.action_url && (
                                    <button
                                        onClick={() => navigate(n.action_url)}
                                        className="btn-secondary !h-8 !px-3 text-xs"
                                    >
                                        Inspect →
                                    </button>
                                )}
                                {!n.read && (
                                    <button
                                        onClick={() => handleMarkRead(n.id)}
                                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                                        title="Mark as read"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(n.id)}
                                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
                                    title="Delete notification"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
