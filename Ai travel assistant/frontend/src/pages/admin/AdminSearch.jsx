import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Train, MapPin, Flag, Shield, ArrowRight, X } from 'lucide-react';
import adminApi from '../../utils/adminApi';

export default function AdminSearch({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([
                { type: 'Quick Link', title: 'User Management', subtitle: 'View registered accounts', url: '/admin/users', icon: User },
                { type: 'Quick Link', title: 'Live Train Tracker & Schedules', subtitle: 'Manage train inventory', url: '/admin/trains', icon: Train },
                { type: 'Quick Link', title: 'Destinations & Curation', subtitle: 'Manage tourism guides', url: '/admin/destinations', icon: MapPin },
                { type: 'Quick Link', title: 'AI Assistant & Prompt Activity', subtitle: 'Inspect LLM latency & logs', url: '/admin/ai', icon: Shield },
                { type: 'Quick Link', title: 'System Reports & Bugs', subtitle: 'Resolve customer issues', url: '/admin/reports', icon: Flag }
            ]);
            return;
        }

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                const searchLower = query.toLowerCase();
                const matched = [];

                // Static matching of key sections
                const sections = [
                    { title: 'Users & Permissions', url: '/admin/users', type: 'Section', icon: User },
                    { title: 'Train Inventory & Live Status', url: '/admin/trains', type: 'Section', icon: Train },
                    { title: 'Destinations Catalog', url: '/admin/destinations', type: 'Section', icon: MapPin },
                    { title: 'Travel Data & CSV Importer', url: '/admin/travel-data', type: 'Section', icon: Shield },
                    { title: 'System Health & Telemetry', url: '/admin/system-health', type: 'Section', icon: Shield },
                    { title: 'Audit Logs & Admin Actions', url: '/admin/logs', type: 'Section', icon: Shield },
                    { title: 'Reports & Issue Tickets', url: '/admin/reports', type: 'Section', icon: Flag },
                    { title: 'Search & Activity Telemetry', url: '/admin/searches', type: 'Section', icon: Search }
                ];

                sections.forEach(s => {
                    if (s.title.toLowerCase().includes(searchLower)) {
                        matched.push(s);
                    }
                });

                // Fetch dynamic matching users
                const resUsers = await adminApi.getUsers({ search: query, limit: 3 }).catch(() => null);
                if (resUsers?.data?.users) {
                    resUsers.data.users.forEach(u => {
                        matched.push({
                            type: 'User',
                            title: u.name,
                            subtitle: `${u.email} • ${u.role}`,
                            url: `/admin/users?id=${u.id}`,
                            icon: User
                        });
                    });
                }

                // Fetch dynamic matching trains
                const resTrains = await adminApi.getTrains({ search: query, limit: 3 }).catch(() => null);
                if (resTrains?.data?.trains) {
                    resTrains.data.trains.forEach(t => {
                        matched.push({
                            type: 'Train',
                            title: `${t.train_number} - ${t.train_name}`,
                            subtitle: `${t.source_station} → ${t.destination_station}`,
                            url: `/admin/trains?search=${t.train_number}`,
                            icon: Train
                        });
                    });
                }

                setResults(matched);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(handler);
    }, [query]);

    const handleSelect = (url) => {
        navigate(url);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
                    >
                        {/* Search Input Bar */}
                        <div className="flex items-center px-4 border-b border-[var(--color-border)]">
                            <Search className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 mr-3" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search users, trains, destinations, reports, logs..."
                                className="w-full h-14 bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
                            />
                            {query && (
                                <button onClick={() => setQuery('')} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mr-2">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-[var(--color-soft)] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded">
                                ESC
                            </kbd>
                        </div>

                        {/* Search Results */}
                        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-[var(--color-border)]/40 scrollbar-none">
                            {loading ? (
                                <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                                    Searching across platform...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                                    No results matching "{query}"
                                </div>
                            ) : (
                                results.map((item, idx) => {
                                    const Icon = item.icon || Search;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleSelect(item.url)}
                                            className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-soft)] cursor-pointer transition group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 rounded-lg bg-[var(--color-soft)] text-[var(--color-text-muted)] group-hover:text-sky-400 group-hover:bg-sky-500/10 border border-[var(--color-border)] transition">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-[var(--color-text)] truncate">
                                                        {item.title}
                                                    </div>
                                                    {item.subtitle && (
                                                        <div className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
                                                            {item.subtitle}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--color-soft)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                                    {item.type}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
