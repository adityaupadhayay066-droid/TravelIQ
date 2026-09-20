import React, { useState, useEffect } from 'react';
import { 
    MapPin, Plus, Trash2, Edit, Eye, Tag, 
    Sparkles, RefreshCw, Download, IndianRupee, Image, Grid, List 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import adminApi from '../../utils/adminApi';
import toast from 'react-hot-toast';

export default function DestinationsPage() {
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedDest, setSelectedDest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Form inputs
    const initialForm = {
        name: '',
        state: '',
        country: 'India',
        description: '',
        image_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200',
        popularity: 85,
        best_time_to_visit: 'October to March',
        estimated_budget: 10000,
        attractions: 'Main Ghats, Historic Temples, Old Bazaars',
        food_recommendations: 'Local Thali, Sweet Delicacies, Street Food',
        safety_info: 'Safe for tourists. Follow basic travel precautions.',
        local_transport: 'Auto rickshaws, cabs, walking.',
        tags: 'Historical, Culture, Popular',
        status: 'active'
    };
    const [formData, setFormData] = useState(initialForm);

    const fetchDestinations = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getDestinations({
                search,
                page,
                limit: pageSize
            });
            if (res.data?.success) {
                setDestinations(res.data.destinations || []);
                setTotal(res.data.total || 0);
                setPages(res.data.pages || 1);
            }
        } catch (err) {
            console.error('fetchDestinations error:', err);
            toast.error('Failed to load destinations.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDestinations();
    }, [page, pageSize, search]);

    const handleOpenAdd = () => {
        setFormData(initialForm);
        setShowAddModal(true);
    };

    const handleOpenEdit = (dest) => {
        setSelectedDest(dest);
        setFormData({
            name: dest.name,
            state: dest.state || '',
            country: dest.country || 'India',
            description: dest.description || '',
            image_url: dest.image_url || '',
            popularity: dest.popularity || 80,
            best_time_to_visit: dest.best_time_to_visit || '',
            estimated_budget: dest.estimated_budget || 10000,
            attractions: Array.isArray(dest.attractions) ? dest.attractions.join(', ') : (dest.attractions || ''),
            food_recommendations: Array.isArray(dest.food_recommendations) ? dest.food_recommendations.join(', ') : (dest.food_recommendations || ''),
            safety_info: dest.safety_info || '',
            local_transport: dest.local_transport || '',
            tags: Array.isArray(dest.tags) ? dest.tags.join(', ') : (dest.tags || ''),
            status: dest.status || 'active'
        });
        setShowEditModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            if (showEditModal && selectedDest) {
                await adminApi.updateDestination(selectedDest.id, formData);
                toast.success('Destination updated.');
                setShowEditModal(false);
            } else {
                await adminApi.createDestination(formData);
                toast.success('Destination created.');
                setShowAddModal(false);
            }
            fetchDestinations();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDest) return;
        setActionLoading(true);
        try {
            await adminApi.deleteDestination(selectedDest.id);
            toast.success('Destination deleted.');
            setShowDeleteConfirm(false);
            fetchDestinations();
        } catch (err) {
            toast.error('Failed to delete destination.');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'destination',
            label: 'Destination',
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <img
                        src={row.image_url || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=200'}
                        alt={row.name}
                        className="w-10 h-10 rounded-xl object-cover border border-[var(--color-border)] shrink-0"
                    />
                    <div>
                        <div className="text-xs font-bold text-[var(--color-text)]">{row.name}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">{row.state}, {row.country}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'popularity',
            label: 'Popularity Score',
            render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-[var(--color-soft)] overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${val || 75}%` }} />
                    </div>
                    <span className="text-xs font-bold font-mono text-[var(--color-text)]">{val || 75}%</span>
                </div>
            )
        },
        {
            key: 'estimated_budget',
            label: 'Est. Budget',
            render: (val) => (
                <span className="text-xs font-mono font-bold text-emerald-400">
                    ₹{Number(val || 8000).toLocaleString('en-IN')}
                </span>
            )
        },
        {
            key: 'tags',
            label: 'Tags',
            render: (tags) => (
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {(Array.isArray(tags) ? tags : ['Popular']).map((t, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-soft)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                            {t}
                        </span>
                    ))}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (s) => <StatusBadge status={s || 'active'} size="xs" />
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-amber-400 hover:bg-amber-500/10 transition"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setSelectedDest(row); setShowDeleteConfirm(true); }}
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
                        Destinations & Curation
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Curate tourist destinations, highlights, budget estimations, and AI travel guide knowledge.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-soft)] border border-[var(--color-border)]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'grid' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs' : 'text-[var(--color-text-muted)]'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'table' ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs' : 'text-[var(--color-text-muted)]'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={fetchDestinations}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleOpenAdd}
                        className="btn-primary !h-9 !px-4 text-xs inline-flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Destination</span>
                    </button>
                </div>
            </div>

            {/* Grid View Mode */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {destinations.map((dest) => (
                        <div
                            key={dest.id}
                            className="travel-card rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-sky-500/40 transition-all duration-200"
                        >
                            <div className="relative h-48 overflow-hidden bg-[var(--color-soft)]">
                                <img
                                    src={dest.image_url || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800'}
                                    alt={dest.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                
                                <div className="absolute top-3 left-3 flex gap-1">
                                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                                        ★ {dest.popularity || 85}%
                                    </span>
                                </div>

                                <div className="absolute bottom-3 left-3 right-3 text-white">
                                    <h3 className="text-lg font-bold font-heading">{dest.name}</h3>
                                    <p className="text-xs text-slate-200 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-sky-400" />
                                        <span>{dest.state}, {dest.country}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                                    {dest.description || 'Famous historic and scenic Indian travel destination.'}
                                </p>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                                        <span>Best Season:</span>
                                        <span className="font-semibold text-[var(--color-text)]">{dest.best_time_to_visit || 'Oct - Mar'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                                        <span>Est. Budget:</span>
                                        <span className="font-bold text-emerald-400 font-mono">₹{Number(dest.estimated_budget || 8500).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--color-border)]">
                                    {(Array.isArray(dest.tags) ? dest.tags : ['Popular', 'Historical']).slice(0, 3).map((t, idx) => (
                                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-soft)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                                    <StatusBadge status={dest.status || 'active'} size="xs" />
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenEdit(dest)}
                                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-amber-400 hover:bg-amber-500/10 transition"
                                            title="Edit Destination"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedDest(dest); setShowDeleteConfirm(true); }}
                                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
                                            title="Delete Destination"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Table View Mode */
                <DataTable
                    columns={columns}
                    data={destinations}
                    loading={loading}
                    keyField="id"
                    page={page}
                    totalPages={pages}
                    totalRecords={total}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    searchPlaceholder="Search destinations by name or state..."
                    searchValue={search}
                    onSearchChange={(v) => { setSearch(v); setPage(1); }}
                />
            )}

            {/* Add / Edit Destination Modal */}
            <Modal
                isOpen={showAddModal || showEditModal}
                onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
                title={showEditModal ? 'Edit Destination' : 'Add New Destination Guide'}
                subtitle="Curate detailed travel guide information for the AI assistant"
                size="lg"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={actionLoading || !formData.name}
                            className="btn-primary text-xs !h-9 !px-5"
                        >
                            {actionLoading ? 'Saving...' : (showEditModal ? 'Save Changes' : 'Create Destination')}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSave} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Destination Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Varanasi"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">State / Region</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                placeholder="e.g. Uttar Pradesh"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Banner Image URL</label>
                        <input
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://..."
                            className="travel-input !h-10 !text-xs !rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Description & Heritage</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Short summary of significance and attractions..."
                            className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Popularity Score (1-100)</label>
                            <input
                                type="number"
                                value={formData.popularity}
                                onChange={(e) => setFormData({ ...formData, popularity: e.target.value })}
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Best Time To Visit</label>
                            <input
                                type="text"
                                value={formData.best_time_to_visit}
                                onChange={(e) => setFormData({ ...formData, best_time_to_visit: e.target.value })}
                                placeholder="Oct - Mar"
                                className="travel-input !h-10 !text-xs !rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Estimated Budget (₹)</label>
                            <input
                                type="number"
                                value={formData.estimated_budget}
                                onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                                className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Key Attractions (Comma Separated)</label>
                        <input
                            type="text"
                            value={formData.attractions}
                            onChange={(e) => setFormData({ ...formData, attractions: e.target.value })}
                            placeholder="Dashashwamedh Ghat, Kashi Vishwanath, Sarnath"
                            className="travel-input !h-10 !text-xs !rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Food Recommendations (Comma Separated)</label>
                        <input
                            type="text"
                            value={formData.food_recommendations}
                            onChange={(e) => setFormData({ ...formData, food_recommendations: e.target.value })}
                            placeholder="Banarasi Paan, Kachori Sabzi, Malaiyo"
                            className="travel-input !h-10 !text-xs !rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">Tags (e.g. Beach, Mountains, Historical, Luxury, Budget)</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="Historical, Spiritual, Culture"
                            className="travel-input !h-10 !text-xs !rounded-xl"
                        />
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Destination"
                message={`Are you sure you want to remove "${selectedDest?.name}" from destination records?`}
                confirmText="Delete Destination"
                confirmVariant="danger"
                loading={actionLoading}
            />
        </div>
    );
}
