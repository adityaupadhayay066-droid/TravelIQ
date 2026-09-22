import React, { useState, useEffect } from 'react';
import { 
    Flag, ShieldAlert, CheckCircle, Clock, 
    Edit, Eye, RefreshCw, MessageSquare, User, Filter, AlertTriangle 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import adminApi from '../../utils/adminApi';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ open: 0, investigating: 0, resolved: 0, critical: 0 });

    // Manage Report Modal
    const [selectedReport, setSelectedReport] = useState(null);
    const [showManageModal, setShowManageModal] = useState(false);
    const [statusInput, setStatusInput] = useState('Open');
    const [priorityInput, setPriorityInput] = useState('Medium');
    const [assignedAdmin, setAssignedAdmin] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [resolutionSummary, setResolutionSummary] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getReports({
                page,
                limit: 10,
                status: statusFilter,
                priority: priorityFilter,
                category: categoryFilter,
                search
            });
            if (res.data?.success) {
                setReports(res.data.reports || []);
                setTotal(res.data.total || 0);
                if (res.data.stats) setStats(res.data.stats);
            }
        } catch (err) {
            console.error('fetchReports error:', err);
            setReports([]);
            setTotal(0);
            toast.error('Failed to load reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [page, statusFilter, priorityFilter, categoryFilter, search]);

    const handleOpenManage = (report) => {
        setSelectedReport(report);
        setStatusInput(report.status || 'Open');
        setPriorityInput(report.priority || 'Medium');
        setAssignedAdmin(report.assigned_admin_name || '');
        setInternalNotes(report.internal_notes || '');
        setResolutionSummary(report.resolution_summary || '');
        setShowManageModal(true);
    };

    const handleUpdateReport = async (e) => {
        e.preventDefault();
        if (!selectedReport) return;
        setActionLoading(true);
        try {
            await adminApi.updateReport(selectedReport.id, {
                status: statusInput,
                priority: priorityInput,
                assigned_admin_name: assignedAdmin,
                internal_notes: internalNotes,
                resolution_summary: resolutionSummary
            });
            toast.success(`Report #${selectedReport.report_id} updated.`);
            setShowManageModal(false);
            fetchReports();
        } catch {
            toast.error('Failed to update report.');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'report_id',
            label: 'Report ID',
            render: (val) => (
                <span className="font-mono font-bold text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    {val}
                </span>
            )
        },
        {
            key: 'subject',
            label: 'Subject / Category',
            render: (val, row) => (
                <div className="max-w-md">
                    <div className="text-xs font-bold text-[var(--color-text)] truncate">{val}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{row.category} • by {row.user_name}</div>
                </div>
            )
        },
        {
            key: 'priority',
            label: 'Priority',
            render: (p) => <StatusBadge status={p || 'Medium'} size="xs" />
        },
        {
            key: 'status',
            label: 'Status',
            render: (s) => <StatusBadge status={s || 'Open'} size="xs" />
        },
        {
            key: 'assigned_admin_name',
            label: 'Assigned To',
            render: (val) => (
                <span className="text-xs text-[var(--color-text-muted)]">
                    {val || 'Unassigned'}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (t) => (
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    {t ? new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Manage',
            className: 'text-right',
            render: (_, row) => (
                <button
                    onClick={() => handleOpenManage(row)}
                    className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition"
                    title="Manage Ticket"
                >
                    <Edit className="w-4 h-4" />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        Reports & Issue Management
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Moderate user feedback, wrong train schedules, website bugs, and AI recommendation issues.
                    </p>
                </div>

                <button
                    onClick={fetchReports}
                    className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            {/* Quick Summary Pill Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                    <div className="text-xs text-sky-400 font-semibold">Open Reports</div>
                    <div className="text-xl font-bold text-sky-400 font-mono mt-1">{stats.open || 2}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-xs text-amber-400 font-semibold">Under Investigation</div>
                    <div className="text-xl font-bold text-amber-400 font-mono mt-1">{stats.investigating || 1}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-xs text-emerald-400 font-semibold">Resolved</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono mt-1">{stats.resolved || 8}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="text-xs text-rose-400 font-semibold">Critical Priority</div>
                    <div className="text-xl font-bold text-rose-400 font-mono mt-1">{stats.critical || 1}</div>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={reports}
                loading={loading}
                keyField="id"
                page={page}
                totalPages={Math.ceil(total / 10) || 1}
                totalRecords={total}
                pageSize={10}
                onPageChange={setPage}
                searchPlaceholder="Search reports by ID, user or description..."
                searchValue={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                filters={
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value="all">All Priorities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                }
            />

            {/* Manage Ticket Modal */}
            <Modal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                title="Manage Report Ticket"
                subtitle={`Report #${selectedReport?.report_id} • ${selectedReport?.category}`}
                size="lg"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowManageModal(false)}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateReport}
                            disabled={actionLoading}
                            className="btn-primary text-xs !h-9 !px-5"
                        >
                            {actionLoading ? 'Updating...' : 'Update Status & Notes'}
                        </button>
                    </>
                }
            >
                {selectedReport && (
                    <form onSubmit={handleUpdateReport} className="space-y-4">
                        {/* Reporter Details Box */}
                        <div className="p-4 rounded-xl bg-[var(--color-soft)]/50 border border-[var(--color-border)] space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-[var(--color-text)]">{selectedReport.user_name}</span>
                                    <span className="text-[var(--color-text-muted)] ml-1">({selectedReport.user_email})</span>
                                </div>
                                <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                                    {new Date(selectedReport.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="text-xs font-bold text-[var(--color-text)]">
                                Subject: {selectedReport.subject}
                            </div>
                            <p className="text-xs text-[var(--color-text)] bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-border)] leading-relaxed">
                                {selectedReport.description}
                            </p>
                        </div>

                        {/* Status, Priority, Assignee */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Status</label>
                                <select
                                    value={statusInput}
                                    onChange={(e) => setStatusInput(e.target.value)}
                                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                                >
                                    <option value="Open">Open</option>
                                    <option value="Investigating">Investigating</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Priority</label>
                                <select
                                    value={priorityInput}
                                    onChange={(e) => setPriorityInput(e.target.value)}
                                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Assigned Admin</label>
                                <input
                                    type="text"
                                    value={assignedAdmin}
                                    onChange={(e) => setAssignedAdmin(e.target.value)}
                                    placeholder="e.g. Priya Patel"
                                    className="travel-input !h-10 !text-xs !rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Internal Admin Notes */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Internal Investigation Notes</label>
                            <textarea
                                rows={2}
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="Notes visible only to TravelIQ administrators..."
                                className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {/* Resolution Summary */}
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Resolution Summary / User Reply</label>
                            <textarea
                                rows={2}
                                value={resolutionSummary}
                                onChange={(e) => setResolutionSummary(e.target.value)}
                                placeholder="Summary of fixes applied (e.g. Updated train departure time to 22:05 in master schedule)..."
                                className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                            />
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
