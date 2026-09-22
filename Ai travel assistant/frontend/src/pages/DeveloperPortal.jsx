import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Plus, Copy, Check, Trash2, Shield, Activity, 
  Terminal, Zap, CreditCard, Sparkles, AlertCircle, 
  Clock, CheckCircle2, XCircle, ArrowUpRight, Code, Server, ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

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
        // Refresh keys list
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

  const handleUpgradeTier = async (tierKey) => {
    setUpgradingPlan(tierKey);
    try {
      const res = await api.post('/developer/subscribe', { plan_tier: tierKey });
      if (res.data.success) {
        toast.success(res.data.message);
        // Refresh data
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
        body: { train_number: '12004', route: 'NDLS-LKO', day_of_week: 'Monday', weather: 'Clear' }
      },
      fare: {
        path: '/api/v1/public/predict-fare',
        body: { source: 'New Delhi', destination: 'Varanasi', travel_class: '3A', travel_date: '2026-10-15' }
      },
      crowd: {
        path: '/api/v1/public/predict-crowd',
        body: { station_code: 'NDLS', time_slot: '18:00-20:00' }
      },
      route: {
        path: '/api/v1/public/recommend-route',
        body: { source: 'Mumbai', destination: 'Goa', preferences: { fastest: true, scenic: true } }
      }
    };

    const target = endpoints[selectedEndpoint];
    const origin = window.location.origin;

    if (docLang === 'curl') {
      return `curl -X POST "${origin}${target.path}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${keyPlaceholder}" \\
  -d '${JSON.stringify(target.body, null, 2)}'`;
    }

    if (docLang === 'python') {
      return `import requests

url = "${origin}${target.path}"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${keyPlaceholder}"
}
payload = ${JSON.stringify(target.body, null, 4)}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    }

    if (docLang === 'javascript') {
      return `const response = await fetch("${origin}${target.path}", {
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
      <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#173F3A]/20 border-t-[#173F3A] dark:border-[#EEF2ED]/20 dark:border-t-[#EEF2ED] rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#66736F] dark:text-[#A3B0AB]">Loading Developer Console...</p>
        </div>
      </div>
    );
  }

  const quotaPercent = org ? Math.min(100, Math.round((org.used_quota / (org.monthly_quota || 1)) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] transition-colors py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#173F3A] to-[#214F49] dark:from-[#1B2C28] dark:to-[#162723] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#EEF2ED]/20 text-[#EEF2ED] border border-white/20">
                  B2B Developer Hub
                </span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live API v1.0
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {org?.name || 'Developer Workspace'}
              </h1>
              <p className="text-white/80 text-sm mt-1 max-w-xl">
                Integrate TravelIQ AI models (Delay Forecasting, Dynamic Pricing, Crowd Prediction, and Routing) directly into your apps and platforms.
              </p>
            </div>

            {/* Quota Gauge */}
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 min-w-[280px]">
              <div className="flex justify-between items-center text-xs text-white/90 mb-2 font-medium">
                <span>Monthly API Usage</span>
                <span className="text-emerald-300 uppercase font-semibold">{org?.plan_tier} tier</span>
              </div>
              
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    quotaPercent > 85 ? 'bg-rose-400' : (quotaPercent > 60 ? 'bg-amber-400' : 'bg-emerald-400')
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-white/80">
                <span><strong>{org?.used_quota?.toLocaleString()}</strong> / {org?.monthly_quota?.toLocaleString()} calls</span>
                <span>{org?.remaining_quota?.toLocaleString()} remaining</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-t border-white/10 pt-4 overflow-x-auto">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-[#173F3A] shadow-md font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: API KEYS */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold">Active API Keys</h2>
                <p className="text-xs sm:text-sm text-[#66736F] dark:text-[#A3B0AB]">
                  Authenticate all server-to-server requests using the <code className="px-1.5 py-0.5 rounded bg-[#E3DED2] dark:bg-[#1B2C28] text-xs font-mono">X-API-Key</code> header.
                </p>
              </div>
              <button
                onClick={() => {
                  setNewKeyName('');
                  setCreatedSecret(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-[#173F3A] hover:bg-[#214F49] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] dark:hover:bg-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all"
              >
                <Plus className="w-4 h-4" /> Generate New API Key
              </button>
            </div>

            {/* Keys Table / Cards */}
            <div className="bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl overflow-hidden shadow-sm">
              {keys.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF2ED] dark:bg-[#12201D] text-[#173F3A] dark:text-[#EEF2ED] flex items-center justify-center mb-3">
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-base mb-1">No API Keys Generated Yet</h3>
                  <p className="text-xs sm:text-sm text-[#66736F] dark:text-[#A3B0AB] max-w-sm mb-4">
                    Create your first production or sandbox API key to start calling TravelIQ AI endpoints.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#173F3A] text-white px-4 py-2 rounded-xl text-xs font-semibold"
                  >
                    Generate API Key
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#162723] text-xs uppercase font-medium text-[#66736F] dark:text-[#A3B0AB]">
                        <th className="py-3.5 px-6">Name</th>
                        <th className="py-3.5 px-6">Key Hint</th>
                        <th className="py-3.5 px-6">Rate Limit</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Last Used</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                      {keys.map((k) => (
                        <tr key={k.id} className="hover:bg-[#F7F5EF]/50 dark:hover:bg-[#213530]/50 transition-colors">
                          <td className="py-4 px-6 font-semibold flex items-center gap-2">
                            <Key className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED] opacity-60" />
                            {k.name}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-xs px-2 py-1 rounded bg-[#EEF2ED] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A]">
                              {k.masked_key}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-[#66736F] dark:text-[#A3B0AB]">
                            {k.rate_limit} req/min
                          </td>
                          <td className="py-4 px-6">
                            {k.is_revoked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                                <XCircle className="w-3 h-3" /> Revoked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-xs text-[#66736F] dark:text-[#A3B0AB]">
                            {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {!k.is_revoked && (
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                title="Revoke Key"
                                className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-[#1B2C28] p-5 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm">
                <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Monthly Quota Consumption</span>
                <div className="text-2xl font-bold mt-1 text-[#173F3A] dark:text-[#EEF2ED]">
                  {analytics?.used_quota || 0} <span className="text-sm font-normal text-[#66736F] dark:text-[#A3B0AB]">/ {analytics?.monthly_quota || 0}</span>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                  {analytics?.remaining_quota || 0} requests remaining
                </div>
              </div>

              <div className="bg-white dark:bg-[#1B2C28] p-5 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm">
                <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">Active Subscription Plan</span>
                <div className="text-2xl font-bold mt-1 uppercase text-[#173F3A] dark:text-[#EEF2ED]">
                  {org?.plan_tier}
                </div>
                <button 
                  onClick={() => setActiveTab('pricing')}
                  className="text-xs text-[#173F3A] dark:text-[#EEF2ED] underline mt-2 flex items-center gap-1 font-semibold"
                >
                  Upgrade or Change Plan <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white dark:bg-[#1B2C28] p-5 rounded-2xl border border-[#E3DED2] dark:border-[#2A403A] shadow-sm">
                <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-medium">API Health & Success Rate</span>
                <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  99.9%
                </div>
                <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-2">
                  Average Latency ~ 84ms
                </div>
              </div>
            </div>

            {/* Recent Request Logs */}
            <div className="bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-[#E3DED2] dark:border-[#2A403A] flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm">Recent Metered API Logs</h3>
                  <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Real-time telemetry of your incoming application requests</p>
                </div>
                <button 
                  onClick={fetchInitialData}
                  className="p-2 text-xs flex items-center gap-1.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#F7F5EF] dark:hover:bg-[#162723]"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
                </button>
              </div>

              {(!analytics?.recent_logs || analytics.recent_logs.length === 0) ? (
                <div className="p-10 text-center text-[#66736F] dark:text-[#A3B0AB] text-sm">
                  No requests logged in the last 30 days. Start calling the public endpoints!
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-[#F7F5EF] dark:bg-[#162723] text-[#66736F] dark:text-[#A3B0AB] uppercase">
                      <tr className="border-b border-[#E3DED2] dark:border-[#2A403A]">
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Key</th>
                        <th className="py-2.5 px-4">Endpoint</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                      {analytics.recent_logs.map(log => (
                        <tr key={log.id} className="hover:bg-[#F7F5EF]/50 dark:hover:bg-[#213530]/50">
                          <td className="py-3 px-4 text-[#66736F] dark:text-[#A3B0AB]">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {log.ApiKey ? log.ApiKey.name : 'Unknown Key'}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold">
                            {log.endpoint}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono font-semibold ${
                              log.status_code >= 200 && log.status_code < 300 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {log.status_code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#66736F] dark:text-[#A3B0AB]">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left selector */}
            <div className="space-y-4">
              <h3 className="font-bold text-base">Select AI Model Endpoint</h3>
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
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedEndpoint === ep.id
                        ? 'border-[#173F3A] dark:border-[#EEF2ED] bg-[#EEF2ED] dark:bg-[#213530]'
                        : 'border-[#E3DED2] dark:border-[#2A403A] bg-white dark:bg-[#1B2C28] hover:border-[#173F3A]'
                    }`}
                  >
                    <div className="font-semibold text-sm">{ep.name}</div>
                    <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1">{ep.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right code snippet preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {['curl', 'python', 'javascript'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setDocLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        docLang === lang
                          ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A]'
                          : 'bg-[#E3DED2] dark:bg-[#2A403A] text-[#66736F] dark:text-[#A3B0AB]'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => copyToClipboard(getCodeSnippet())}
                  className="flex items-center gap-1.5 text-xs text-[#173F3A] dark:text-[#EEF2ED] font-semibold hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </button>
              </div>

              <div className="bg-[#12201D] text-[#EEF2ED] p-5 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-[#2A403A] relative">
                <pre>{getCodeSnippet()}</pre>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong>Authentication Header:</strong> All API requests must include your key in either the <code className="font-mono font-bold">X-API-Key: tiq_live_...</code> header or as a <code className="font-mono font-bold">Authorization: Bearer tiq_live_...</code> token.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLANS & PRICING */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl font-bold">Scalable Pricing for Developers & Enterprises</h2>
              <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] mt-1">
                Choose the quota tier that matches your production throughput. Upgrade or downgrade anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  key: 'free',
                  name: 'Free Community',
                  price: '$0',
                  period: 'forever',
                  quota: '100 requests/mo',
                  rateLimit: '20 req/min',
                  features: ['Core AI Predictions', 'Community Support', 'Sandbox Environment']
                },
                {
                  key: 'starter',
                  name: 'Developer Starter',
                  price: '$29',
                  period: 'per month',
                  quota: '2,500 requests/mo',
                  rateLimit: '60 req/min',
                  features: ['All AI Model Endpoints', 'Email Support', 'Up to 3 API Keys', 'Basic Telemetry']
                },
                {
                  key: 'pro',
                  name: 'Business Pro',
                  price: '$99',
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
                    className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all ${
                      tier.popular
                        ? 'border-[#173F3A] dark:border-[#EEF2ED] bg-white dark:bg-[#1B2C28] shadow-xl ring-2 ring-[#173F3A] dark:ring-[#EEF2ED]'
                        : 'border-[#E3DED2] dark:border-[#2A403A] bg-white dark:bg-[#1B2C28] shadow-sm'
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h3 className="font-bold text-lg">{tier.name}</h3>
                      <div className="my-4">
                        <span className="text-3xl font-extrabold">{tier.price}</span>
                        <span className="text-xs text-[#66736F] dark:text-[#A3B0AB] ml-1">/{tier.period}</span>
                      </div>

                      <div className="space-y-2 py-4 border-y border-[#E3DED2] dark:border-[#2A403A] text-xs">
                        <div className="font-semibold text-[#173F3A] dark:text-[#EEF2ED]">
                          ⚡ {tier.quota}
                        </div>
                        <div className="text-[#66736F] dark:text-[#A3B0AB]">
                          ⏱️ {tier.rateLimit}
                        </div>
                      </div>

                      <ul className="space-y-2.5 my-6 text-xs text-[#66736F] dark:text-[#A3B0AB]">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      disabled={isCurrent || upgradingPlan === tier.key}
                      onClick={() => handleUpgradeTier(tier.key)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#E3DED2] dark:bg-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] cursor-default'
                          : tier.popular
                          ? 'bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] hover:opacity-90 shadow-md'
                          : 'bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] hover:bg-[#173F3A] hover:text-white'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : (upgradingPlan === tier.key ? 'Activating...' : `Subscribe ${tier.name}`)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* CREATE API KEY MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
            >
              {!createdSecret ? (
                <form onSubmit={handleCreateKey} className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#EEF2ED] dark:bg-[#12201D] text-[#173F3A] dark:text-[#EEF2ED] flex items-center justify-center">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Generate API Key</h3>
                      <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Create a key to authenticate external API calls.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Key Description / Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production iOS App, Node Backend"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] text-sm focus:outline-none focus:ring-2 focus:ring-[#173F3A]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] px-5 py-2 rounded-xl text-xs font-semibold shadow"
                    >
                      {creating ? 'Generating...' : 'Create Key'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">Save Your API Key</h3>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      ⚠️ Copy this key now! You will NOT be able to view it again.
                    </p>
                  </div>

                  <div className="bg-[#12201D] text-[#EEF2ED] p-3.5 rounded-xl font-mono text-xs break-all flex items-center justify-between gap-2 border border-[#2A403A]">
                    <span>{createdSecret}</span>
                    <button
                      onClick={() => copyToClipboard(createdSecret)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white flex-shrink-0"
                    >
                      {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedSecret(null);
                    }}
                    className="w-full bg-[#173F3A] text-white dark:bg-[#EEF2ED] dark:text-[#173F3A] py-2.5 rounded-xl text-xs font-bold shadow"
                  >
                    I Have Saved My Secret Key
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
