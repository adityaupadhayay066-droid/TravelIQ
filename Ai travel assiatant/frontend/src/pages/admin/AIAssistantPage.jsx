import React, { useState } from 'react';
import { 
    Sparkles, BrainCircuit, Activity, Clock, 
    CheckCircle, AlertCircle, Eye, RefreshCw, Zap, Shield 
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import ChartCard from '../../components/admin/ChartCard';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AIAssistantPage() {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showInspectModal, setShowInspectModal] = useState(false);

    const latencyData = [
        { time: '00:00', latencyMs: 220, tokens: 410 },
        { time: '04:00', latencyMs: 180, tokens: 380 },
        { time: '08:00', latencyMs: 290, tokens: 620 },
        { time: '12:00', latencyMs: 340, tokens: 840 },
        { time: '16:00', latencyMs: 260, tokens: 710 },
        { time: '20:00', latencyMs: 240, tokens: 590 },
        { time: 'Now', latencyMs: 210, tokens: 520 }
    ];

    const aiRequests = [
        {
            id: 'REQ-9104',
            user: 'Vikram Singh',
            query: 'Plan a 3-day spiritual itinerary in Varanasi covering main evening aartis and boat rides under ₹10,000 budget.',
            response: 'Here is your 3-day optimized Varanasi plan: Day 1: Evening Dashashwamedh Ganga Aarti + Assi Ghat boat tour. Day 2: Kashi Vishwanath early morning darshan + Sarnath excursion. Day 3: Local street food tour (Kachori Gali) + silk weaving workshop.',
            timestamp: new Date(Date.now() - 5 * 60000),
            latency: '240ms',
            status: 'Success',
            model: 'TravelIQ-RAG-v2 (Gemini Flash)',
            tokens: 420,
            confidence: '98.5%'
        },
        {
            id: 'REQ-9105',
            user: 'Ananya Roy',
            query: 'Compare train vs flight price and duration from New Delhi to Goa for a family of 4 in November.',
            response: 'Comparison Summary: Train (Goa Express / Rajdhani 2AC): ~26 hrs, ₹11,400 total. Flight (IndiGo direct DEL-GOI): 2h 45m, ₹22,800 total. Recommendation: Flight is recommended if time is constrained.',
            timestamp: new Date(Date.now() - 18 * 60000),
            latency: '190ms',
            status: 'Success',
            model: 'MultiModal-Optimizer-v1',
            tokens: 310,
            confidence: '99.1%'
        },
        {
            id: 'REQ-9106',
            user: 'Rohan Deshmukh',
            query: 'Find vegetarian Jain food stalls near Bhubaneswar station platform 1.',
            response: 'Near BBS Platform 1: "Shree Krishna Veg Food Court" provides 100% Pure Veg & Jain meals (No onion, no garlic thalis). Also IRCTC Jan Aahar on Pf 1 has pure veg meal boxes.',
            timestamp: new Date(Date.now() - 42 * 60000),
            latency: '175ms',
            status: 'Success',
            model: 'TravelIQ-RAG-v2 (Gemini Flash)',
            tokens: 280,
            confidence: '97.8%'
        },
        {
            id: 'REQ-9107',
            user: 'Kavita Menon',
            query: 'What is the current platform water bottle MRP at New Delhi Railway Station?',
            response: 'IRCTC Rail Neer 1-Litre Packaged Drinking Water is strictly capped at ₹15 MRP across all platform stalls at New Delhi Station (NDLS). Report any overcharging immediately to 139.',
            timestamp: new Date(Date.now() - 75 * 60000),
            latency: '160ms',
            status: 'Success',
            model: 'TravelIQ-RAG-v2 (Gemini Flash)',
            tokens: 190,
            confidence: '99.8%'
        }
    ];

    const columns = [
        {
            key: 'query',
            label: 'Prompt / User Query',
            render: (val, row) => (
                <div className="max-w-md">
                    <div className="text-xs font-semibold text-[var(--color-text)] truncate">{val}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{row.user} • {row.id}</div>
                </div>
            )
        },
        {
            key: 'model',
            label: 'Model / Engine',
            render: (val) => (
                <span className="text-xs font-mono text-[var(--color-text-muted)]">{val}</span>
            )
        },
        {
            key: 'latency',
            label: 'Latency',
            render: (val) => (
                <span className="text-xs font-bold font-mono text-emerald-400">{val}</span>
            )
        },
        {
            key: 'confidence',
            label: 'Confidence',
            render: (val) => (
                <span className="text-xs font-mono font-bold text-sky-400">{val}</span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (s) => <StatusBadge status={s} size="xs" />
        },
        {
            key: 'actions',
            label: 'Inspect',
            className: 'text-right',
            render: (_, row) => (
                <button
                    onClick={() => { setSelectedRequest(row); setShowInspectModal(true); }}
                    className="p-1.5 rounded-lg text-sky-400 hover:bg-sky-500/10 transition"
                    title="Inspect Prompt & Response Payload"
                >
                    <Eye className="w-4 h-4" />
                </button>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading flex items-center gap-2">
                        <span>AI Assistant Telemetry</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-purple-500 text-white">
                            Active
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Monitor LLM query throughput, RAG context retrieval, token utilization, and response latencies.
                    </p>
                </div>
            </div>

            {/* AI Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total AI Requests"
                    value="2,450"
                    subtitle="184 queries processed today"
                    change="+18.2%"
                    icon={Sparkles}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10 border-purple-500/20"
                />
                <StatCard
                    title="Avg Response Time"
                    value="210ms"
                    subtitle="Sub-second RAG search"
                    change="Optimal"
                    icon={Zap}
                    iconColor="text-amber-400"
                    iconBg="bg-amber-500/10 border-amber-500/20"
                />
                <StatCard
                    title="Model Accuracy Rate"
                    value="98.4%"
                    subtitle="Validated against IRCTC datasets"
                    change="+0.6%"
                    icon={CheckCircle}
                    iconColor="text-emerald-400"
                    iconBg="bg-emerald-500/10 border-emerald-500/20"
                />
                <StatCard
                    title="Error / Fallback Rate"
                    value="1.6%"
                    subtitle="0 API timeouts in last 24h"
                    change="Low"
                    icon={Shield}
                    iconColor="text-sky-400"
                    iconBg="bg-sky-500/10 border-sky-500/20"
                />
            </div>

            {/* Latency & Token Stream Chart */}
            <ChartCard
                title="Response Latency & Token Usage (Past 24 Hours)"
                subtitle="Real-time latency monitoring in milliseconds"
            >
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} vertical={false} />
                        <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                                borderRadius: '12px',
                                fontSize: '12px'
                            }}
                        />
                        <Area type="monotone" dataKey="latencyMs" name="Latency (ms)" stroke="#a855f7" strokeWidth={2} fill="url(#latencyGrad)" />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Recent Queries Table */}
            <div>
                <h3 className="text-base font-bold text-[var(--color-text)] font-heading mb-3">
                    Recent AI Assistant Requests
                </h3>
                <DataTable
                    columns={columns}
                    data={aiRequests}
                    keyField="id"
                    totalRecords={aiRequests.length}
                    searchPlaceholder="Search AI queries by user prompt..."
                />
            </div>

            {/* Inspect Request Modal */}
            <Modal
                isOpen={showInspectModal}
                onClose={() => setShowInspectModal(false)}
                title="AI Query Payload Inspector"
                subtitle={`Request ID: ${selectedRequest?.id}`}
                size="lg"
            >
                {selectedRequest && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--color-soft)]/50 border border-[var(--color-border)] text-xs">
                            <div>
                                <span className="text-[var(--color-text-muted)]">User:</span>
                                <div className="font-bold text-[var(--color-text)] mt-0.5">{selectedRequest.user}</div>
                            </div>
                            <div>
                                <span className="text-[var(--color-text-muted)]">Latency:</span>
                                <div className="font-bold text-emerald-400 mt-0.5 font-mono">{selectedRequest.latency}</div>
                            </div>
                            <div>
                                <span className="text-[var(--color-text-muted)]">Model:</span>
                                <div className="font-bold text-purple-400 mt-0.5">{selectedRequest.model}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                                User Prompt / Question
                            </label>
                            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text)] leading-relaxed font-sans">
                                {selectedRequest.query}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                                AI Assistant Generated Response
                            </label>
                            <div className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-emerald-500/20 text-xs text-[var(--color-text)] leading-relaxed whitespace-pre-line font-sans">
                                {selectedRequest.response}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
