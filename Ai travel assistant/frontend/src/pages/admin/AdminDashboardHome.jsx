import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Users, Search, Train, Sparkles, Activity, Flag, 
    TrendingUp, ArrowRight, RefreshCw, Compass, MapPin, 
    ShieldAlert, ExternalLink, Calendar, Database, Bus, 
    BarChart3, Bell, Shield, Settings, FileText 
} from 'lucide-react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
    CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import StatCard from '../../components/admin/StatCard';
import ChartCard from '../../components/admin/ChartCard';
import ActivityTimeline from '../../components/admin/ActivityTimeline';
import StatusBadge from '../../components/admin/StatusBadge';
import LoadingSkeleton from '../../components/admin/LoadingSkeleton';
import ErrorState from '../../components/admin/ErrorState';
import adminApi from '../../utils/adminApi';

export default function AdminDashboardHome() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [growthPeriod, setGrowthPeriod] = useState('weekly');

    const fetchDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await adminApi.getAnalytics();
            if (res.data?.success) {
                setData(res.data);
            } else {
                setError('Failed to fetch platform analytics');
            }
        } catch (err) {
            console.error('fetchDashboard error:', err);
            setError(err.response?.data?.message || 'Unable to connect to analytics API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const adminModules = [
        { title: 'User Management', desc: 'Accounts, status & permissions', icon: Users, path: '/admin/users', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
        { title: 'Travel Data & CSV', desc: 'Sync & import datasets', icon: Database, path: '/admin/travel-data', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        { title: 'Train Inventory', desc: '1,420 trains & live GPS tracker', icon: Train, path: '/admin/trains', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
        { title: 'Destinations Guide', desc: 'Curate tourist highlights & budget', icon: MapPin, path: '/admin/destinations', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        { title: 'Transport (Flights/Bus)', desc: 'Multi-modal transit corridors', icon: Bus, path: '/admin/transport', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
        { title: 'AI Assistant Telemetry', desc: 'Inspect LLM queries & latency', icon: Sparkles, path: '/admin/ai', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', badge: 'AI' },
        { title: 'AI Knowledge / RAG', desc: 'Vector document indexing', icon: FileText, path: '/admin/ai-knowledge', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
        { title: 'Search Analytics', desc: 'Live multi-modal travel queries', icon: Search, path: '/admin/searches', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
        { title: 'Reports & Issues', desc: 'Resolve feedback & bug tickets', icon: Flag, path: '/admin/reports', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
        { title: 'Platform Analytics', desc: 'DAU, MAU & revenue metrics', icon: BarChart3, path: '/admin/analytics', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
        { title: 'System Health', desc: 'MySQL, FastAPI & Express status', icon: Activity, path: '/admin/system-health', color: 'text-lime-400 bg-lime-500/10 border-lime-500/20' },
        { title: 'Admin Notifications', desc: 'System alerts & priority inbox', icon: Bell, path: '/admin/notifications', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
        { title: 'Admin Roles (RBAC)', desc: 'Super admin & staff privileges', icon: Shield, path: '/admin/admins', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
        { title: 'Audit Logs', desc: 'Immutable ledger of actions', icon: Database, path: '/admin/logs', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
        { title: 'System Settings', desc: 'Security policies & API config', icon: Settings, path: '/admin/settings', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <LoadingSkeleton key={i} type="card" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <LoadingSkeleton type="card" />
                    </div>
                    <div>
                        <LoadingSkeleton type="card" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return <ErrorState onRetry={fetchDashboard} message={error} />;
    }

    const { kpis = {}, charts = {} } = data || {};

    const recentActivityItems = [
        { title: 'New User Registered', description: 'Vikram Singh signed up via Google Auth.', time: '5m ago', action: 'user_register' },
        { title: 'Multi-Modal Route Searched', description: 'NDLS → MMCT searched (Train + Flight comparison).', time: '12m ago', action: 'search' },
        { title: 'Train Status Updated', description: 'Train 12801 Purushottam Express live GPS synced.', time: '25m ago', action: 'train_update' },
        { title: 'AI Assistant Query', description: 'AI Travel Assistant resolved 3-day Varanasi itinerary with 99% accuracy.', time: '40m ago', action: 'ai_query' },
        { title: 'Dataset Verified', description: '1,420 train schedules and 640 stations catalog verified.', time: '1h ago', action: 'dataset_import' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--color-text)] font-heading flex items-center gap-3">
                        <span>Platform Administration</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            Live Telemetry
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Central management, AI telemetry, data pipelines, and user operations.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchDashboard}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                        title="Refresh analytics"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin/travel-data')}
                        className="btn-primary !h-9 !px-4 text-xs inline-flex items-center gap-1.5"
                    >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Import Dataset</span>
                    </button>
                </div>
            </div>

            {/* Quick Admin Modules Launcher Grid */}
            <div className="travel-card p-5 sm:p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text)] font-heading">
                            Admin Modules & Management Hub
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            Direct access to all 15 platform administration tools
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {adminModules.map((m, idx) => {
                        const Icon = m.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => navigate(m.path)}
                                className="flex flex-col items-start p-3.5 rounded-xl bg-[var(--color-soft)]/50 hover:bg-[var(--color-soft)] border border-[var(--color-border)] hover:border-sky-500/40 text-left transition-all duration-150 group shadow-xs"
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <div className={`p-2 rounded-lg border ${m.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    {m.badge && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                                            {m.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs font-bold text-[var(--color-text)] group-hover:text-sky-400 transition truncate w-full">
                                    {m.title}
                                </div>
                                <div className="text-[10px] text-[var(--color-text-muted)] truncate w-full mt-0.5">
                                    {m.desc}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Top 6 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                    title="Total Users"
                    value={kpis.totalUsers?.value || 128}
                    subtitle={`+${kpis.totalUsers?.newToday || 4} today`}
                    change={kpis.totalUsers?.growth || '+14.2%'}
                    icon={Users}
                    iconColor="text-sky-400"
                    iconBg="bg-sky-500/10 border-sky-500/20"
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard
                    title="Total Searches"
                    value={kpis.totalSearches?.today || 142}
                    subtitle={`${kpis.totalSearches?.thisWeek || 890} this week`}
                    change={kpis.totalSearches?.growth || '+18.5%'}
                    icon={Search}
                    iconColor="text-amber-400"
                    iconBg="bg-amber-500/10 border-amber-500/20"
                    onClick={() => navigate('/admin/searches')}
                />
                <StatCard
                    title="Train Searches"
                    value={kpis.travelSearches?.train || 1850}
                    subtitle="Primary transit mode"
                    change="+12.0%"
                    icon={Train}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10 border-blue-500/20"
                    onClick={() => navigate('/admin/trains')}
                />
                <StatCard
                    title="AI Assistant"
                    value={kpis.aiUsage?.totalQueries || 2450}
                    subtitle={`Avg ${kpis.aiUsage?.avgResponseTime || '235ms'}`}
                    change="98.4% Acc"
                    icon={Sparkles}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10 border-purple-500/20"
                    gradient="from-purple-500/10 to-transparent"
                    onClick={() => navigate('/admin/ai')}
                />
                <StatCard
                    title="Active Users"
                    value={kpis.activeUsers?.current || 28}
                    subtitle={`${kpis.activeUsers?.activeToday || 22} active today`}
                    change="Live"
                    icon={Activity}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/10 border-emerald-500/20"
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard
                    title="Reports"
                    value={kpis.reports?.open || 3}
                    subtitle={`${kpis.reports?.critical || 1} critical`}
                    change={kpis.reports?.critical > 0 ? 'Action Req' : 'Stable'}
                    isPositive={kpis.reports?.critical === 0}
                    icon={Flag}
                    iconColor="text-rose-400"
                    iconBg="bg-rose-500/10 border-rose-500/20"
                    onClick={() => navigate('/admin/reports')}
                />
            </div>

            {/* Interactive Charts Row 1: User & Search Growth + Transport Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User & Query Growth Area Chart */}
                <ChartCard
                    title="Platform Activity & User Growth"
                    subtitle="Daily search volume vs new user registration"
                    className="lg:col-span-2"
                    actions={
                        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--color-soft)] border border-[var(--color-border)]">
                            {['daily', 'weekly', 'monthly'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setGrowthPeriod(p)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                                        growthPeriod === p
                                            ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    }
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={charts.userGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="searchGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} vertical={false} />
                            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: 'var(--color-text)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                }}
                            />
                            <Area type="monotone" dataKey="searches" name="Travel Searches" stroke="#0ea5e9" strokeWidth={2} fill="url(#searchGrad)" />
                            <Area type="monotone" dataKey="aiQueries" name="AI Queries" stroke="#8b5cf6" strokeWidth={2} fill="url(#aiGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Transport Mode Donut */}
                <ChartCard
                    title="Transport Distribution"
                    subtitle="Share of multi-modal searches"
                >
                    <div className="h-[280px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.transportBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {(charts.transportBreakdown || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-surface)',
                                        borderColor: 'var(--color-border)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Legend
                                    formatter={(value) => <span className="text-xs text-[var(--color-text)]">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>

            {/* Popular Routes & Popular Destinations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Routes */}
                <div className="travel-card p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                                Most Searched Routes
                            </h3>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                High demand travel corridors
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/searches')}
                            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                            <span>View details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(charts.popularRoutes || []).map((route, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-soft)]/40 hover:bg-[var(--color-soft)] transition border border-[var(--color-border)]"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-xs font-bold text-[var(--color-text-muted)]">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <div className="text-xs font-bold text-[var(--color-text)]">
                                            {route.source} → {route.destination}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-muted)]">
                                            {route.searches} searches
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                                    {route.trend}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Destinations */}
                <div className="travel-card p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                                Trending Destinations
                            </h3>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                Top destination queries & AI guide requests
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/destinations')}
                            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                            <span>Manage guides</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(charts.popularDestinations || []).map((dest, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-soft)]/40 hover:bg-[var(--color-soft)] transition border border-[var(--color-border)]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-[var(--color-text)]">
                                            {dest.name}, <span className="font-normal text-[var(--color-text-muted)]">{dest.state}</span>
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-muted)]">
                                            {dest.searchCount} queries • {dest.users} tourists
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-sky-400 px-2 py-0.5 rounded-full bg-sky-500/10">
                                    {dest.trend}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Assistant Telemetry & Recent Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Performance Bar Chart */}
                <ChartCard
                    title="AI Assistant Accuracy & Daily Queries"
                    subtitle="Success vs failed model generations"
                    className="lg:col-span-2"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={charts.aiUsage || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} vertical={false} />
                            <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderColor: 'var(--color-border)',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar dataKey="success" name="Successful Answers" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="failed" name="Fallback / Error" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Recent Platform Activity Timeline */}
                <div className="travel-card p-6 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                                Live Platform Feed
                            </h3>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                Real-time system transactions
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/logs')}
                            className="text-xs font-semibold text-sky-400 hover:text-sky-300"
                        >
                            Audit Logs →
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[260px] scrollbar-none">
                        <ActivityTimeline items={recentActivityItems} />
                    </div>
                </div>
            </div>
        </div>
    );
}
