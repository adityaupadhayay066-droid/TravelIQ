import React, { useState } from 'react';
import { 
    BarChart3, TrendingUp, Users, Search, IndianRupee, 
    Download, Calendar, Sparkles, Train, ArrowUpRight 
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import ChartCard from '../../components/admin/ChartCard';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState('30d');

    const dauData = [
        { day: 'Sep 1', dau: 42, searches: 210, revenue: 14200 },
        { day: 'Sep 3', dau: 54, searches: 340, revenue: 22800 },
        { day: 'Sep 6', dau: 68, searches: 490, revenue: 31500 },
        { day: 'Sep 9', dau: 75, searches: 580, revenue: 38200 },
        { day: 'Sep 12', dau: 92, searches: 720, revenue: 49000 },
        { day: 'Sep 15', dau: 110, searches: 890, revenue: 58400 },
        { day: 'Today', dau: 128, searches: 1040, revenue: 64200 }
    ];

    const revenueByClass = [
        { name: 'Train (1A/2A/3A/SL)', value: 142000, color: '#0ea5e9' },
        { name: 'Flight Bookings', value: 89000, color: '#8b5cf6' },
        { name: 'Bus Sleeper / AC', value: 34000, color: '#f59e0b' },
        { name: 'Ferry / Local Taxi', value: 12000, color: '#10b981' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        Platform Growth & Revenue Analytics
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Daily Active Users (DAU), Monthly Active Users (MAU), search throughput, and ticket revenue metrics.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-soft)] border border-[var(--color-border)] text-xs">
                        {['7d', '30d', '90d', 'ytd'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setDateRange(r)}
                                className={`px-2.5 py-1 rounded-lg font-semibold uppercase transition ${
                                    dateRange === r ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs' : 'text-[var(--color-text-muted)]'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <a
                        href="/api/admin/export/users"
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </a>
                </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Daily Active Users (DAU)"
                    value="128"
                    subtitle="45% of total registered"
                    change="+22.4%"
                    icon={Users}
                    iconColor="text-sky-400"
                    iconBg="bg-sky-500/10 border-sky-500/20"
                />
                <StatCard
                    title="Monthly Active Users (MAU)"
                    value="1,420"
                    subtitle="30-day trailing active"
                    change="+18.5%"
                    icon={TrendingUp}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/10 border-emerald-500/20"
                />
                <StatCard
                    title="Total Search Volume"
                    value="14,890"
                    subtitle="Across train, flight & bus"
                    change="+31.0%"
                    icon={Search}
                    iconColor="text-amber-400"
                    iconBg="bg-amber-500/10 border-amber-500/20"
                />
                <StatCard
                    title="Estimated Gross Bookings"
                    value="₹2,77,000"
                    subtitle="Avg ₹640 per ticket"
                    change="+28.4%"
                    icon={IndianRupee}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10 border-purple-500/20"
                />
            </div>

            {/* DAU Growth and Search Corridors */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ChartCard
                    title="Active Users & Search Velocity Over Time"
                    subtitle="Trailing 30-day interaction growth"
                    className="lg:col-span-2"
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={dauData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
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
                            <Area type="monotone" dataKey="dau" name="Daily Active Users" stroke="#0ea5e9" strokeWidth={2} fill="url(#dauGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Revenue Share Donut */}
                <ChartCard
                    title="Revenue by Transport Class"
                    subtitle="Total estimated platform gross"
                >
                    <div className="h-[280px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByClass}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {revenueByClass.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                                    contentStyle={{
                                        backgroundColor: 'var(--color-surface)',
                                        borderColor: 'var(--color-border)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Legend formatter={(v) => <span className="text-xs text-[var(--color-text)]">{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}
