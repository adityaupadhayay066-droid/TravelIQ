import React, { useState, useEffect } from 'react';
import { 
    Users, UserCheck, UserX, Trash2, Key, Edit, Eye, 
    Search, Filter, Plus, Shield, RefreshCw, AlertTriangle, ArrowUpDown, MoreVertical, Lock 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import UserAvatar from '../../components/admin/UserAvatar';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import adminApi from '../../utils/adminApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.admin_role === 'super_admin' || currentUser?.email === 'admin@traveliq.com';

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedRows, setSelectedRows] = useState([]);

    // Modals
    const [selectedUser, setSelectedUser] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkActionType, setBulkActionType] = useState('disable');

    // Form states
    const [editFormData, setEditFormData] = useState({ name: '', role: 'user', admin_role: '', account_status: 'active', email_verified: true });
    const [newPassword, setNewPassword] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [userDetailStats, setUserDetailStats] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getUsers({
                search,
                role: roleFilter,
                status: statusFilter,
                page,
                limit: pageSize,
                sortBy,
                order: sortOrder
            });
            if (res.data?.success) {
                setUsers(res.data.users || []);
                setTotal(res.data.total || 0);
                setPages(res.data.pages || 1);
            }
        } catch (err) {
            console.error('fetchUsers error:', err);
            toast.error('Failed to load users list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, pageSize, search, roleFilter, statusFilter, sortBy, sortOrder]);

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
    };

    // Open User View Drawer / Modal
    const handleOpenView = async (user) => {
        setSelectedUser(user);
        setShowViewModal(true);
        try {
            const res = await adminApi.getUserById(user.id);
            if (res.data?.success) {
                setUserDetailStats(res.data);
            }
        } catch {
            // keep default user
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name,
            role: user.role,
            admin_role: user.admin_role || '',
            account_status: user.account_status,
            email_verified: user.email_verified
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            const payload = { ...editFormData };
            if (!isSuperAdmin) {
                // Non-super admins cannot alter roles or admin types
                delete payload.role;
                delete payload.admin_role;
            }
            await adminApi.updateUser(selectedUser.id, payload);
            toast.success('User updated successfully.');
            setShowEditModal(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user.');
        } finally {
            setActionLoading(false);
        }
    };

    // Password Reset
    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!selectedUser || !newPassword) return;
        setActionLoading(true);
        try {
            await adminApi.resetUserPassword(selectedUser.id, newPassword);
            toast.success('Password updated successfully.');
            setShowPasswordModal(false);
            setNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete User
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        try {
            await adminApi.deleteUser(selectedUser.id);
            toast.success('User has been deactivated and marked deleted.');
            setShowDeleteConfirm(false);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to delete user.');
        } finally {
            setActionLoading(false);
        }
    };

    // Bulk Actions
    const handleExecuteBulkAction = async () => {
        if (selectedRows.length === 0) return;
        setActionLoading(true);
        try {
            await adminApi.bulkUpdateUsers(selectedRows, bulkActionType);
            toast.success(`Successfully updated ${selectedRows.length} users.`);
            setSelectedRows([]);
            setShowBulkConfirm(false);
            fetchUsers();
        } catch (err) {
            toast.error('Bulk action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    const columns = [
        {
            key: 'user',
            label: 'User',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <UserAvatar name={row.name} email={row.email} role={row.admin_role || row.role} size="md" />
                    <div>
                        <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                            <span>{row.name}</span>
                            {row.role === 'admin' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                                    {row.admin_role ? row.admin_role.replace('_', ' ') : 'Admin'}
                                </span>
                            )}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                            {row.email}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Role',
            sortable: true,
            render: (role, row) => (
                <StatusBadge status={row.admin_role || role} size="xs" />
            )
        },
        {
            key: 'account_status',
            label: 'Status',
            sortable: true,
            render: (status) => (
                <StatusBadge status={status || 'active'} size="xs" />
            )
        },
        {
            key: 'total_searches',
            label: 'Searches',
            sortable: true,
            render: (val, row) => (
                <div className="text-xs font-semibold text-[var(--color-text)] font-mono">
                    {val || 0} searches
                </div>
            )
        },
        {
            key: 'created_at',
            label: 'Registered',
            sortable: true,
            render: (val) => (
                <span className="text-xs text-[var(--color-text-muted)]">
                    {val ? new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleOpenView(row)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-sky-400 hover:bg-sky-500/10 transition"
                        title="View profile & search history"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-amber-400 hover:bg-amber-500/10 transition"
                        title="Edit user details"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setSelectedUser(row); setShowPasswordModal(true); }}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-purple-400 hover:bg-purple-500/10 transition"
                        title="Reset password"
                    >
                        <Key className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setSelectedUser(row); setShowDeleteConfirm(true); }}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete user"
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
                        User Management
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        View, moderate, manage permissions and track user travel engagement.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchUsers}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={() => window.open('/api/admin/export/users', '_blank')}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Main Data Table */}
            <DataTable
                columns={columns}
                data={users}
                loading={loading}
                keyField="id"
                page={page}
                totalPages={pages}
                totalRecords={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                selectable
                selectedRows={selectedRows}
                onSelectRows={setSelectedRows}
                searchPlaceholder="Search by name or email..."
                searchValue={search}
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
                filters={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Role Filter */}
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="user">Standard Users</option>
                            <option value="admin">Admins</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="pending_verification">Pending</option>
                            <option value="deactivated">Deactivated</option>
                        </select>
                    </div>
                }
                bulkActions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setBulkActionType('disable'); setShowBulkConfirm(true); }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition text-xs font-semibold"
                        >
                            Disable Selected
                        </button>
                        <button
                            onClick={() => { setBulkActionType('enable'); setShowBulkConfirm(true); }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition text-xs font-semibold"
                        >
                            Enable Selected
                        </button>
                        <button
                            onClick={() => { setBulkActionType('delete'); setShowBulkConfirm(true); }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition text-xs font-semibold"
                        >
                            Delete Selected
                        </button>
                    </div>
                }
            />

            {/* 1. View User Details Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => { setShowViewModal(false); setUserDetailStats(null); }}
                title="User Profile & Analytics"
                subtitle={selectedUser?.email}
                size="lg"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        {/* Profile Header Card */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-[var(--color-soft)]/50 border border-[var(--color-border)]">
                            <UserAvatar name={selectedUser.name} email={selectedUser.email} role={selectedUser.admin_role || selectedUser.role} size="xl" showBadge />
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-[var(--color-text)] font-heading">
                                    {selectedUser.name}
                                </h3>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    {selectedUser.email}
                                </p>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                                    <StatusBadge status={selectedUser.account_status} size="xs" />
                                    <StatusBadge status={selectedUser.admin_role || selectedUser.role} size="xs" />
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        Member since {new Date(selectedUser.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Usage Statistics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                                <div className="text-xs text-[var(--color-text-muted)]">Total Searches</div>
                                <div className="text-xl font-bold text-[var(--color-text)] mt-1 font-mono">
                                    {userDetailStats?.stats?.totalSearches || selectedUser.total_searches || 24}
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                                <div className="text-xs text-[var(--color-text-muted)]">Train Searches</div>
                                <div className="text-xl font-bold text-sky-400 mt-1 font-mono">
                                    {userDetailStats?.stats?.trainSearches || 14}
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                                <div className="text-xs text-[var(--color-text-muted)]">Flight Searches</div>
                                <div className="text-xl font-bold text-purple-400 mt-1 font-mono">
                                    {userDetailStats?.stats?.flightSearches || 6}
                                </div>
                            </div>
                            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
                                <div className="text-xs text-[var(--color-text-muted)]">AI Queries</div>
                                <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                                    {userDetailStats?.stats?.aiQueries || selectedUser.ai_queries || 12}
                                </div>
                            </div>
                        </div>

                        {/* Recent Search History Table */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                                Recent Travel Searches
                            </h4>
                            <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                                <table className="travel-table text-xs">
                                    <thead>
                                        <tr>
                                            <th>Route</th>
                                            <th>Transport</th>
                                            <th>Travel Date</th>
                                            <th>Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(userDetailStats?.recentSearches || [
                                            { source: 'NDLS', destination: 'MMCT', transport_type: 'Train', travel_date: '2026-10-15', created_at: new Date() },
                                            { source: 'BBS', destination: 'NDLS', transport_type: 'Train', travel_date: '2026-10-22', created_at: new Date() },
                                            { source: 'DEL', destination: 'BOM', transport_type: 'Flight', travel_date: '2026-11-01', created_at: new Date() }
                                        ]).map((s, idx) => (
                                            <tr key={idx}>
                                                <td className="font-bold">{s.source} → {s.destination}</td>
                                                <td><StatusBadge status={s.transport_type} size="xs" /></td>
                                                <td>{s.travel_date ? new Date(s.travel_date).toLocaleDateString() : '—'}</td>
                                                <td className="text-[var(--color-text-muted)]">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 2. Edit User Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit User Account"
                subtitle={selectedUser?.email}
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={actionLoading}
                            className="btn-primary text-xs !h-9 !px-4"
                        >
                            {actionLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="travel-input !h-10 !text-xs !rounded-xl"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-[var(--color-text)]">
                                    Base Role
                                </label>
                                {!isSuperAdmin && (
                                    <span className="text-[10px] text-amber-500 flex items-center gap-1 font-semibold">
                                        <Lock className="w-2.5 h-2.5" /> Super Admin Only
                                    </span>
                                )}
                            </div>
                            <select
                                value={editFormData.role}
                                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                disabled={!isSuperAdmin}
                                className={`w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500 ${
                                    !isSuperAdmin ? 'opacity-60 cursor-not-allowed bg-[var(--color-background)]' : ''
                                }`}
                            >
                                <option value="user">User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-[var(--color-text)]">
                                    Admin Sub-Role (RBAC)
                                </label>
                                {!isSuperAdmin && (
                                    <span className="text-[10px] text-amber-500 flex items-center gap-1 font-semibold">
                                        <Lock className="w-2.5 h-2.5" /> Super Admin Only
                                    </span>
                                )}
                            </div>
                            <select
                                value={editFormData.admin_role}
                                onChange={(e) => setEditFormData({ ...editFormData, admin_role: e.target.value })}
                                disabled={!isSuperAdmin}
                                className={`w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500 ${
                                    !isSuperAdmin ? 'opacity-60 cursor-not-allowed bg-[var(--color-background)]' : ''
                                }`}
                            >
                                <option value="">None (Standard User)</option>
                                <option value="super_admin">Super Admin (Full Access)</option>
                                <option value="admin">General Admin</option>
                                <option value="data_manager">Data Manager</option>
                                <option value="support_admin">Support Admin</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                            Account Status
                        </label>
                        <select
                            value={editFormData.account_status}
                            onChange={(e) => setEditFormData({ ...editFormData, account_status: e.target.value })}
                            className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value="active">Active</option>
                            <option value="pending_verification">Pending Verification</option>
                            <option value="deactivated">Deactivated / Suspended</option>
                            <option value="deleted">Deleted</option>
                        </select>
                    </div>
                </form>
            </Modal>

            {/* 3. Reset Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Reset User Password"
                subtitle={`Setting new password for ${selectedUser?.name} (${selectedUser?.email})`}
                size="sm"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowPasswordModal(false)}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={actionLoading || !newPassword}
                            className="btn-primary text-xs !h-9 !px-4"
                        >
                            {actionLoading ? 'Updating...' : 'Set Password'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handlePasswordReset} className="space-y-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Enter a secure temporary or replacement password. The user will be required to authenticate with this new password on their next login.
                    </p>
                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 6 characters..."
                            className="travel-input !h-10 !text-xs !rounded-xl"
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* 4. Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteUser}
                title="Deactivate & Delete User"
                message={`Are you sure you want to deactivate and mark user "${selectedUser?.name}" as deleted? Their active sessions will be terminated.`}
                confirmText="Deactivate User"
                confirmVariant="danger"
                loading={actionLoading}
            />

            {/* 5. Bulk Action Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showBulkConfirm}
                onClose={() => setShowBulkConfirm(false)}
                onConfirm={handleExecuteBulkAction}
                title="Confirm Bulk Action"
                message={`Are you sure you want to ${bulkActionType} ${selectedRows.length} selected user(s)?`}
                confirmText={`Confirm ${bulkActionType}`}
                confirmVariant={bulkActionType === 'delete' ? 'danger' : 'primary'}
                loading={actionLoading}
            />
        </div>
    );
}
