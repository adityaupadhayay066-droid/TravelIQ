import React, { useState } from 'react';
import { 
    Settings, Shield, Lock, Bell, Server, 
    Sparkles, Key, Check, Save, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('security');

    // Security Settings
    const [twoFactorAdmin, setTwoFactorAdmin] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState('120');
    const [maxFailedAttempts, setMaxFailedAttempts] = useState('5');
    const [ipWhitelist, setIpWhitelist] = useState('127.0.0.1, 192.168.1.0/24');

    // Platform Settings
    const [platformName, setPlatformName] = useState('TravelIQ AI Travel Assistant');
    const [supportEmail, setSupportEmail] = useState('support@traveliq.com');
    const [defaultCurrency, setDefaultCurrency] = useState('INR (₹)');
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // AI & External APIs
    const [aiServiceUrl, setAiServiceUrl] = useState('http://localhost:8000');
    const [ragSimilarityThreshold, setRagSimilarityThreshold] = useState('0.82');
    const [irctcSyncFrequency, setIrctcSyncFrequency] = useState('Every 6 hours');

    const [saving, setSaving] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            setSaving(false);
            toast.success('Admin platform settings updated successfully.');
        }, 500);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        Admin & System Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Configure security policies, session longevity, AI endpoints, and platform metadata.
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary !h-9 !px-5 text-xs inline-flex items-center gap-2"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Settings Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto scrollbar-none">
                {[
                    { id: 'security', label: 'Security & Access', icon: Shield },
                    { id: 'general', label: 'Platform & Identity', icon: Settings },
                    { id: 'ai_apis', label: 'AI & External Services', icon: Sparkles }
                ].map((t) => {
                    const Icon = t.icon;
                    const isSel = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                isSel
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-soft)]'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="space-y-6">
                {/* 1. Security Settings */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <div className="travel-card p-6 rounded-2xl space-y-5">
                            <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                                Authentication & Session Policies
                            </h3>

                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-soft)]/40 border border-[var(--color-border)] cursor-pointer">
                                    <div>
                                        <div className="text-xs font-bold text-[var(--color-text)]">
                                            Enforce 2-Factor Authentication for Admins
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                                            Require OTP/Authenticator app code on every admin portal login
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={twoFactorAdmin}
                                        onChange={(e) => setTwoFactorAdmin(e.target.checked)}
                                        className="w-4 h-4 text-sky-500 rounded focus:ring-sky-500"
                                    />
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                            Session Inactivity Timeout (Minutes)
                                        </label>
                                        <input
                                            type="number"
                                            value={sessionTimeout}
                                            onChange={(e) => setSessionTimeout(e.target.value)}
                                            className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                            Account Lockout Failed Attempts
                                        </label>
                                        <input
                                            type="number"
                                            value={maxFailedAttempts}
                                            onChange={(e) => setMaxFailedAttempts(e.target.value)}
                                            className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                        Admin IP Whitelist (Comma-separated CIDRs)
                                    </label>
                                    <input
                                        type="text"
                                        value={ipWhitelist}
                                        onChange={(e) => setIpWhitelist(e.target.value)}
                                        className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                    />
                                    <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                                        Leave empty to allow logins from any network with valid admin credentials.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Platform & General */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="travel-card p-6 rounded-2xl space-y-5">
                            <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                                Platform General Configuration
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                        Application Brand Title
                                    </label>
                                    <input
                                        type="text"
                                        value={platformName}
                                        onChange={(e) => setPlatformName(e.target.value)}
                                        className="travel-input !h-10 !text-xs !rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                        Support Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={supportEmail}
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        className="travel-input !h-10 !text-xs !rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                        Default Base Currency
                                    </label>
                                    <input
                                        type="text"
                                        value={defaultCurrency}
                                        onChange={(e) => setDefaultCurrency(e.target.value)}
                                        className="travel-input !h-10 !text-xs !rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                        Platform Maintenance Mode
                                    </label>
                                    <select
                                        value={maintenanceMode ? 'true' : 'false'}
                                        onChange={(e) => setMaintenanceMode(e.target.value === 'true')}
                                        className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none"
                                    >
                                        <option value="false">🟢 Live (Normal Operations)</option>
                                        <option value="true">🟡 Maintenance Mode (Admins Only)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. AI & APIs */}
                {activeTab === 'ai_apis' && (
                    <div className="space-y-6">
                        <div className="travel-card p-6 rounded-2xl space-y-5">
                            <h3 className="text-base font-bold text-[var(--color-text)] font-heading">
                                AI Service & Microservice Integrations
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                        FastAPI AI Service Microservice Endpoint
                                    </label>
                                    <input
                                        type="text"
                                        value={aiServiceUrl}
                                        onChange={(e) => setAiServiceUrl(e.target.value)}
                                        className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                            RAG Vector Similarity Cutoff (Cosine)
                                        </label>
                                        <input
                                            type="text"
                                            value={ragSimilarityThreshold}
                                            onChange={(e) => setRagSimilarityThreshold(e.target.value)}
                                            className="travel-input !h-10 !text-xs !rounded-xl font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                                            Master Railway Sync Cron Frequency
                                        </label>
                                        <input
                                            type="text"
                                            value={irctcSyncFrequency}
                                            onChange={(e) => setIrctcSyncFrequency(e.target.value)}
                                            className="travel-input !h-10 !text-xs !rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
