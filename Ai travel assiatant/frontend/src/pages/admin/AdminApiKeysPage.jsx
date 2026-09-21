import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Shield, Building2, Search, Edit3, CheckCircle2, 
  XCircle, RefreshCw, Sliders
} from 'lucide-react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminApiKeysPage() {
  const [activeTab, setActiveTab] = useState('keys'); // 'keys' or 'organizations'
  const [keys, setKeys] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Modals
  const [editingKey, setEditingKey] = useState(null);
  const [keyFormData, setKeyFormData] = useState({ name: '', rate_limit_per_minute: 60, is_revoked: false });
  const [savingKey, setSavingKey] = useState(false);

  const [editingOrg, setEditingOrg] = useState(null);
  const [orgFormData, setOrgFormData] = useState({ plan_tier: 'free', monthly_quota: 100, is_active: true });
  const [savingOrg, setSavingOrg] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [keysRes, orgsRes] = await Promise.all([
        api.get('/admin/developer/keys'),
        api.get('/admin/developer/organizations')
      ]);

      if (keysRes.data.success) setKeys(keysRes.data.keys);
      if (orgsRes.data.success) setOrganizations(orgsRes.data.organizations);
    } catch (err) {
      console.error('Failed to fetch admin API data:', err);
      toast.error(err.response?.data?.error || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditKeySubmit = async (e) => {
    e.preventDefault();
    if (!editingKey) return;
    setSavingKey(true);
    try {
      const res = await api.put(`/admin/developer/keys/${editingKey.id}`, keyFormData);
      if (res.data.success) {
        toast.success('API Key updated successfully');
        setKeys(keys.map(k => k.id === editingKey.id ? { ...k, ...keyFormData, rate_limit: keyFormData.rate_limit_per_minute } : k));
        setEditingKey(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update API key');
    } finally {
      setSavingKey(false);
    }
  };

  const handleEditOrgSubmit = async (e) => {
    e.preventDefault();
    if (!editingOrg) return;
    setSavingOrg(true);
    try {
      const res = await api.put(`/admin/developer/organizations/${editingOrg.id}`, orgFormData);
      if (res.data.success) {
        toast.success('Organization updated successfully');
        setOrganizations(organizations.map(o => o.id === editingOrg.id ? { ...o, ...orgFormData } : o));
        setEditingOrg(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update organization');
    } finally {
      setSavingOrg(false);
    }
  };

  const filteredKeys = keys.filter(k => 
    k.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.organization?.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.key_hint?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrgs = organizations.filter(o => 
    o.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.User?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.plan_tier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <div className="w-9 h-9 border-[3px] border-[#E3DED2] dark:border-[#2A403A] border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-[#66736F] dark:text-[#A3B0AB]">Loading Admin API Governance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Admin Governance
            </span>
            <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1 font-medium">
              <Shield className="w-3.5 h-3.5 text-purple-500" /> Full System API Authority
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
            API Keys & Organization Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-[#66736F] dark:text-[#A3B0AB]">
            Admins have full enterprise access and can adjust rate limits, grant quotas, and manage any client key across the platform.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-[var(--color-soft)] hover:bg-[var(--color-border)] transition border border-[var(--color-border)] self-start lg:self-center shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Total Organizations</div>
          <div className="text-2xl font-bold mt-1 text-[var(--color-text)]">{organizations.length}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Total API Keys</div>
          <div className="text-2xl font-bold mt-1 text-[var(--color-text)]">{keys.length}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Active Keys</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {keys.filter(k => !k.is_revoked).length}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-5 rounded-2xl shadow-sm">
          <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Revoked Keys</div>
          <div className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
            {keys.filter(k => k.is_revoked).length}
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('keys')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'keys'
                ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] shadow-sm'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[#66736F] dark:text-[#A3B0AB] hover:text-[var(--color-text)]'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> All API Keys ({keys.length})
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'organizations'
                ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] shadow-sm'
                : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[#66736F] dark:text-[#A3B0AB] hover:text-[var(--color-text)]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Organizations & Tiers ({organizations.length})
          </button>
        </div>

        <div className="relative min-w-[260px] max-w-sm w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB]" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'keys' ? 'keys, owner, org...' : 'organizations, user, tier...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[#173F3A]"
          />
        </div>
      </div>

      {/* TAB 1: ALL API KEYS TABLE */}
      {activeTab === 'keys' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-soft)] text-[#66736F] dark:text-[#A3B0AB] uppercase">
                  <th className="py-3.5 px-5 font-semibold">Key Name / Hint</th>
                  <th className="py-3.5 px-5 font-semibold">Organization & Owner</th>
                  <th className="py-3.5 px-5 font-semibold">Rate Limit</th>
                  <th className="py-3.5 px-5 font-semibold">Status</th>
                  <th className="py-3.5 px-5 font-semibold">Last Used</th>
                  <th className="py-3.5 px-5 font-semibold text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-[#66736F] dark:text-[#A3B0AB]">
                      No API keys matched your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-[var(--color-soft)]/50 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-sm flex items-center gap-1.5 text-[var(--color-text)]">
                          <Key className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>{k.name}</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#66736F] dark:text-[#A3B0AB] mt-0.5">
                          {k.masked_key}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[var(--color-text)]">
                          {k.organization?.name || 'Workspace'}
                        </div>
                        <div className="text-[11px] text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1 mt-0.5">
                          <span>{k.organization?.owner?.email || 'N/A'}</span>
                          {k.organization?.owner?.role?.toLowerCase() === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[9px]">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[var(--color-text)]">
                        {k.rate_limit} req/min
                      </td>
                      <td className="py-3.5 px-5">
                        {k.is_revoked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                            <XCircle className="w-3 h-3" /> Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-[#66736F] dark:text-[#A3B0AB]">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3.5 px-5 text-right pr-6">
                        <button
                          onClick={() => {
                            setEditingKey(k);
                            setKeyFormData({
                              name: k.name,
                              rate_limit_per_minute: k.rate_limit,
                              is_revoked: k.is_revoked
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-soft)] text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-500" /> Edit Key
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATIONS & TIERS TABLE */}
      {activeTab === 'organizations' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-soft)] text-[#66736F] dark:text-[#A3B0AB] uppercase">
                  <th className="py-3.5 px-5 font-semibold">Organization</th>
                  <th className="py-3.5 px-5 font-semibold">Owner</th>
                  <th className="py-3.5 px-5 font-semibold">Plan Tier</th>
                  <th className="py-3.5 px-5 font-semibold">Quota Usage</th>
                  <th className="py-3.5 px-5 font-semibold">Status</th>
                  <th className="py-3.5 px-5 font-semibold text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-[#66736F] dark:text-[#A3B0AB]">
                      No organizations matched your filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((o) => (
                    <tr key={o.id} className="hover:bg-[var(--color-soft)]/50 transition">
                      <td className="py-3.5 px-5 font-semibold text-sm">
                        <div className="flex items-center gap-2 text-[var(--color-text)]">
                          <Building2 className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED] opacity-70 shrink-0" />
                          <span>{o.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[var(--color-text)]">{o.User?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">{o.User?.email}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                          o.plan_tier === 'enterprise' 
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : 'bg-[#EEF2ED] dark:bg-[#12201D] text-[var(--color-text)] border-[var(--color-border)]'
                        }`}>
                          {o.plan_tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[var(--color-text)]">
                          {o.used_quota?.toLocaleString()} / {o.monthly_quota?.toLocaleString()}
                        </div>
                        <div className="w-28 bg-[var(--color-border)] h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.round((o.used_quota / (o.monthly_quota || 1)) * 100))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {o.is_active ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right pr-6">
                        <button
                          onClick={() => {
                            setEditingOrg(o);
                            setOrgFormData({
                              plan_tier: o.plan_tier,
                              monthly_quota: o.monthly_quota,
                              is_active: o.is_active
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-soft)] text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition"
                        >
                          <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Manage Tier
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT KEY MODAL */}
      <AnimatePresence>
        {editingKey && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <form onSubmit={handleEditKeySubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--color-text)]">Admin: Edit API Key</h3>
                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Modify rate limits, label, or active state.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text)]">Key Label / Name</label>
                  <input
                    type="text"
                    required
                    value={keyFormData.name}
                    onChange={(e) => setKeyFormData({ ...keyFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[#173F3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text)]">Rate Limit (requests per minute)</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    required
                    value={keyFormData.rate_limit_per_minute}
                    onChange={(e) => setKeyFormData({ ...keyFormData, rate_limit_per_minute: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[#173F3A]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_revoked_check"
                    checked={keyFormData.is_revoked}
                    onChange={(e) => setKeyFormData({ ...keyFormData, is_revoked: e.target.checked })}
                    className="rounded border-[var(--color-border)] text-[#173F3A]"
                  />
                  <label htmlFor="is_revoked_check" className="text-xs font-medium cursor-pointer text-[var(--color-text)]">
                    Revoke / Deactivate this API Key
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    className="px-4 py-2 text-xs font-semibold hover:bg-[var(--color-soft)] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingKey}
                    className="bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] px-4 py-2 text-xs font-semibold rounded-xl shadow"
                  >
                    {savingKey ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ORGANIZATION MODAL */}
      <AnimatePresence>
        {editingOrg && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <form onSubmit={handleEditOrgSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--color-text)]">Admin: Manage Organization Tier</h3>
                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Change plan tier or monthly request quota.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text)]">Plan Tier</label>
                  <select
                    value={orgFormData.plan_tier}
                    onChange={(e) => {
                      const tier = e.target.value;
                      const quotaMap = { free: 100, starter: 2500, pro: 15000, enterprise: 1000000 };
                      setOrgFormData({
                        ...orgFormData,
                        plan_tier: tier,
                        monthly_quota: quotaMap[tier] || orgFormData.monthly_quota
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[#173F3A]"
                  >
                    <option value="free">Free Starter (100 req/mo)</option>
                    <option value="starter">Developer Starter (2,500 req/mo)</option>
                    <option value="pro">Business Pro (15,000 req/mo)</option>
                    <option value="enterprise">Enterprise Super Admin (1,000,000 req/mo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text)]">Custom Monthly Quota</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={orgFormData.monthly_quota}
                    onChange={(e) => setOrgFormData({ ...orgFormData, monthly_quota: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[#173F3A]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="org_active_check"
                    checked={orgFormData.is_active}
                    onChange={(e) => setOrgFormData({ ...orgFormData, is_active: e.target.checked })}
                    className="rounded border-[var(--color-border)] text-[#173F3A]"
                  />
                  <label htmlFor="org_active_check" className="text-xs font-medium cursor-pointer text-[var(--color-text)]">
                    Organization Workspace is Active
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setEditingOrg(null)}
                    className="px-4 py-2 text-xs font-semibold hover:bg-[var(--color-soft)] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOrg}
                    className="bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] px-4 py-2 text-xs font-semibold rounded-xl shadow"
                  >
                    {savingOrg ? 'Saving...' : 'Apply Tier'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
