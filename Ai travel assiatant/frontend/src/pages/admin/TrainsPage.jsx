import React, { useState, useEffect } from 'react';
import { 
    Train, Plus, Trash2, Edit, Radio, Clock, 
    Search, RefreshCw, Download, CheckCircle, AlertTriangle 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import adminApi from '../../utils/adminApi';
import toast from 'react-hot-toast';

export default function TrainsPage() {
    const [trains, setTrains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('train_number');
    const [sortOrder, setSortOrder] = useState('asc');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showLiveStatusModal, setShowLiveStatusModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);

    // Form inputs
    const [trainNumber, setTrainNumber] = useState('');
    const [trainName, setTrainName] = useState('');
    const [sourceStation, setSourceStation] = useState('NDLS');
    const [destStation, setDestStation] = useState('BBS');

    // Live status inputs
    const [currentStation, setCurrentStation] = useState('');
    const [currentStatus, setCurrentStatus] = useState('On Time');
    const [delayMinutes, setDelayMinutes] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchTrains = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getTrains({
                search,
                page,
                limit: pageSize,
                sortBy,
                order: sortOrder
            });
            if (res.data?.success) {
                setTrains(res.data.trains || []);
                setTotal(res.data.total || 0);
                setPages(res.data.pages || 1);
            }
        } catch (err) {
            console.error('fetchTrains error:', err);
            toast.error('Failed to load trains list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrains();
    }, [page, pageSize, search, sortBy, sortOrder]);

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
    };

    const handleCreateTrain = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await adminApi.createTrain({
                train_number: trainNumber,
                train_name: trainName,
                source_station: sourceStation,
                destination_station: destStation
            });
            toast.success(`Train #${trainNumber} added successfully.`);
            setShowAddModal(false);
            setTrainNumber('');
            setTrainName('');
            fetchTrains();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add train.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateLiveStatus = async (e) => {
        e.preventDefault();
        if (!selectedTrain) return;
        setActionLoading(true);
        try {
            await adminApi.updateLiveTrainStatus({
                train_number: selectedTrain.train_number,
                current_station: currentStation,
                current_status: currentStatus,
                delay_minutes: parseInt(delayMinutes) || 0
            });
            toast.success(`Live status updated for ${selectedTrain.train_number}.`);
            setShowLiveStatusModal(false);
            fetchTrains();
        } catch (err) {
            toast.error('Failed to update live status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTrain = async () => {
        if (!selectedTrain) return;
        setActionLoading(true);
        try {
            await adminApi.deleteTrain(selectedTrain.train_number);
            toast.success(`Train #${selectedTrain.train_number} deleted.`);
            setShowDeleteConfirm(false);
            fetchTrains();
        } catch (err) {
            toast.error('Failed to delete train.');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'train_number',
            label: 'Train No.',
            sortable: true,
            render: (val) => (
                <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 text-xs">
                    {val}
                </span>
            )
        },
        {
            key: 'train_name',
            label: 'Train Name',
            sortable: true,
            render: (val, row) => (
                <div>
                    <div className="text-xs font-bold text-[var(--color-text)]">{val}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{row.days_of_operation || 'Daily'}</div>
                </div>
            )
        },
        {
            key: 'route',
            label: 'Origin → Destination',
            render: (_, row) => (
                <div className="text-xs font-semibold text-[var(--color-text)]">
                    <span className="text-emerald-400 font-bold">{row.source_station || 'NDLS'}</span>
                    <span className="text-[var(--color-text-muted)] mx-1.5">→</span>
                    <span className="text-amber-400 font-bold">{row.destination_station || 'BBS'}</span>
                </div>
            )
        },
        {
            key: 'classes',
            label: 'Classes Available',
            render: (classes) => (
                <div className="flex flex-wrap gap-1">
                    {(classes || ['1A', '2A', '3A', 'SL']).map((c, i) => (
                        <span key={i} className="px-1.5 py-0.2 rounded bg-[var(--color-soft)] text-[10px] font-mono text-[var(--color-text-muted)] border border-[var(--color-border)]">
                            {c}
                        </span>
                    ))}
                </div>
            )
        },
        {
            key: 'live_status',
            label: 'Live Status',
            render: (status, row) => (
                <div className="flex items-center gap-1.5">
                    <StatusBadge status={status || 'On Time'} size="xs" />
                    {row.delay_mins > 0 && (
                        <span className="text-[10px] text-rose-400 font-semibold font-mono">
                            (+{row.delay_mins}m)
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => {
                            setSelectedTrain(row);
                            setCurrentStatus(row.live_status || 'On Time');
                            setDelayMinutes(row.delay_mins || 0);
                            setCurrentStation(row.source_station || '');
                            setShowLiveStatusModal(true);
                        }}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                        title="Update Live GPS/Delay Status"
                    >
                        <Radio className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setSelectedTrain(row); setShowDeleteConfirm(true); }}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete train"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        Train Inventory & Tracking
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Manage train timetable, class seat quotas, route stations, and real-time telemetry.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchTrains}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <a
                        href="/api/admin/export/trains"
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                    </a>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary !h-9 !px-4 text-xs inline-flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Train</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={trains}
                loading={loading}
                keyField="train_number"
                page={page}
                totalPages={pages}
                totalRecords={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                searchPlaceholder="Search by train number, name or station..."
                searchValue={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
            />

            {/* 1. Add Train Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Train to Inventory"
                subtitle="Register a new railway schedule into TravelIQ database"
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateTrain}
                            disabled={actionLoading || !trainNumber || !trainName}
                            className="btn-primary text-xs !h-9 !px-4"
                        >
                            {actionLoading ? 'Saving...' : 'Add Train Schedule'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleCreateTrain} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                Train Number
                            </label>
                            <input
                                type="text"
                                value={trainNumber}
                                onChange={(e) => setTrainNumber(e.target.value)}
                                placeholder="e.g. 12801"
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                Train Name
                            </label>
                            <input
                                type="text"
                                value={trainName}
                                onChange={(e) => setTrainName(e.target.value)}
                                placeholder="e.g. Purushottam Express"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                Source Station Code
                            </label>
                            <input
                                type="text"
                                value={sourceStation}
                                onChange={(e) => setSourceStation(e.target.value.toUpperCase())}
                                placeholder="e.g. NDLS"
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                Destination Station Code
                            </label>
                            <input
                                type="text"
                                value={destStation}
                                onChange={(e) => setDestStation(e.target.value.toUpperCase())}
                                placeholder="e.g. BBS"
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                required
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* 2. Update Live Status Modal */}
            <Modal
                isOpen={showLiveStatusModal}
                onClose={() => setShowLiveStatusModal(false)}
                title="Update Live Train Telemetry"
                subtitle={`Train #${selectedTrain?.train_number} - ${selectedTrain?.train_name}`}
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowLiveStatusModal(false)}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateLiveStatus}
                            disabled={actionLoading}
                            className="btn-primary text-xs !h-9 !px-4"
                        >
                            {actionLoading ? 'Updating...' : 'Push Live Telemetry'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleUpdateLiveStatus} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                            Current Status
                        </label>
                        <select
                            value={currentStatus}
                            onChange={(e) => setCurrentStatus(e.target.value)}
                            className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value="On Time">🟢 On Time</option>
                            <option value="Delayed">🟡 Delayed</option>
                            <option value="Cancelled">🔴 Cancelled</option>
                            <option value="Arrived">⚪ Arrived</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                Last Passed Station
                            </label>
                            <input
                                type="text"
                                value={currentStation}
                                onChange={(e) => setCurrentStation(e.target.value.toUpperCase())}
                                placeholder="e.g. CNB (Kanpur)"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                Delay (Minutes)
                            </label>
                            <input
                                type="number"
                                value={delayMinutes}
                                onChange={(e) => setDelayMinutes(e.target.value)}
                                placeholder="0"
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                            />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* 3. Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteTrain}
                title="Delete Train Schedule"
                message={`Are you sure you want to delete Train #${selectedTrain?.train_number} (${selectedTrain?.train_name}) from the system?`}
                confirmText="Delete Train"
                confirmVariant="danger"
                loading={actionLoading}
            />
        </div>
    );
}
