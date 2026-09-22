import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Bell, Moon, Sun, Menu, 
    CheckCheck, AlertCircle, ShieldAlert, Sparkles, Database, ExternalLink, Compass 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import UserAvatar from './UserAvatar';
import adminApi from '../../utils/adminApi';

export default function AdminNavbar({
    onOpenSearch,
    onOpenMobileSidebar
}) {
    const { user } = useAuth();
    const { theme, effectiveTheme, setTheme } = useTheme();
    const navigate = useNavigate();

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [healthStatus, setHealthStatus] = useState('operational');
    const notifRef = useRef(null);

    // Fetch quick notifications & health
    useEffect(() => {
        const fetchTelemetry = async () => {
            try {
                const [notifRes, healthRes] = await Promise.all([
                    adminApi.getNotifications({ limit: 5 }).catch(() => null),
                    adminApi.getSystemHealth().catch(() => null)
                ]);

                if (notifRes?.data) {
                    setNotifications(notifRes.data.notifications || []);
                    setUnreadCount(notifRes.data.unreadCount || 0);
                }

                if (healthRes?.data?.services) {
                    const services = Object.values(healthRes.data.services);
                    if (services.some(s => s.status === 'down' || s.status === 'error')) {
                        setHealthStatus('down');
                    } else if (services.some(s => s.status === 'warning' || s.status === 'degraded')) {
                        setHealthStatus('warning');
                    } else {
                        setHealthStatus('operational');
                    }
                }
            } catch (err) {
                // Silently maintain fallback
            }
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close notifications on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global keyboard listener for Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                onOpenSearch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenSearch]);

    const handleMarkAllRead = async () => {
        try {
            await adminApi.markAllNotificationsAsRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <header className="sticky top-0 z-20 h-16 bg-[var(--color-surface)]/95 backdrop-blur-md border-b border-[var(--color-border)] px-4 lg:px-6 flex items-center justify-between gap-4 shadow-xs">
            {/* Left: Mobile hamburger & Search Shortcut */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
                <button
                    onClick={onOpenMobileSidebar}
                    className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 text-xs font-bold transition shadow-xs"
                    aria-label="Open sidebar"
                >
                    <Menu className="w-4 h-4" />
                    <span>Modules</span>
                </button>

                {/* Command search bar trigger */}
                <button
                    onClick={onOpenSearch}
                    className="flex-1 flex items-center justify-between h-10 px-3.5 rounded-xl bg-[var(--color-soft)]/60 hover:bg-[var(--color-soft)] border border-[var(--color-border)] text-xs text-[var(--color-text)] hover:border-sky-500/40 transition shadow-inner"
                >
                    <div className="flex items-center gap-2.5">
                        <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <span className="hidden sm:inline text-[var(--color-text-muted)]">Search users, trains, reports...</span>
                        <span className="sm:hidden text-[var(--color-text-muted)]">Search...</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-[var(--color-text-muted)]">
                            Ctrl K
                        </kbd>
                    </div>
                </button>
            </div>

            {/* Right: Telemetry Pulse, Notifications, Theme, User */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* System Health Pulse Pill */}
                <button
                    onClick={() => navigate('/admin/system-health')}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/40 hover:bg-[var(--color-soft)] text-xs transition"
                    title="Platform Health Status"
                >
                    <span className="relative flex h-2 w-2">
                        {healthStatus === 'operational' ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </>
                        ) : healthStatus === 'warning' ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </>
                        ) : (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                            </>
                        )}
                    </span>
                    <span className="font-semibold text-[var(--color-text)] capitalize">
                        {healthStatus}
                    </span>
                </button>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] border border-[var(--color-border)] transition"
                        aria-label="Notifications"
                    >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-[var(--color-text)]">Notifications</h4>
                                    {unreadCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 text-[11px] font-bold">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        <span>Mark all read</span>
                                    </button>
                                )}
                            </div>

                            <div className="max-h-72 overflow-y-auto divide-y divide-[var(--color-border)]/50 scrollbar-none">
                                {notifications.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                                        No recent notifications.
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                if (n.action_url) navigate(n.action_url);
                                                setNotificationsOpen(false);
                                            }}
                                            className={`p-3.5 hover:bg-[var(--color-soft)] cursor-pointer transition flex items-start gap-3 ${!n.read ? 'bg-sky-500/5' : ''}`}
                                        >
                                            <div className="p-2 rounded-lg bg-[var(--color-soft)] text-sky-400 shrink-0">
                                                {n.type === 'critical_report' ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <AlertCircle className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-[var(--color-text)] truncate">
                                                    {n.title}
                                                </div>
                                                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-soft)]/30 text-center">
                                <button
                                    onClick={() => {
                                        navigate('/admin/notifications');
                                        setNotificationsOpen(false);
                                    }}
                                    className="text-xs font-bold text-sky-400 hover:text-sky-300"
                                >
                                    View All Notifications →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)] border border-[var(--color-border)] transition"
                    title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} mode`}
                    aria-label="Toggle theme"
                >
                    {effectiveTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                </button>

                {/* User Portal Link */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/40 hover:bg-[var(--color-soft)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
                    title="Switch to User Travel Assistant Dashboard"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>App View</span>
                </button>
            </div>
        </header>
    );
}
