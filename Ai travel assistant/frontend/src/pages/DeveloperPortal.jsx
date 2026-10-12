import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Plus, Copy, Check, Trash2, Shield, Activity, 
  Terminal, Zap, CreditCard, Sparkles, AlertCircle, 
  Clock, CheckCircle2, XCircle, ArrowUpRight, Code, Server, ChevronRight, RefreshCw, Eye, ShoppingCart, Layers
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import DeveloperPaymentModal from '../components/DeveloperPaymentModal';

export default function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState('keys'); // 'keys', 'analytics', 'docs', 'pricing'
  const [org, setOrg] = useState(null);
  const [keys, setKeys] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [creating, setCreating] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(null);

  // Developer Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentItem, setSelectedPaymentItem] = useState(null);

  // Quickstart Docs Code snippet selection
  const [docLang, setDocLang] = useState('curl'); // 'curl', 'python', 'javascript'
  const [selectedEndpoint, setSelectedEndpoint] = useState('delay'); // 'delay', 'fare', 'crowd', 'route'

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [orgRes, keysRes, usageRes] = await Promise.all([
        api.get('/developer/organization'),
        api.get('/developer/keys'),
        api.get('/developer/usage')
      ]);

      if (orgRes.data.success) setOrg(orgRes.data.organization);
      if (keysRes.data.success) setKeys(keysRes.data.keys);
      if (usageRes.data.success) setAnalytics(usageRes.data.analytics);
    } catch (err) {
      console.error('Failed to load developer portal data:', err);
      toast.error(err.response?.data?.error || 'Failed to fetch developer details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/developer/keys', { name: newKeyName });
      if (res.data.success) {
        setCreatedSecret(res.data.apiKey.raw_key);
        toast.success('API Key generated!');
        const keysRes = await api.get('/developer/keys');
        if (keysRes.data.success) setKeys(keysRes.data.keys);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to revoke this API key? Applications using it will immediately lose access.')) {
      return;
    }

    try {
      const res = await api.delete(`/developer/keys/${keyId}`);
      if (res.data.success) {
        toast.success('Key revoked');
        setKeys(keys.map(k => k.id === keyId ? { ...k, is_revoked: true } : k));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke key');
    }
  };

  const handleSelectPlan = (tier) => {
    if (tier.key === 'free') {
      if (org?.plan_tier === 'free') {
        toast.info('You are already on the Free Community plan.');
        return;
      }
      handleUpgradeTier('free');
      return;
    }

    setSelectedPaymentItem(tier);
    setShowPaymentModal(true);
  };

  const handleSelectTopUp = (pack) => {
    setSelectedPaymentItem({ ...pack, type: 'topup' });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    await fetchInitialData();
  };

  const handleUpgradeTier = async (tierKey) => {
    setUpgradingPlan(tierKey);
    try {
      const res = await api.post('/developer/subscribe', { plan_tier: tierKey });
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchInitialData();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upgrade failed');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const getCodeSnippet = () => {
    const keyPlaceholder = createdSecret || 'tiq_live_YOUR_API_KEY_HERE';
    const endpoints = {
      delay: {
        path: '/api/v1/public/predict-delay',
        body: { trainNumber: '12002', stationCode: 'NDLS' }
      },
      fare: {
        path: '/api/v1/public/predict-fare',
        body: { origin: 'NDLS', destination: 'BCT', travelClass: '3A', journeyDate: '2026-10-25' }
      },
      crowd: {
        path: '/api/v1/public/predict-crowd',
        body: { stationCode: 'NDLS', timeWindow: '18:00' }
      },
      route: {
        path: '/api/v1/public/optimize-route',
        body: { origin: 'DELHI', destination: 'MUMBAI', preference: 'fastest' }
      }
    };

    const target = endpoints[selectedEndpoint] || endpoints.delay;
    const baseUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin;

    if (docLang === 'curl') {
      return `curl -X POST "${baseUrl}${target.path}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${keyPlaceholder}" \\
  -d '${JSON.stringify(target.body)}'`;
    } else if (docLang === 'python') {
      return `import requests

url = "${baseUrl}${target.path}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${keyPlaceholder}"
}
payload = ${JSON.stringify(target.body, null, 4)}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    } else {
      return `const response = await fetch("${baseUrl}${target.path}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "${keyPlaceholder}"
  },
  body: JSON.stringify(${JSON.stringify(target.body, null, 4)})
});

const data = await response.json();
console.log(data);`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] dark:bg-[#121921] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#244C66]/20 border-t-[#244C66] dark:border-[#5A8CAE]/20 dark:border-t-[#5A8CAE] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#66737D] dark:text-[#9CAAB5]">Loading Developer Console...</p>
        </div>
      </div>
    );
  }

  const quotaPercent = org ? Math.min(100, Math.round((org.used_quota / (org.monthly_quota || 1)) * 100)) : 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FA] dark:bg-[#121921] text-[#202A32] dark:text-[#F0F4F7] transition-colors py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#244C66] via-[#1F4158] to-[#193B51] dark:from-[#1B242E] dark:via-[#18212A] dark:to-[#121921] rounded-2xl p-6 sm:p-7 text-white shadow-sm border border-[#E3E7EA] dark:border-[#293644] relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#356280]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/15 text-white border border-white/20">
                  B2B Developer Hub
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#90B9D4] font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live API v1.0
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {org?.name || 'Developer Workspace'}
              </h1>
              <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Integrate TravelIQ AI models (Delay Forecasting, Dynamic Pricing, Crowd Prediction, and Routing) directly into your apps and platforms.
              </p>
            </div>

            {/* Quota Gauge Box */}
            <div className="bg-black/25 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/15 min-w-[280px]">
              <div className="flex justify-between items-center text-xs text-white/90 mb-2 font-medium">
                <span>Monthly API Usage</span>
                <span className="text-[#90B9D4] uppercase font-bold text-[11px] px-1.5 py-0.5 rounded bg-white/10">{org?.plan_tier} tier</span>
              </div>
              
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    quotaPercent > 85 ? 'bg-rose-400' : (quotaPercent > 60 ? 'bg-amber-400' : 'bg-emerald-400')
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-white/80 mb-3">
                <span><strong>{org?.used_quota?.toLocaleString()}</strong> / {org?.monthly_quota?.toLocaleString()} calls</span>
                <span className="text-white/60">{org?.remaining_quota?.toLocaleString()} remaining</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setActiveTab('pricing');
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white text-[#244C66] hover:bg-[#EEF2F4] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Buy / Upgrade Plan
                </button>
                <button
                  onClick={() => handleSelectTopUp({
                    key: 'pack_50k',
                    name: '50,000 API Calls Booster',
                    price: '$49',
                    priceNumber: 49,
                    quotaCount: 50000,
                    quota: '+50,000 calls',
                    rateLimit: 'Boosted'
                  })}
                  className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white transition-all flex items-center gap-1 border border-white/20 cursor-pointer"
                  title="Add Extra Quota with Mock Checkout"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" /> +50k Booster
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-t border-white/10 pt-4 overflow-x-auto scrollbar-none">
            {[
              { id: 'keys', label: 'API Keys', icon: Key },
              { id: 'analytics', label: 'Usage & Telemetry', icon: Activity },
              { id: 'docs', label: 'Quickstart & Docs', icon: Code },
              { id: 'pricing', label: 'Plans & Pricing', icon: Zap }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#244C66] dark:bg-[#233240] dark:text-[#75A4C4] shadow-xs font-bold'
                      : 'text-white/80 dark:text-[#9CAAB5] hover:bg-white/10 dark:hover:bg-[#1B242E] hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: API KEYS */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-[#202A32] dark:text-[#F0F4F7]">Active API Keys</h2>
                <p className="text-xs text-[#66737D] dark:text-[#89939B]">
                  Authenticate all server-to-server requests using the <code className="px-1.5 py-0.5 rounded bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] font-mono text-[11px]">X-API-Key</code> header.
                </p>
              </div>
              <button
                onClick={() => {
                  setNewKeyName('');
                  setCreatedSecret(null);
                  setShowCreateModal(true);
                }}
                className="btn-primary h-9 text-xs font-semibold px-4 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Generate New API Key
              </button>
            </div>

            {/* Keys Table Container */}
            <div className="bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl overflow-hidden shadow-xs">
              {keys.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] flex items-center justify-center mb-3">
                    <Key className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 text-[#202A32] dark:text-[#F0F4F7]">No API Keys Generated Yet</h3>
                  <p className="text-xs text-[#66737D] dark:text-[#89939B] max-w-sm mb-4">
                    Create your first production or sandbox API key to start calling TravelIQ AI endpoints.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary h-8 text-xs font-semibold px-4 cursor-pointer"
                  >
                    Generate API Key
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E3E7EA] dark:border-[#293644] bg-[#F7F8FA] dark:bg-[#162029] text-[11px] uppercase font-semibold text-[#66737D] dark:text-[#89939B]">
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">Key Hint</th>
                        <th className="py-3 px-5">Rate Limit</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5">Last Used</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E7EA] dark:divide-[#293644]">
                      {keys.map((k) => (
                        <tr key={k.id} className="hover:bg-[#F7F8FA]/70 dark:hover:bg-[#202D3A]/50 transition-colors">
                          <td className="py-3.5 px-5 font-semibold flex items-center gap-2 text-[#202A32] dark:text-[#F0F4F7]">
                            <Key className="w-3.5 h-3.5 text-[#244C66] dark:text-[#75A4C4] opacity-70" />
                            {k.name}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EEF2F4] dark:bg-[#233240] border border-[#E3E7EA] dark:border-[#293644] text-[#244C66] dark:text-[#CAD3DA]">
                              {k.masked_key}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-[#66737D] dark:text-[#89939B]">
                            {k.rate_limit} req/min
                          </td>
                          <td className="py-3.5 px-5">
                            {k.is_revoked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                                <XCircle className="w-3 h-3" /> Revoked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-xs text-[#66737D] dark:text-[#89939B]">
                            {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {!k.is_revoked && (
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                title="Revoke Key"
                                className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USAGE & TELEMETRY */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1B242E] p-4.5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs">
                <span className="text-xs text-[#66737D] dark:text-[#89939B] font-medium">Monthly Quota Consumption</span>
                <div className="text-2xl font-bold mt-1 text-[#202A32] dark:text-[#F0F4F7]">
                  {analytics?.used_quota || 0} <span className="text-xs font-normal text-[#66737D] dark:text-[#89939B]">/ {analytics?.monthly_quota || 0}</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                  {analytics?.remaining_quota || 0} requests remaining
                </div>
              </div>

              <div className="bg-white dark:bg-[#1B242E] p-4.5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs">
                <span className="text-xs text-[#66737D] dark:text-[#89939B] font-medium">Active Subscription Plan</span>
                <div className="text-2xl font-bold mt-1 uppercase text-[#202A32] dark:text-[#F0F4F7]">
                  {org?.plan_tier}
                </div>
                <button 
                  onClick={() => setActiveTab('pricing')}
                  className="text-xs text-[#244C66] dark:text-[#75A4C4] hover:underline mt-2 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  Upgrade or Change Plan <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white dark:bg-[#1B242E] p-4.5 rounded-xl border border-[#E3E7EA] dark:border-[#293644] shadow-xs">
                <span className="text-xs text-[#66737D] dark:text-[#89939B] font-medium">API Health & Success Rate</span>
                <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  99.9%
                </div>
                <div className="text-xs text-[#66737D] dark:text-[#89939B] mt-2">
                  Average Latency ~ 84ms
                </div>
              </div>
            </div>

            {/* Recent Request Logs */}
            <div className="bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#E3E7EA] dark:border-[#293644] flex justify-between items-center bg-[#F7F8FA] dark:bg-[#162029]">
                <div>
                  <h3 className="font-bold text-sm text-[#202A32] dark:text-[#F0F4F7]">Recent Metered API Logs</h3>
                  <p className="text-xs text-[#66737D] dark:text-[#89939B]">Real-time telemetry of your incoming application requests</p>
                </div>
                <button 
                  onClick={fetchInitialData}
                  className="p-1.5 text-xs flex items-center gap-1.5 rounded-lg border border-[#E3E7EA] dark:border-[#293644] hover:bg-white dark:hover:bg-[#1B242E] text-[#202A32] dark:text-[#F0F4F7] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
                </button>
              </div>

              {(!analytics?.recent_logs || analytics.recent_logs.length === 0) ? (
                <div className="p-10 text-center text-[#66737D] dark:text-[#89939B] text-xs">
                  No requests logged in the last 30 days. Start calling the public endpoints!
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-[#F7F8FA] dark:bg-[#162029] text-[#66737D] dark:text-[#89939B] uppercase text-[11px]">
                      <tr className="border-b border-[#E3E7EA] dark:border-[#293644]">
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Key</th>
                        <th className="py-2.5 px-4">Endpoint</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E7EA] dark:divide-[#293644]">
                      {analytics.recent_logs.map(log => (
                        <tr key={log.id} className="hover:bg-[#F7F8FA]/60 dark:hover:bg-[#202D3A]/40">
                          <td className="py-3 px-4 text-[#66737D] dark:text-[#89939B]">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#202A32] dark:text-[#F0F4F7]">
                            {log.ApiKey ? log.ApiKey.name : 'Unknown Key'}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#244C66] dark:text-[#75A4C4]">
                            {log.endpoint}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                              log.status_code >= 200 && log.status_code < 300 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                            }`}>
                              {log.status_code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#66737D] dark:text-[#89939B]">
                            {log.response_time_ms ? `${log.response_time_ms}ms` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: QUICKSTART & DOCS */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left selector */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-[#202A32] dark:text-[#F0F4F7]">Select AI Model Endpoint</h3>
              <div className="space-y-2">
                {[
                  { id: 'delay', name: 'Train Delay Prediction', desc: 'Predict minute delays & probability based on weather & route history' },
                  { id: 'fare', name: 'Dynamic Fare Forecast', desc: 'Forecast future ticket price fluctuations & high demand surges' },
                  { id: 'crowd', name: 'Crowd & Occupancy Radar', desc: 'Real-time passenger density estimates across stations & bogies' },
                  { id: 'route', name: 'Intelligent Route Engine', desc: 'Multi-modal transit pathfinding optimized for cost & speed' }
                ].map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedEndpoint === ep.id
                        ? 'border-[#244C66] dark:border-[#5A8CAE] bg-[#EAF0F4] dark:bg-[#233240]'
                        : 'border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] hover:border-[#CAD3DA]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#202A32] dark:text-[#F0F4F7]">{ep.name}</div>
                    <div className="text-[11px] text-[#66737D] dark:text-[#89939B] mt-1 leading-normal">{ep.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right code snippet preview */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-1.5">
                  {['curl', 'python', 'javascript'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setDocLang(lang)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                        docLang === lang
                          ? 'bg-[#244C66] text-white dark:bg-[#356280]'
                          : 'bg-[#EEF2F4] dark:bg-[#202D3A] text-[#66737D] dark:text-[#9CAAB5]'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copyToClipboard(getCodeSnippet())}
                  className="flex items-center gap-1.5 text-xs text-[#244C66] dark:text-[#75A4C4] font-semibold hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </button>
              </div>

              <div className="bg-[#162029] text-[#F0F4F7] p-4.5 rounded-xl font-mono text-xs overflow-x-auto border border-[#293644] relative shadow-xs">
                <pre>{getCodeSnippet()}</pre>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5 flex gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <strong>Authentication Header:</strong> All API requests must include your key in either the <code className="font-mono font-bold">X-API-Key: tiq_live_...</code> header or as an <code className="font-mono font-bold">Authorization: Bearer tiq_live_...</code> token.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLANS & PRICING */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto mb-6">
              <h2 className="text-xl font-extrabold text-[#202A32] dark:text-[#F0F4F7]">Scalable Pricing for Developers & Teams</h2>
              <p className="text-xs text-[#66737D] dark:text-[#89939B] mt-1">
                Choose the quota tier that matches your production throughput. Upgrade or downgrade anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[
                {
                  key: 'free',
                  name: 'Free Community',
                  price: '$0',
                  priceNumber: 0,
                  period: 'forever',
                  quota: '100 requests/mo',
                  rateLimit: '20 req/min',
                  features: ['Core AI Predictions', 'Community Support', 'Sandbox Environment']
                },
                {
                  key: 'starter',
                  name: 'Developer Starter',
                  price: '$29',
                  priceNumber: 29,
                  period: 'per month',
                  quota: '2,500 requests/mo',
                  rateLimit: '60 req/min',
                  features: ['All AI Model Endpoints', 'Email Support', 'Up to 3 API Keys', 'Basic Telemetry']
                },
                {
                  key: 'pro',
                  name: 'Business Pro',
                  price: '$99',
                  priceNumber: 99,
                  period: 'per month',
                  popular: true,
                  quota: '15,000 requests/mo',
                  rateLimit: '180 req/min',
                  features: ['High Throughput', 'Priority 24/7 SLA', 'Up to 10 API Keys', 'Detailed Telemetry & Logs']
                },
                {
                  key: 'enterprise',
                  name: 'Enterprise Scale',
                  price: '$499',
                  priceNumber: 499,
                  period: 'per month',
                  quota: '100,000 requests/mo',
                  rateLimit: '600 req/min',
                  features: ['Custom Dedicated Models', 'Unlimited API Keys', 'Dedicated Account Manager', 'Custom SLA Guarantee']
                }
              ].map(tier => {
                const isCurrent = org?.plan_tier === tier.key;
                return (
                  <div
                    key={tier.key}
                    className={`relative rounded-2xl p-5 flex flex-col justify-between border transition-all ${
                      tier.popular
                        ? 'border-[#244C66] dark:border-[#5A8CAE] bg-white dark:bg-[#1B242E] shadow-sm ring-1 ring-[#244C66] dark:ring-[#5A8CAE]'
                        : 'border-[#E3E7EA] dark:border-[#293644] bg-white dark:bg-[#1B242E] shadow-xs'
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#244C66] text-white dark:bg-[#5A8CAE] dark:text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h3 className="font-bold text-sm text-[#202A32] dark:text-[#F0F4F7]">{tier.name}</h3>
                      <div className="my-3">
                        <span className="text-2xl font-extrabold text-[#202A32] dark:text-[#F0F4F7]">{tier.price}</span>
                        <span className="text-xs text-[#66737D] dark:text-[#89939B] ml-1">/{tier.period}</span>
                      </div>

                      <div className="space-y-1.5 py-3 border-y border-[#E3E7EA] dark:border-[#293644] text-xs">
                        <div className="font-semibold text-[#244C66] dark:text-[#75A4C4]">
                          ⚡ {tier.quota}
                        </div>
                        <div className="text-[#66737D] dark:text-[#89939B]">
                          ⏱️ {tier.rateLimit}
                        </div>
                      </div>

                      <ul className="space-y-2 my-4 text-xs text-[#66737D] dark:text-[#89939B]">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      disabled={isCurrent || upgradingPlan === tier.key}
                      onClick={() => handleSelectPlan(tier)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#EEF2F4] dark:bg-[#202D3A] text-[#66737D] dark:text-[#89939B] cursor-default'
                          : tier.popular
                          ? 'bg-[#244C66] text-white hover:bg-[#193B51] dark:bg-[#5A8CAE] dark:hover:bg-[#356280] shadow-xs'
                          : 'bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] hover:bg-[#244C66] hover:text-white dark:hover:bg-[#5A8CAE]'
                      }`}
                    >
                      {isCurrent ? (
                        'Active Plan'
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          {tier.key === 'free' ? 'Switch to Free' : `Subscribe ${tier.name}`}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quota Booster Add-On Packs */}
            <div className="mt-8 pt-6 border-t border-[#E3E7EA] dark:border-[#293644]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      ⚡ On-Demand Top-Ups
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Instant Allocation</span>
                  </div>
                  <h3 className="text-base font-bold mt-1 text-[#202A32] dark:text-[#F0F4F7]">
                    API Quota Booster Packs
                  </h3>
                  <p className="text-xs text-[#66737D] dark:text-[#89939B]">
                    Need extra throughput this month without changing your subscription? Purchase extra calls on-demand.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    key: 'pack_10k',
                    name: '10,000 API Calls Booster',
                    price: '$15',
                    priceNumber: 15,
                    quotaCount: 10000,
                    quota: '+10,000 calls',
                    desc: 'Great for short test sprints and prototype launches.',
                    rateLimit: 'Standard queue'
                  },
                  {
                    key: 'pack_50k',
                    name: '50,000 API Calls Booster',
                    price: '$49',
                    priceNumber: 49,
                    quotaCount: 50000,
                    quota: '+50,000 calls',
                    popular: true,
                    desc: 'Perfect for seasonal marketing spikes and heavy traffic.',
                    rateLimit: 'Priority API queue'
                  },
                  {
                    key: 'pack_200k',
                    name: '200,000 API Calls Booster',
                    price: '$149',
                    priceNumber: 149,
                    quotaCount: 200000,
                    quota: '+200,000 calls',
                    desc: 'Enterprise high-throughput top-up with zero rate degradation.',
                    rateLimit: 'High-concurrency VIP'
                  }
                ].map((pack) => (
                  <div
                    key={pack.key}
                    className={`rounded-2xl p-5 bg-white dark:bg-[#1B242E] border transition-all flex flex-col justify-between ${
                      pack.popular 
                        ? 'border-amber-400 dark:border-amber-500/60 shadow-xs ring-1 ring-amber-400' 
                        : 'border-[#E3E7EA] dark:border-[#293644]'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-xs text-[#202A32] dark:text-[#F0F4F7]">{pack.name}</h4>
                        {pack.popular && (
                          <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Best Value
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-xl font-black text-[#202A32] dark:text-[#F0F4F7]">{pack.price}</span>
                        <span className="text-[10px] text-[#66737D] dark:text-[#89939B]">one-time</span>
                      </div>
                      <p className="text-xs text-[#66737D] dark:text-[#89939B] mb-3">{pack.desc}</p>
                      
                      <div className="bg-[#F7F8FA] dark:bg-[#162029] p-3 rounded-lg border border-[#E3E7EA] dark:border-[#293644] text-xs space-y-1 mb-4">
                        <div className="flex justify-between font-semibold text-[#202A32] dark:text-[#F0F4F7]">
                          <span>⚡ Calls Added:</span>
                          <span>{pack.quotaCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#66737D] dark:text-[#89939B] text-[11px]">
                          <span>⏱️ Priority:</span>
                          <span>{pack.rateLimit}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectTopUp(pack)}
                      className="btn-primary h-9 text-xs font-semibold w-full cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Buy Booster (Mock Pay)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CREATE API KEY MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-2xl p-6 max-w-md w-full shadow-xl relative"
            >
              {!createdSecret ? (
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2F4] dark:bg-[#233240] text-[#244C66] dark:text-[#75A4C4] flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#202A32] dark:text-[#F0F4F7]">Generate API Key</h3>
                      <p className="text-xs text-[#66737D] dark:text-[#89939B]">Create a key to authenticate external API calls.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#202A32] dark:text-[#F0F4F7]">Key Description / Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production iOS App, Node Backend"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="travel-input"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary h-8.5 text-xs font-semibold px-3 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="btn-primary h-8.5 text-xs font-semibold px-4 cursor-pointer"
                    >
                      {creating ? 'Generating...' : 'Create Key'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-base text-[#202A32] dark:text-[#F0F4F7]">Save Your API Key</h3>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      ⚠️ Copy this key now! You will NOT be able to view it again.
                    </p>
                  </div>

                  <div className="bg-[#162029] text-[#F0F4F7] p-3 rounded-lg font-mono text-xs break-all flex items-center justify-between gap-2 border border-[#293644]">
                    <span>{createdSecret}</span>
                    <button
                      onClick={() => copyToClipboard(createdSecret)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-white shrink-0 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedSecret(null);
                    }}
                    className="btn-primary h-9 w-full text-xs font-bold cursor-pointer"
                  >
                    I Have Saved My Secret Key
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DEVELOPER PAYMENT MODAL */}
      <DeveloperPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedPaymentItem(null);
        }}
        item={selectedPaymentItem}
        org={org}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
