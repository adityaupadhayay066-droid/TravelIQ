import React, { useState } from 'react';
import { 
    Train, Plane, Bus, Compass, Plus, 
    Trash2, Edit, CheckCircle, RefreshCw, Clock, IndianRupee 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import toast from 'react-hot-toast';

export default function TransportPage() {
    const [selectedMode, setSelectedMode] = useState('Train'); // 'Train' | 'Flight' | 'Bus' | 'Ferry'
    const [showAddModal, setShowAddModal] = useState(false);

    const [transports, setTransports] = useState([
        { id: 1, type: 'Train', provider: 'Indian Railways (IRCTC)', identifier: '12801 Purushottam Exp', source: 'PURI', destination: 'NDLS', departure: '21:45', arrival: '04:00', price: 680, seats: 42, status: 'Active' },
        { id: 2, type: 'Flight', provider: 'IndiGo 6E-2041', identifier: 'DEL → BOM', source: 'DEL (T3)', destination: 'BOM (T2)', departure: '08:15', arrival: '10:35', price: 4650, seats: 18, status: 'Active' },
        { id: 3, type: 'Flight', provider: 'Air India AI-804', identifier: 'BOM → BLR', source: 'BOM (T2)', destination: 'BLR (T1)', departure: '14:20', arrival: '16:10', price: 3890, seats: 8, status: 'Active' },
        { id: 4, type: 'Bus', provider: 'Zingbus Premium AC Sleeper', identifier: 'DEL → JAI', source: 'Kashmere Gate', destination: 'Sindhi Camp Jaipur', departure: '23:30', arrival: '05:00', price: 799, seats: 12, status: 'Active' },
        { id: 5, type: 'Bus', provider: 'IntrCity SmartBus', identifier: 'BLR → HYD', source: 'Madiwala', destination: 'Ameerpet Hyderabad', departure: '22:00', arrival: '06:30', price: 1150, seats: 6, status: 'Active' },
        { id: 6, type: 'Ferry', provider: 'Mandwa Ro-Pax Water Taxi', identifier: 'BOM → ALIBAG', source: 'Bhaucha Dhakka', destination: 'Mandwa Jetty', departure: '10:00', arrival: '10:50', price: 420, seats: 85, status: 'Active' }
    ]);

    const filteredTransports = transports.filter(t => t.type === selectedMode);

    const [form, setForm] = useState({
        provider: '',
        identifier: '',
        source: '',
        destination: '',
        departure: '',
        arrival: '',
        price: '',
        seats: 20
    });

    const handleCreate = (e) => {
        e.preventDefault();
        const newItem = {
            id: Date.now(),
            type: selectedMode,
            ...form,
            status: 'Active'
        };
        setTransports([newItem, ...transports]);
        toast.success(`${selectedMode} route added successfully.`);
        setShowAddModal(false);
        setForm({ provider: '', identifier: '', source: '', destination: '', departure: '', arrival: '', price: '', seats: 20 });
    };

    const handleDelete = (id) => {
        setTransports(transports.filter(t => t.id !== id));
        toast.success('Transport record removed.');
    };

    const columns = [
        {
            key: 'provider',
            label: 'Provider / Service',
            render: (val, row) => (
                <div>
                    <div className="text-xs font-bold text-[var(--color-text)]">{val}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] font-mono">{row.identifier}</div>
                </div>
            )
        },
        {
            key: 'route',
            label: 'Origin → Destination',
            render: (_, row) => (
                <div className="text-xs font-semibold text-[var(--color-text)]">
                    <span className="text-emerald-400 font-bold">{row.source}</span>
                    <span className="text-[var(--color-text-muted)] mx-1.5">→</span>
                    <span className="text-amber-400 font-bold">{row.destination}</span>
                </div>
            )
        },
        {
            key: 'timings',
            label: 'Departure / Arrival',
            render: (_, row) => (
                <div className="text-xs font-mono">
                    <span className="font-bold text-[var(--color-text)]">{row.departure}</span>
                    <span className="text-[var(--color-text-muted)] mx-1.5">-</span>
                    <span className="text-[var(--color-text-muted)]">{row.arrival}</span>
                </div>
            )
        },
        {
            key: 'price',
            label: 'Base Fare',
            render: (val) => (
                <span className="text-xs font-bold text-emerald-400 font-mono">
                    ₹{Number(val).toLocaleString('en-IN')}
                </span>
            )
        },
        {
            key: 'seats',
            label: 'Available Seats',
            render: (val) => (
                <span className="text-xs font-semibold text-[var(--color-text)] font-mono">
                    {val} left
                </span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (s) => <StatusBadge status={s || 'Active'} size="xs" />
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
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
                        Multi-Modal Transport Management
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Manage train schedules, flight connections, bus networks, and ferry routes.
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary !h-9 !px-4 text-xs inline-flex items-center gap-1.5"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add {selectedMode} Route</span>
                </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-[var(--color-soft)]/50 border border-[var(--color-border)] max-w-lg">
                {[
                    { mode: 'Train', icon: Train, count: transports.filter(t => t.type === 'Train').length },
                    { mode: 'Flight', icon: Plane, count: transports.filter(t => t.type === 'Flight').length },
                    { mode: 'Bus', icon: Bus, count: transports.filter(t => t.type === 'Bus').length },
                    { mode: 'Ferry', icon: Compass, count: transports.filter(t => t.type === 'Ferry').length }
                ].map((item) => {
                    const Icon = item.icon;
                    const isSel = selectedMode === item.mode;
                    return (
                        <button
                            key={item.mode}
                            onClick={() => setSelectedMode(item.mode)}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                isSel
                                    ? 'bg-[var(--color-surface)] text-sky-400 shadow-xs border border-[var(--color-border)]'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{item.mode}s</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--color-soft)]">
                                {item.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filteredTransports}
                keyField="id"
                totalRecords={filteredTransports.length}
                searchPlaceholder={`Search ${selectedMode.toLowerCase()}s by provider or route...`}
            />

            {/* Add Transport Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title={`Add ${selectedMode} Route`}
                subtitle={`Create a new ${selectedMode.toLowerCase()} transit service`}
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
                            onClick={handleCreate}
                            className="btn-primary text-xs !h-9 !px-5"
                        >
                            Add {selectedMode} Route
                        </button>
                    </>
                }
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Provider / Operator</label>
                            <input
                                type="text"
                                value={form.provider}
                                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                                placeholder="e.g. IndiGo / Zingbus / IRCTC"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Service / Route Code</label>
                            <input
                                type="text"
                                value={form.identifier}
                                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                                placeholder="e.g. 6E-2041 or 12801"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Origin / Departure Point</label>
                            <input
                                type="text"
                                value={form.source}
                                onChange={(e) => setForm({ ...form, source: e.target.value })}
                                placeholder="e.g. New Delhi (DEL / NDLS)"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Destination Point</label>
                            <input
                                type="text"
                                value={form.destination}
                                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                placeholder="e.g. Mumbai (BOM / MMCT)"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Departure Time</label>
                            <input
                                type="text"
                                value={form.departure}
                                onChange={(e) => setForm({ ...form, departure: e.target.value })}
                                placeholder="08:30 AM"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Arrival Time</label>
                            <input
                                type="text"
                                value={form.arrival}
                                onChange={(e) => setForm({ ...form, arrival: e.target.value })}
                                placeholder="11:45 AM"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Base Fare (₹)</label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="4500"
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Available Seats</label>
                            <input
                                type="number"
                                value={form.seats}
                                onChange={(e) => setForm({ ...form, seats: e.target.value })}
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
