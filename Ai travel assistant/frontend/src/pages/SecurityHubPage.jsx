import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, Smartphone, Laptop, Trash2, Key, Calendar, MapPin, 
    AlertTriangle, RefreshCw, LogOut, ShieldAlert, Shield, Search
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function SecurityHubPage() {
    const [activeSessions, setActiveSessions] = useState([]);
    const [loginHistory, setLoginHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const loadSecurityData = async () => {
        setLoading(true);
        try {
            const [sessionsRes, historyRes] = await Promise.all([
                api.get('/security/active-sessions'),
                api.get('/security/login-history')
            ]);
            setActiveSessions(sessionsRes.data || []);
            setLoginHistory(historyRes.data || []);
        } catch (error) {
            console.error('Failed to load security registry:', error);
            toast.error('Unable to fetch security history.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSecurityData();
    }, []);

    const handleRevoke = async (sessionId, isCurrent) => {
        if (isCurrent) {
            toast.error('To terminate this active device, please use the primary sign-out button.');
            return;
        }

        setRevokingId(sessionId);
        try {
            await api.delete(`/security/sessions/${sessionId}`);
            toast.success('Device session successfully revoked.');
            // Refresh
            loadSecurityData();
        } catch (error) {
            console.error('Failed to revoke session:', error);
            toast.error('Failed to invalidate device session.');
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeAllOthers = async () => {
        if (!window.confirm('Are you sure you want to log out all other active devices? You will be signed out from all other browsers.')) {
            return;
        }

        try {
            await api.delete('/devices'); // Clears other active sessions
            toast.success('All other devices logged out.');
            loadSecurityData();
        } catch (error) {
            toast.error('Failed to terminate other devices.');
        }
    };

    // Filter login history
    const filteredHistory = loginHistory.filter(item => 
        item.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ip_address.includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen py-8 px-4 md:px-8 relative text-[#263238] dark:text-[#F7F5EF]">
            <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E3DED2] dark:border-[#2A403A] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-[#173F3A] dark:text-[#EEF2ED]" /> Advanced Security & Session Audit
                        </h1>
                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">
                            Manage authorized browsers, audit location sign-in history, and invalidate active sessions remotely.
                        </p>
                    </div>

                    <button
                        onClick={loadSecurityData}
                        disabled={loading}
                        className="btn-ghost text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-[#EEF2ED] rounded-lg p-2.5 transition-all bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-40 text-center">
                        <div className="w-12 h-12 border-3 border-[#EEF2ED] dark:border-[#213530] border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Querying account safety records...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* ─── Security Warning Diagnostics Column ─── */}
                        <div className="lg:col-span-1 space-y-6">
                            
                            {/* Health assessment panel */}
                            <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] p-6 rounded-xl border border-[#E3DED2] dark:border-[#2A403A] shadow-[0_4px_16px_rgba(23,63,58,0.06)] text-center">
                                <div className="inline-flex items-center justify-center p-4 bg-[#EEF2ED] dark:bg-[#213530] rounded-xl mb-4 text-[#173F3A] dark:text-[#EEF2ED]">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <h3 className="text-xs text-[#66736F] dark:text-[#A3B0AB] font-bold uppercase tracking-widest mb-1">
                                    Account Safety Score
                                </h3>
                                <h2 className="text-xl font-bold mb-4 text-[#173F3A] dark:text-[#EEF2ED]">
                                    Excellent Protection
                                </h2>
                                
                                <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] leading-relaxed mb-6">
                                    Automatic brute-force lockouts and multi-device limit checks (max 2 mobile, 2 desktop) are actively shielding your profile.
                                </p>

                                <div className="p-3 bg-[#EEF2ED] dark:bg-[#213530] rounded-lg flex items-center gap-2.5 justify-center text-sm text-[#173F3A] dark:text-[#EEF2ED] font-semibold border border-[#E3DED2] dark:border-[#2A403A]">
                                    <ShieldCheck className="w-5 h-5" /> No Suspicious Alerts
                                </div>
                            </div>

                            {/* Threat Diagnostics warnings */}
                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] shadow-[0_4px_16px_rgba(23,63,58,0.06)] rounded-xl p-5">
                                <h4 className="text-[#173F3A] dark:text-[#EEF2ED] font-semibold mb-2 text-sm flex items-center gap-2">
                                    <Key className="w-4 h-4" /> Multi-device bounds
                                </h4>
                                <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm leading-relaxed">
                                    TravelIQ enforces bank-grade limits of **2 desktop sessions** and **2 mobile sessions** per user. Logging in on a new device will safely revoke your oldest active session of that category automatically.
                                </p>
                            </div>
                        </div>

                        {/* ─── Active Devices & History Tables Column ─── */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* ACTIVE DEVICES LISTING */}
                            <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] shadow-[0_4px_16px_rgba(23,63,58,0.06)] rounded-xl overflow-hidden">
                                <div className="border-b border-[#E3DED2] dark:border-[#2A403A] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F7F5EF] dark:bg-[#12201D]">
                                    <div>
                                        <h3 className="text-base font-bold flex items-center gap-2 text-[#263238] dark:text-[#F7F5EF]">
                                            💻 Active Authorized Browsers
                                        </h3>
                                        <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">Currently logged in devices.</p>
                                    </div>
                                    
                                    {activeSessions.length > 1 && (
                                        <button
                                            onClick={handleRevokeAllOthers}
                                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                                        >
                                            <LogOut className="w-4 h-4" /> Log Out Others
                                        </button>
                                    )}
                                </div>

                                <div className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                                    {activeSessions.map((session) => (
                                        <div 
                                            key={session.session_id} 
                                            className={`p-6 flex items-center justify-between transition-all ${
                                                session.is_current ? 'bg-[#EEF2ED] dark:bg-[#213530] border-l-4 border-[#173F3A] dark:border-[#EEF2ED]' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${
                                                    session.is_current ? 'bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED]' : 'bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB]'
                                                }`}>
                                                    {session.device_type === 'mobile' ? (
                                                        <Smartphone className="w-5 h-5" />
                                                    ) : (
                                                        <Laptop className="w-5 h-5" />
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-sm font-semibold text-[#263238] dark:text-[#F7F5EF]">
                                                            {session.os} ({session.browser})
                                                        </h4>
                                                        {session.is_current && (
                                                            <span className="bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] border border-[#E3DED2] dark:border-[#2A403A] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                                Current device
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">
                                                        📍 {session.location || 'Bhubaneswar, IN'} • <span className="font-mono">{session.ip_address}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {!session.is_current && (
                                                <button
                                                    onClick={() => handleRevoke(session.session_id, false)}
                                                    disabled={revokingId === session.session_id}
                                                    className="hover:bg-red-50 dark:hover:bg-red-900/20 text-[#66736F] dark:text-[#A3B0AB] hover:text-red-600 dark:hover:text-red-400 p-2.5 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SIGN-IN HISTORY LOGS */}
                            <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] shadow-[0_4px_16px_rgba(23,63,58,0.06)] rounded-xl overflow-hidden">
                                <div className="p-6 border-b border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="text-base font-bold flex items-center gap-2 text-[#263238] dark:text-[#F7F5EF]">
                                            📅 Location & Login Audit History
                                        </h3>
                                        <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">Sign-in actions recorded on TravelIQ.</p>
                                    </div>

                                    {/* Search login logs */}
                                    <div className="relative max-w-xs w-full">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#66736F] dark:text-[#A3B0AB] w-4 h-4" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search log location, IP..."
                                            className="travel-input w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2 pl-9 pr-3 text-sm text-[#263238] dark:text-[#F7F5EF] placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="travel-table w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b border-[#E3DED2] dark:border-[#2A403A] bg-[#EEF2ED] dark:bg-[#213530] text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-widest font-bold">
                                                <th className="p-4">Login Time / Status</th>
                                                <th className="p-4">Device OS / Browser</th>
                                                <th className="p-4">IP Coordinates</th>
                                                <th className="p-4">Audit Location</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E3DED2] dark:divide-[#2A403A] text-[#263238] dark:text-[#F7F5EF]">
                                            {filteredHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="p-8 text-center text-[#66736F] dark:text-[#A3B0AB]">
                                                        No logins indexed matching your query.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredHistory.map((item) => (
                                                    <tr key={item.id} className="hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-all">
                                                        <td className="p-4">
                                                            <div className="font-semibold">
                                                                {new Date(item.login_time).toLocaleString()}
                                                            </div>
                                                            <div className={`text-[11px] font-bold uppercase mt-1 flex items-center gap-1 ${
                                                                item.is_active 
                                                                    ? 'text-[#4F7D62]' 
                                                                    : (item.logout_time ? 'text-[#66736F] dark:text-[#A3B0AB]' : 'text-[#D96C4F]')
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                    item.is_active ? 'bg-[#4F7D62]' : 'bg-[#66736F] dark:bg-[#A3B0AB]'
                                                                }`} />
                                                                {item.status}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2 font-medium">
                                                                {item.device_type === 'mobile' ? (
                                                                    <Smartphone className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                                                                ) : (
                                                                    <Laptop className="w-4 h-4 text-[#173F3A] dark:text-[#EEF2ED]" />
                                                                )}
                                                                {item.os} ({item.browser})
                                                            </div>
                                                        </td>
                                                        <td className="p-4 font-mono text-xs text-[#66736F] dark:text-[#A3B0AB]">
                                                            {item.ip_address}
                                                        </td>
                                                        <td className="p-4 font-medium text-[#66736F] dark:text-[#A3B0AB]">
                                                            📍 {item.location}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
