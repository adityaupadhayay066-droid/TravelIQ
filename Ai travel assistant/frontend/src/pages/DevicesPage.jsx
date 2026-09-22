import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Smartphone, Trash2, ShieldAlert, Activity, LogOut, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function DevicesPage() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [revokingOthers, setRevokingOthers] = useState(false);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/devices');
            setSessions(data);
        } catch (error) {
            console.error('Failed to load active sessions:', error);
            toast.error('Unable to fetch authorized devices.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevoke = async (sessionId, isCurrent) => {
        if (isCurrent) {
            toast.error('To terminate this device, please use the main sign-out action.');
            return;
        }

        setRevokingId(sessionId);
        try {
            await api.delete(`/devices/${sessionId}`);
            toast.success('Device authorization revoked.');
            setSessions(sessions.filter(s => s.session_id !== sessionId));
        } catch (error) {
            console.error('Revocation failure:', error);
            toast.error(error.response?.data?.message || 'Failed to revoke device session.');
        } finally {
            setRevokingId(null);
        }
    };

    const handleRevokeOthers = async () => {
        if (!window.confirm('Are you sure you want to terminate all other active sessions? You will be signed out from all other browsers.')) {
            return;
        }

        setRevokingOthers(true);
        try {
            await api.delete('/devices');
            toast.success('All other sessions terminated successfully.');
            // Only keep current session
            setSessions(sessions.filter(s => s.is_current));
        } catch (error) {
            console.error('Termination failure:', error);
            toast.error(error.response?.data?.message || 'Failed to terminate other sessions.');
        } finally {
            setRevokingOthers(false);
        }
    };

    // Helper to mock location since local IPs are loopbacks
    const getMockLocation = (ip) => {
        if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
            return 'Mumbai, India (Your Location)';
        }
        // Simple hash for deterministic mocking
        let hash = 0;
        for (let i = 0; i < ip.length; i++) {
            hash = ip.charCodeAt(i) + ((hash << 5) - hash);
        }
        const locations = ['London, UK', 'New York, USA', 'Singapore', 'Berlin, Germany', 'Sydney, Australia', 'Tokyo, Japan'];
        return locations[Math.abs(hash) % locations.length];
    };

    return (
        <div className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen relative py-8 px-4 md:px-8 font-['Inter']">
            <div className="max-w-4xl mx-auto relative z-10">
                {/* Top Nav Action */}
                <div className="flex items-center justify-between mb-8">
                    <Link to="/dashboard" className="flex items-center gap-2 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>

                    <button
                        onClick={fetchSessions}
                        disabled={loading}
                        className="btn-ghost flex items-center justify-center p-2.5 rounded-lg border border-[#E3DED2] dark:border-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:bg-[#EEF2ED] dark:hover:bg-[#213530] hover:text-[#263238] dark:hover:text-[#F7F5EF] transition-all disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Header Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 font-['Manrope']">Device Management</h1>
                    <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">
                        Audit and manage active browsers and devices currently signed in to your TravelIQ account.
                    </p>
                </div>

                {/* Security warning banner */}
                <div className="bg-[#E5B85C]/10 border border-[#E5B85C]/30 rounded-xl p-5 mb-8 flex items-start gap-4 shadow-sm">
                    <ShieldAlert className="w-6 h-6 text-[#E5B85C] flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[#E5B85C] font-semibold mb-1 text-sm font-['Manrope']">Review unrecognized devices</h4>
                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs leading-relaxed">
                            If you notice a device that you do not recognize, click the revoke trashcan button instantly to sign that device out and we recommend changing your security password immediately.
                        </p>
                    </div>
                </div>

                {/* Session list container */}
                <div className="travel-card bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm border border-[#E3DED2] dark:border-[#2A403A] overflow-hidden">
                    {/* Top list header / Bulk actions */}
                    <div className="border-b border-[#E3DED2] dark:border-[#2A403A] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#F7F5EF]/50 dark:bg-[#12201D]/50">
                        <div>
                            <h3 className="text-lg font-bold text-[#263238] dark:text-[#F7F5EF] flex items-center gap-2 font-['Manrope']">
                                <Activity className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" /> Active Sessions
                            </h3>
                            <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] mt-1">
                                You are signed in on {sessions.length} authorized devices.
                            </p>
                        </div>

                        {sessions.length > 1 && (
                            <button
                                onClick={handleRevokeOthers}
                                disabled={revokingOthers}
                                className="flex items-center justify-center gap-2 bg-[#B94A48]/10 hover:bg-[#B94A48]/20 border border-[#B94A48]/20 text-[#B94A48] rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                <LogOut className="w-4 h-4" />
                                {revokingOthers ? 'Logging out others...' : 'Log Out Other Devices'}
                            </button>
                        )}
                    </div>

                    {/* Devices list */}
                    <div className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="w-10 h-10 border-4 border-[#E3DED2] dark:border-[#2A403A] border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Querying active sessions...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="py-16 text-center text-[#66736F] dark:text-[#A3B0AB]">
                                <AlertTriangle className="w-12 h-12 text-[#66736F] dark:text-[#A3B0AB] mx-auto mb-4 opacity-50" />
                                <p>No authorized sessions found.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {sessions.map((session) => (
                                    <motion.div
                                        key={session.session_id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`p-6 flex items-center justify-between transition-all ${
                                            session.is_current ? 'bg-[#EEF2ED]/50 dark:bg-[#213530]/50 border-l-4 border-[#173F3A] dark:border-[#EEF2ED]' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-lg ${
                                                session.is_current 
                                                    ? 'bg-[#173F3A]/10 text-[#173F3A] dark:bg-[#EEF2ED]/10 dark:text-[#EEF2ED]' 
                                                    : 'bg-[#F7F5EF] dark:bg-[#12201D] text-[#66736F] dark:text-[#A3B0AB] border border-[#E3DED2] dark:border-[#2A403A]'
                                            }`}>
                                                {session.device_type === 'mobile' ? (
                                                    <Smartphone className="w-6 h-6" />
                                                ) : (
                                                    <Laptop className="w-6 h-6" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-[#263238] dark:text-[#F7F5EF] font-['Manrope']">
                                                        {session.os} ({session.browser})
                                                    </h4>
                                                    {session.is_current && (
                                                        <span className="flex items-center gap-1.5 travel-badge bg-[#173F3A] text-[#FFFFFF] dark:bg-[#EEF2ED] dark:text-[#173F3A] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                            Current Device
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1.5">
                                                        📍 {getMockLocation(session.ip_address)} • <span className="font-mono">{session.ip_address}</span>
                                                    </p>
                                                    <p className="text-xs text-[#66736F] dark:text-[#A3B0AB]">
                                                        Last active: {session.is_current ? 'Active now' : new Date(session.last_active).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {!session.is_current && (
                                            <button
                                                onClick={() => handleRevoke(session.session_id, false)}
                                                disabled={revokingId === session.session_id}
                                                className="hover:bg-[#B94A48]/10 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#B94A48] p-2.5 rounded-lg transition-all disabled:opacity-50 border border-transparent hover:border-[#B94A48]/20"
                                                title="Revoke device access"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
