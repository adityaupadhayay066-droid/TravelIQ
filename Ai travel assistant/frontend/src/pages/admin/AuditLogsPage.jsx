import React, { useState, useEffect } from 'react';
import { 
    Database, Shield, Filter, Search, 
    Download, RefreshCw, Key, User, Train, Settings, LogIn, Trash2, Edit 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import adminApi from '../../utils/adminApi';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('all');
    const [search, setSearch] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getAuditLogs({
                page,
                limit: 15,
                action: actionFilter,
                search
            });
            if (res.data?.success) {
                setLogs(res.data.logs || []);
                setTotal(res.data.total || 0);
            }
        } catch (err) {
            console.error('fetchLogs error:', err);
            setLogs([]);
            setTotal(0);
            toast.error('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter, search]);

    const columns = [
        {
            key: 'action',
            label: 'Action Event',
            render: (val) => (
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {val}
                </span>
            )
        },
        {
            key: 'details',
            label: 'Action Description',
            render: (val) => (
                <span className="text-xs text-[var(--color-text)] font-sans leading-relaxed">
                    {val}
                </span>
            )
        },
        {
            key: 'User',
            label: 'Administrator',
            render: (u) => (
                <div className="text-xs">
                    <div className="font-bold text-[var(--color-text)]">{u?.name || 'System Operator'}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{u?.email}</div>
                </div>
            )
        },
        {
            key: 'created_at',
            label: 'Timestamp',
            render: (t) => (
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    {t ? new Date(t).toLocaleString() : 'Just now'}
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
                        Audit Logs & Governance
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Immutable ledger of administrative actions, permission mutations, dataset syncs, and security events.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLogs}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <a
                        href="/api/admin/export/audit-logs"
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </a>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={logs}
                loading={loading}
                keyField="id"
                page={page}
                totalPages={Math.ceil(total / 15) || 1}
                totalRecords={total}
                pageSize={15}
                onPageChange={setPage}
                searchPlaceholder="Search audit events by description or keyword..."
                searchValue={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                filters={
                    <select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                    >
                        <option value="all">All Actions</option>
                        <option value="ADMIN_LOGIN">Admin Logins</option>
                        <option value="USER_UPDATE">User Edits</option>
                        <option value="USER_DELETE">User Deletions</option>
                        <option value="DATASET_UPLOAD">Dataset Uploads</option>
                        <option value="ROLE_CHANGE">Role Changes</option>
                        <option value="PASSWORD_RESET">Password Resets</option>
                    </select>
                }
            />
        </div>
    );
}
