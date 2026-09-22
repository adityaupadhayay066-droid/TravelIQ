import React, { useState, useEffect } from 'react';
import { 
    Shield, UserCheck, Key, Edit, Plus, 
    Check, X, RefreshCw, UserPlus, ShieldAlert, Lock 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import UserAvatar from '../../components/admin/UserAvatar';
import Modal from '../../components/admin/Modal';
import adminApi from '../../utils/adminApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminManagementPage() {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.admin_role === 'super_admin' || currentUser?.email === 'admin@traveliq.com';

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState('admin');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getAdminAccounts();
            if (res.data?.success) {
                setAdmins(res.data.admins || []);
            }
        } catch (err) {
            console.error('fetchAdmins error:', err);
            setAdmins([]);
            toast.error('Failed to load administrators.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleUpdateRole = async (e) => {
        e.preventDefault();
        if (!selectedAdmin) return;
        if (!isSuperAdmin) {
            toast.error('Only Super Admin has permission to change administrator roles.');
            return;
        }
        setActionLoading(true);
        try {
            await adminApi.updateAdminRole(selectedAdmin.id, selectedRole);
            toast.success(`Updated role for ${selectedAdmin.name} to ${selectedRole}.`);
            setShowRoleModal(false);
            fetchAdmins();
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Failed to update admin role.';
            toast.error(errMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const permissionsMatrix = [
        { feature: 'Dashboard & KPI Telemetry', super_admin: true, admin: true, data_manager: true, support_admin: true },
        { feature: 'User Management & Deactivation', super_admin: true, admin: true, data_manager: false, support_admin: true },
        { feature: 'Master Railway & Station Datasets', super_admin: true, admin: true, data_manager: true, support_admin: false },
        { feature: 'Destinations & Food Guide Curation', super_admin: true, admin: true, data_manager: true, support_admin: false },
        { feature: 'AI Assistant Monitoring & Prompt Logs', super_admin: true, admin: true, data_manager: true, support_admin: false },
        { feature: 'Reports & Issue Resolution', super_admin: true, admin: true, data_manager: false, support_admin: true },
        { feature: 'System Health & Infrastructure', super_admin: true, admin: true, data_manager: false, support_admin: false },
        { feature: 'Admin Roles & RBAC Modification', super_admin: true, admin: false, data_manager: false, support_admin: false },
        { feature: 'Security Settings & 2FA Enforce', super_admin: true, admin: false, data_manager: false, support_admin: false }
    ];

    const columns = [
        {
            key: 'name',
            label: 'Administrator',
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <UserAvatar name={row.name} email={row.email} role={row.admin_role || 'admin'} size="md" showBadge />
                    <div>
                        <div className="text-xs font-bold text-[var(--color-text)]">{row.name}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'admin_role',
            label: 'Assigned Role',
            render: (role) => <StatusBadge status={role || 'admin'} size="xs" />
        },
        {
            key: 'account_status',
            label: 'Status',
            render: (s) => <StatusBadge status={s || 'active'} size="xs" />
        },
        {
            key: 'created_at',
            label: 'Added Date',
            render: (d) => (
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                    {d ? new Date(d).toLocaleDateString() : '—'}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                isSuperAdmin ? (
                    <button
                        onClick={() => {
                            setSelectedAdmin(row);
                            setSelectedRole(row.admin_role || 'admin');
                            setShowRoleModal(true);
                        }}
                        className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition cursor-pointer"
                        title="Change Admin Role & Type"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                ) : (
                    <span 
                        className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] opacity-60 cursor-not-allowed py-1 px-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                        title="Only Super Admin has permission to modify administrator roles."
                    >
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Locked</span>
                    </span>
                )
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        Admin Accounts & Role-Based Access Control (RBAC)
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Configure administrative privileges, granular permission levels, and staff credentials.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isSuperAdmin ? (
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Super Admin Mode</span>
                        </div>
                    ) : (
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>View-Only Access (Role edits restricted to Super Admin)</span>
                        </div>
                    )}
                    <button
                        onClick={fetchAdmins}
                        className="btn-secondary !h-9 !px-3 text-xs inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {!isSuperAdmin && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-500" />
                    <span>
                        <strong>Super Admin Protection Active:</strong> Only users with the <strong>Super Admin</strong> role have authority to modify administrator types or reassign RBAC privileges.
                    </span>
                </div>
            )}

            {/* Admin Accounts Table */}
            <div>
                <h3 className="text-base font-bold text-[var(--color-text)] font-heading mb-3">
                    Active Administrative Staff
                </h3>
                <DataTable
                    columns={columns}
                    data={admins}
                    loading={loading}
                    keyField="id"
                    totalRecords={admins.length}
                />
            </div>

            {/* Role Permissions Matrix Visual Guide */}
            <div className="travel-card p-6 rounded-2xl">
                <div className="mb-4">
                    <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                        Role Permissions Matrix
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Operational capabilities assigned to each administrative tier
                    </p>
                </div>

                <div className="border border-[var(--color-border)] rounded-xl overflow-x-auto">
                    <table className="travel-table text-xs">
                        <thead>
                            <tr>
                                <th className="font-bold">Feature Area</th>
                                <th className="text-center">Super Admin</th>
                                <th className="text-center">Admin</th>
                                <th className="text-center">Data Manager</th>
                                <th className="text-center">Support Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissionsMatrix.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="font-semibold">{item.feature}</td>
                                    <td className="text-center">
                                        {item.super_admin ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-rose-400 mx-auto" />}
                                    </td>
                                    <td className="text-center">
                                        {item.admin ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-rose-400 mx-auto" />}
                                    </td>
                                    <td className="text-center">
                                        {item.data_manager ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-rose-400 mx-auto" />}
                                    </td>
                                    <td className="text-center">
                                        {item.support_admin ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-rose-400 mx-auto" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Change Role Modal */}
            <Modal
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                title="Change Admin Role & Permissions"
                subtitle={`Assigning new access level for ${selectedAdmin?.name} (${selectedAdmin?.email})`}
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowRoleModal(false)}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpdateRole}
                            disabled={actionLoading}
                            className="btn-primary text-xs !h-9 !px-4"
                        >
                            {actionLoading ? 'Updating...' : 'Assign Role'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleUpdateRole} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-2">
                            Select RBAC Role
                        </label>
                        <div className="space-y-2">
                            {[
                                { id: 'super_admin', title: 'Super Admin', desc: 'Unrestricted full access across all platform modules and settings.' },
                                { id: 'admin', title: 'General Admin', desc: 'Can manage users, datasets, reports, analytics, and transport.' },
                                { id: 'data_manager', title: 'Data Manager', desc: 'Can upload and manage trains, stations, destinations, and RAG knowledge.' },
                                { id: 'support_admin', title: 'Support Admin', desc: 'Can moderate user accounts, resolve reports, and inspect support chat.' }
                            ].map((r) => (
                                <label
                                    key={r.id}
                                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                                        selectedRole === r.id
                                            ? 'bg-sky-500/10 border-sky-500/40 text-[var(--color-text)]'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-soft)]'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="adminRole"
                                        value={r.id}
                                        checked={selectedRole === r.id}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        className="mt-0.5 text-sky-500 focus:ring-sky-500"
                                    />
                                    <div>
                                        <div className="text-xs font-bold">{r.title}</div>
                                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{r.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
