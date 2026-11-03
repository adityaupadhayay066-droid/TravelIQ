import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, MessageSquare, AlertCircle, Clock, CheckCircle, Activity, X, Zap, Bot, Sparkles, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

export default function AdminSupport() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [n8nTelemetry, setN8nTelemetry] = useState(null);
    const [isTestingN8n, setIsTestingN8n] = useState(false);

    // Metrics
    const metrics = [
        { label: 'Total Tickets', value: 142, icon: Activity, color: 'text-[#244C66] dark:text-[#F0F4F7]' },
        { label: 'Open', value: 24, icon: AlertCircle, color: 'text-[#E5B85C]' },
        { label: 'Resolved', value: 110, icon: CheckCircle, color: 'text-[#4F7D62]' },
        { label: 'Avg Resolution', value: '4.2h', icon: Clock, color: 'text-[#244C66] dark:text-[#F0F4F7]' },
    ];

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/support/admin/all?status=' + filterStatus);
            setTickets(res.data.tickets || []);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            toast.error('Failed to fetch support tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchN8nStatus = async () => {
        try {
            const res = await api.get('/n8n/status');
            if (res.data && res.data.telemetry) {
                setN8nTelemetry(res.data.telemetry);
            }
        } catch (err) {
            console.warn('Could not fetch n8n status:', err.message);
        }
    };

    const handleTestN8n = async () => {
        setIsTestingN8n(true);
        try {
            const res = await api.post('/n8n/test', { type: 'support' });
            const supportResult = res.data?.results?.support;
            if (supportResult?.status === 'Connected') {
                toast.success('n8n Webhook Connected and responding!');
            } else {
                toast.error(`n8n is ${supportResult?.status || 'Offline'} on port 5678. Run "npx n8n" to start.`);
            }
            fetchN8nStatus();
        } catch (err) {
            toast.error('n8n test error: ' + err.message);
        } finally {
            setIsTestingN8n(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchN8nStatus();
    }, [filterStatus]);

    const getStatusColor = (status) => {
        switch(status) {
            case 'Open': return 'bg-[#F0F4F7] dark:bg-[#233240] text-[#244C66] dark:text-[#F0F4F7] border-[#E3E7EA] dark:border-[#293644]';
            case 'In Progress': return 'bg-[#F0F4F7] dark:bg-[#233240] text-[#E5B85C] border-[#E5B85C]/20';
            case 'Resolved': return 'bg-[#F0F4F7] dark:bg-[#233240] text-[#4F7D62] border-[#4F7D62]/20';
            case 'Closed': return 'bg-[#F7F8FA] dark:bg-[#121921] text-[#66736F] dark:text-[#A3B0AB] border-[#E3E7EA] dark:border-[#293644]';
            default: return 'bg-[#F7F8FA] dark:bg-[#121921] text-[#66736F] dark:text-[#A3B0AB] border-[#E3E7EA] dark:border-[#293644]';
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'Low': return 'bg-[#F7F8FA] dark:bg-[#121921] text-[#66736F] dark:text-[#A3B0AB]';
            case 'Medium': return 'bg-[#F0F4F7] dark:bg-[#233240] text-[#244C66] dark:text-[#F0F4F7]';
            case 'High': return 'bg-[#E5B85C]/10 text-[#E5B85C]';
            case 'Critical': return 'bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/20';
            default: return 'bg-[#F7F8FA] dark:bg-[#121921] text-[#66736F] dark:text-[#A3B0AB]';
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/support/admin/${id}`, { status: newStatus });
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
            toast.success(`Ticket status updated to ${newStatus}`);
        } catch (error) {
            toast.error('Failed to update ticket status');
        }
    };

    const filteredTickets = tickets;

    return (
        <div className="flex-1 bg-[#F7F8FA] dark:bg-[#121921] min-h-screen p-8 text-[#263238] dark:text-[#F7F8FA] font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                <div className="flex items-center justify-between border-b border-[#E3E7EA] dark:border-[#293644] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-[#244C66] dark:text-[#F0F4F7] font-['Manrope']">
                            <ShieldCheck className="w-8 h-8 text-[#244C66] dark:text-[#F0F4F7]" /> Support Desk Admin
                        </h1>
                        <p className="text-[#66736F] dark:text-[#A3B0AB] mt-2">Manage user tickets, assign priorities, and resolve issues.</p>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {metrics.map((m, idx) => (
                        <div key={idx} className="bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-6 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider mb-1">{m.label}</p>
                                <p className="text-3xl font-bold text-[#263238] dark:text-[#F7F8FA]">{m.value}</p>
                            </div>
                            <div className={`p-3 bg-[#F7F8FA] dark:bg-[#121921] rounded-lg border border-[#E3E7EA] dark:border-[#293644] ${m.color}`}>
                                <m.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* n8n AI Automation Engine Hub */}
                <div className="bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl p-6 shadow-sm">
                    
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-[#F0F4F7] dark:bg-[#233240] text-[#244C66] dark:text-[#F0F4F7] rounded-lg border border-[#E3E7EA] dark:border-[#293644]">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-[#244C66] dark:text-[#F0F4F7] flex items-center gap-2 font-['Manrope']">
                                    n8n AI Workflow Automation Engine
                                    {n8nTelemetry?.lastStatus === 'Connected' || n8nTelemetry?.lastStatus === 'Success' ? (
                                        <span className="text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/30 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-[#4F7D62] rounded-full animate-pulse" />
                                            Online & Active
                                        </span>
                                    ) : (
                                        <span className="text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full bg-[#D96C4F]/10 text-[#D96C4F] border border-[#D96C4F]/30 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-[#D96C4F] rounded-full" />
                                            Offline (AI Fallback Active)
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <p className="text-sm text-[#66736F] dark:text-[#A3B0AB] max-w-2xl leading-relaxed">
                                Automatically triggers AI-generated resolution replies when users request support, and personalized journey briefings when tickets are booked. Ready for self-hosted or cloud n8n instances.
                            </p>
                            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#66736F] dark:text-[#A3B0AB] font-mono">
                                <span>Support Webhook: <code className="text-[#244C66] dark:text-[#F0F4F7] bg-[#F0F4F7] dark:bg-[#233240] px-2 py-0.5 rounded border border-[#E3E7EA] dark:border-[#293644]">/webhook/traveliq-support</code></span>
                                <span>Booking Webhook: <code className="text-[#244C66] dark:text-[#F0F4F7] bg-[#F0F4F7] dark:bg-[#233240] px-2 py-0.5 rounded border border-[#E3E7EA] dark:border-[#293644]">/webhook/traveliq-booking</code></span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block pr-2">
                                <p className="text-[10px] uppercase font-semibold text-[#66736F] dark:text-[#A3B0AB]">Total Triggered</p>
                                <p className="text-xl font-bold text-[#263238] dark:text-[#F7F8FA]">
                                    {n8nTelemetry?.totalDispatched || 0} Events
                                </p>
                            </div>
                            <button
                                onClick={handleTestN8n}
                                disabled={isTestingN8n}
                                className="px-5 py-2.5 rounded-lg bg-[#244C66] hover:bg-[#193B51] dark:bg-[#F0F4F7] dark:hover:bg-[#FFFFFF] dark:text-[#244C66] text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Sparkles className={`w-4 h-4 ${isTestingN8n ? 'animate-spin' : ''}`} />
                                <span>{isTestingN8n ? 'Testing...' : 'Test n8n Webhook'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tickets Table Area */}
                <div className="bg-[#FFFFFF] dark:bg-[#1B242E] border border-[#E3E7EA] dark:border-[#293644] rounded-xl overflow-hidden shadow-sm">
                    
                    {/* Controls */}
                    <div className="p-4 border-b border-[#E3E7EA] dark:border-[#293644] flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 bg-[#F7F8FA] dark:bg-[#121921] border border-[#E3E7EA] dark:border-[#293644] rounded-lg px-3 py-2 w-full md:w-96">
                            <Search className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                            <input type="text" placeholder="Search ticket ID or user..." className="bg-transparent border-none outline-none text-sm text-[#263238] dark:text-[#F7F8FA] w-full placeholder-[#66736F] dark:placeholder-[#A3B0AB]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-[#F7F8FA] dark:bg-[#121921] border border-[#E3E7EA] dark:border-[#293644] text-sm text-[#263238] dark:text-[#F7F8FA] rounded-lg p-2 outline-none"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-[#F7F8FA] dark:bg-[#121921] border-b border-[#E3E7EA] dark:border-[#293644] text-xs font-semibold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">
                        <div className="col-span-1">Ticket ID</div>
                        <div className="col-span-2">User</div>
                        <div className="col-span-3">Subject</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-1 text-center">Priority</div>
                        <div className="col-span-2 text-center">Created</div>
                        <div className="col-span-1 text-center">Actions</div>
                    </div>

                    {/* Table Body */}
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-3 border-[#244C66]/30 dark:border-[#F0F4F7]/30 border-t-[#244C66] dark:border-t-[#F0F4F7] rounded-full animate-spin mx-auto mb-4" />
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E3E7EA] dark:divide-[#293644]">
                            {filteredTickets.map(ticket => (
                                <div key={ticket.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#F7F8FA]/50 dark:hover:bg-[#121921]/50 transition-colors">
                                    <div className="col-span-1">
                                        <span className="text-[10px] font-mono text-[#66736F] dark:text-[#A3B0AB]">#{ticket.id}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-sm font-medium text-[#263238] dark:text-[#F7F8FA] block">{ticket.User?.name || 'User'}</span>
                                    </div>
                                    <div className="col-span-3">
                                        <p className="text-sm text-[#263238] dark:text-[#F7F8FA] truncate" title={ticket.subject}>{ticket.subject}</p>
                                        <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] uppercase font-semibold tracking-wider">{ticket.category}</span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <select 
                                            value={ticket.status}
                                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                            className={`text-[10px] font-semibold uppercase tracking-wider border rounded-md px-2 py-1 outline-none appearance-none text-center cursor-pointer ${getStatusColor(ticket.status)}`}
                                        >
                                            <option value="Open" className="bg-[#FFFFFF] dark:bg-[#1B242E] text-[#263238] dark:text-[#F7F8FA]">Open</option>
                                            <option value="In Progress" className="bg-[#FFFFFF] dark:bg-[#1B242E] text-[#263238] dark:text-[#F7F8FA]">In Progress</option>
                                            <option value="Resolved" className="bg-[#FFFFFF] dark:bg-[#1B242E] text-[#263238] dark:text-[#F7F8FA]">Resolved</option>
                                            <option value="Closed" className="bg-[#FFFFFF] dark:bg-[#1B242E] text-[#263238] dark:text-[#F7F8FA]">Closed</option>
                                            <option value="Rejected" className="bg-[#FFFFFF] dark:bg-[#1B242E] text-[#263238] dark:text-[#F7F8FA]">Rejected</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 text-center flex justify-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="text-[11px] text-[#66736F] dark:text-[#A3B0AB]">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="col-span-1 flex justify-center gap-2">
                                        <Link 
                                            to={`/support/ticket/${ticket.id}`}
                                            className="p-1.5 bg-[#F7F8FA] dark:bg-[#121921] border border-[#E3E7EA] dark:border-[#293644] rounded text-[#244C66] dark:text-[#F0F4F7] hover:bg-[#F0F4F7] dark:hover:bg-[#233240] transition-colors"
                                            title="Open Ticket / Reply"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
