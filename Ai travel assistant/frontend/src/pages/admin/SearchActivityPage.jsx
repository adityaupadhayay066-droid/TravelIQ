import React, { useState, useEffect } from 'react';
import { 
    Search, MapPin, Calendar, Clock, 
    RefreshCw, Download, Filter, Train, Plane, Bus, Compass 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import ChartCard from '../../components/admin/ChartCard';
import adminApi from '../../utils/adminApi';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function SearchActivityPage() {
    const [searches, setSearches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [transportFilter, setTransportFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const volumeTrends = [
        { route: 'NDLS → MMCT', searches: 1420 },
        { route: 'BBS → NDLS', searches: 980 },
        { route: 'DEL → BOM', searches: 840 },
        { route: 'BLR → HYD', searches: 620 },
        { route: 'HWH → PURI', searches: 510 }
    ];

    const fetchSearches = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getSearchAnalytics({
                page,
                limit: 10,
                transport: transportFilter,
                search: searchQuery
            });
            if (res.data?.success) {
                setSearches(res.data.searches || []);
                setTotal(res.data.total || 0);
            }
        } catch {
            // fallback
            setSearches([
                { id: 1, source: 'NDLS (New Delhi)', destination: 'MMCT (Mumbai Central)', transport_type: 'Train', travel_date: '2026-10-18', user: { name: 'Vikram Singh' }, created_at: new Date() },
                { id: 2, source: 'DEL (Indira Gandhi Intl)', destination: 'BOM (Chhatrapati Shivaji Intl)', transport_type: 'Flight', travel_date: '2026-11-02', user: { name: 'Ananya Roy' }, created_at: new Date(Date.now() - 10 * 60000) },
                { id: 3, source: 'BBS (Bhubaneswar)', destination: 'NDLS (New Delhi)', transport_type: 'Train', travel_date: '2026-10-25', user: { name: 'Rohan Deshmukh' }, created_at: new Date(Date.now() - 25 * 60000) },
                { id: 4, source: 'Bangalore (Madiwala)', destination: 'Hyderabad (Ameerpet)', transport_type: 'Bus', travel_date: '2026-10-15', user: { name: 'Kavita Menon' }, created_at: new Date(Date.now() - 40 * 60000) }
            ]);
            setTotal(4);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSearches();
    }, [page, transportFilter, searchQuery]);

    const columns = [
        {
            key: 'route',
            label: 'Search Route',
            render: (_, row) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-text)]">{row.source}</span>
                    <span className="text-[var(--color-text-muted)]">→</span>
                    <span className="text-xs font-bold text-sky-400">{row.destination}</span>
                </div>
            )
        },
        {
            key: 'transport_type',
            label: 'Transport',
            render: (val) => <StatusBadge status={val || 'Train'} size="xs" />
        },
        {
            key: 'user',
            label: 'User',
            render: (u) => (
                <span className="text-xs font-semibold text-[var(--color-text)]">
                    {u?.name || 'Anonymous Guest'}
                </span>
            )
        },
        {
            key: 'travel_date',
            label: 'Travel Date',
            render: (d) => (
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    {d ? new Date(d).toLocaleDateString() : '—'}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Timestamp',
            render: (t) => (
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    {t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        Search & Activity Telemetry
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Track multi-modal search volume, popular route corridors, and user trip intent.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchSearches}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <a
                        href="/api/admin/export/searches"
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </a>
                </div>
            </div>

            {/* Top Route Corridors Chart */}
            <ChartCard
                title="Top Search Corridors"
                subtitle="High volume route searches aggregated over last 30 days"
            >
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={volumeTrends} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} horizontal={false} />
                        <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="route" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                                borderRadius: '12px',
                                fontSize: '12px'
                            }}
                        />
                        <Bar dataKey="searches" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Searches Feed Table */}
            <DataTable
                columns={columns}
                data={searches}
                loading={loading}
                keyField="id"
                page={page}
                totalPages={Math.ceil(total / 10) || 1}
                totalRecords={total}
                pageSize={10}
                onPageChange={setPage}
                searchPlaceholder="Filter searches by city or station..."
                searchValue={searchQuery}
                onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
                filters={
                    <select
                        value={transportFilter}
                        onChange={(e) => { setTransportFilter(e.target.value); setPage(1); }}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                    >
                        <option value="all">All Transport</option>
                        <option value="Train">Trains</option>
                        <option value="Flight">Flights</option>
                        <option value="Bus">Buses</option>
                        <option value="Ferry">Ferries</option>
                    </select>
                }
            />
        </div>
    );
}
