import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Clock, ShieldCheck, User, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getBackendBaseURL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function TicketDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);

    const { user: currentUser } = useAuth(); // Get actual user role

    useEffect(() => {
        fetchTicketDetails();
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchTicketDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/support/${id}`);
            const t = res.data.ticket;
            setTicket({
                ...t,
                ticket_number: `TRV-${t.id.toString().padStart(5, '0')}`
            });
            // Extract messages and map to UI format
            if (t.SupportMessages) {
                setMessages(t.SupportMessages);
            }
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
            toast.error('Failed to load ticket details');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        try {
            await api.post(`/support/${id}/reply`, { message: replyText });
            toast.success("Reply sent");
            setReplyText('');
            fetchTicketDetails(); // Refresh messages
        } catch (error) {
            toast.error('Failed to send reply');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Open': return 'bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] border-[#E3DED2] dark:border-[#2A403A]';
            case 'In Progress': return 'bg-[#E5B85C]/10 text-[#E5B85C] border-[#E5B85C]/20';
            case 'Resolved': return 'bg-[#4F7D62]/10 text-[#4F7D62] border-[#4F7D62]/20';
            case 'Closed': return 'bg-[#66736F]/10 text-[#66736F] dark:text-[#A3B0AB] border-[#66736F]/20';
            default: return 'bg-[#66736F]/10 text-[#66736F] dark:text-[#A3B0AB] border-[#66736F]/20';
        }
    };

    if (loading) {
        return (
            <div className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#E3DED2] dark:border-[#2A403A] border-t-[#173F3A] dark:border-t-[#EEF2ED] rounded-full animate-spin" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen pb-12 font-sans text-[#263238] dark:text-[#F7F5EF]">
            {/* Header */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border-b border-[#E3DED2] dark:border-[#2A403A] pt-8 pb-6 px-4 md:px-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/support" className="p-2 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-[#EEF2ED] transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl md:text-2xl font-bold font-heading text-[#263238] dark:text-[#F7F5EF] truncate max-w-[300px] md:max-w-full">{ticket.subject}</h1>
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                                    {ticket.status}
                                </span>
                            </div>
                            <div className="text-xs text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-4">
                                <span>Ticket #{ticket.ticket_number}</span>
                                <span>•</span>
                                <span>{ticket.category}</span>
                            </div>
                        </div>
                    </div>

                    {currentUser?.role === 'admin' && (
                        <div className="flex gap-2">
                            <button 
                                onClick={async () => {
                                    await api.put(`/support/admin/${id}`, { status: 'Resolved' });
                                    toast.success('Ticket marked as resolved');
                                    fetchTicketDetails();
                                }}
                                className="bg-[#4F7D62]/10 text-[#4F7D62] border border-[#4F7D62]/20 hover:bg-[#4F7D62] hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                                Resolve Ticket
                            </button>
                            <button 
                                onClick={async () => {
                                    await api.put(`/support/admin/${id}`, { status: 'Closed' });
                                    toast.success('Ticket closed');
                                    fetchTicketDetails();
                                }}
                                className="bg-[#EEF2ED] dark:bg-[#213530] text-[#66736F] dark:text-[#A3B0AB] hover:bg-[#E3DED2] dark:hover:bg-[#2A403A] border border-[#E3DED2] dark:border-[#2A403A] px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Chat Interface */}
                    <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl flex flex-col h-[600px] shadow-sm">
                        <div className="p-4 border-b border-[#E3DED2] dark:border-[#2A403A] flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                            <span className="text-sm font-bold font-heading text-[#263238] dark:text-[#F7F5EF]">Support Conversation</span>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F7F5EF]/50 dark:bg-[#12201D]/50">
                            {messages.map((msg) => {
                                const isAdmin = msg.sender_type === 'Admin';
                                const isAi = msg.message && (msg.message.includes('🤖') || msg.message.includes('AI Support') || msg.message.includes('n8n'));
                                return (
                                    <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isAi 
                                                ? 'bg-[#173F3A] dark:bg-[#EEF2ED] text-white dark:text-[#173F3A] text-xs'
                                                : isAdmin 
                                                    ? 'bg-[#D96C4F] text-white' 
                                                    : 'bg-[#E3DED2] dark:bg-[#2A403A] text-[#263238] dark:text-[#F7F5EF]'
                                        }`}>
                                            {isAi ? '🤖' : isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </div>
                                        
                                        {/* Message Bubble */}
                                        <div className={`flex flex-col max-w-[80%] ${isAdmin ? 'items-start' : 'items-end'}`}>
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className={`text-[10px] font-bold ${isAi ? 'text-[#173F3A] dark:text-[#EEF2ED]' : 'text-[#66736F] dark:text-[#A3B0AB]'}`}>
                                                    {isAi ? '🤖 AI Support Assistant' : isAdmin ? 'Support Agent' : 'You'}
                                                </span>
                                                <span className="text-[9px] text-[#66736F] dark:text-[#A3B0AB]">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-line shadow-sm border ${
                                                isAi
                                                    ? 'bg-[#EEF2ED] dark:bg-[#213530] border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] rounded-tl-sm'
                                                    : isAdmin 
                                                        ? 'bg-[#FFFFFF] dark:bg-[#1B2C28] border-[#E3DED2] dark:border-[#2A403A] text-[#263238] dark:text-[#F7F5EF] rounded-tl-sm' 
                                                        : 'bg-[#173F3A] dark:bg-[#EEF2ED] border-[#173F3A] dark:border-[#EEF2ED] text-white dark:text-[#173F3A] rounded-tr-sm'
                                            }`}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Reply Input Area */}
                        {ticket.status !== 'Closed' ? (
                            <form onSubmit={handleReply} className="p-4 border-t border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-b-xl flex gap-3 items-end">
                                <button type="button" className="p-3 bg-[#EEF2ED] dark:bg-[#213530] hover:bg-[#E3DED2] dark:hover:bg-[#2A403A] text-[#66736F] dark:text-[#A3B0AB] hover:text-[#173F3A] dark:hover:text-[#EEF2ED] rounded-lg transition-colors flex-shrink-0">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..."
                                    className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] focus:border-[#173F3A] dark:focus:border-[#EEF2ED] rounded-lg p-3 text-[#263238] dark:text-[#F7F5EF] text-sm outline-none resize-none h-[50px] transition-all"
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleReply(e);
                                        }
                                    }}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!replyText.trim()}
                                    className="p-3 bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] disabled:opacity-50 text-white dark:text-[#173F3A] rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 border-t border-[#E3DED2] dark:border-[#2A403A] bg-[#F7F5EF] dark:bg-[#12201D] rounded-b-xl text-center">
                                <p className="text-sm text-[#66736F] dark:text-[#A3B0AB]">This ticket is closed. You cannot reply to this conversation.</p>
                            </div>
                        )}
                    </div>

                    {/* Ticket Metadata Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold font-heading text-[#263238] dark:text-[#F7F5EF] mb-4 border-b border-[#E3DED2] dark:border-[#2A403A] pb-2">Ticket Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block mb-1">Status</span>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block mb-1">Priority</span>
                                    <span className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF]">{ticket.priority}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block mb-1">Category</span>
                                    <span className="text-sm text-[#66736F] dark:text-[#A3B0AB]">{ticket.category}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-[#66736F] dark:text-[#A3B0AB] block mb-1">Created At</span>
                                    <span className="text-sm text-[#66736F] dark:text-[#A3B0AB] flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> 
                                        {new Date(ticket.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        {ticket.SupportAttachments && ticket.SupportAttachments.length > 0 && (
                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-5 shadow-sm">
                                <h3 className="text-sm font-bold font-heading text-[#263238] dark:text-[#F7F5EF] mb-4 border-b border-[#E3DED2] dark:border-[#2A403A] pb-2 flex items-center justify-between">
                                    Attachments <span className="bg-[#EEF2ED] dark:bg-[#213530] text-[#66736F] dark:text-[#A3B0AB] border border-[#E3DED2] dark:border-[#2A403A] px-2 py-0.5 rounded text-[10px]">{ticket.SupportAttachments.length}</span>
                                </h3>
                                <div className="space-y-2">
                                    {ticket.SupportAttachments.map((att) => (
                                        <a key={att.id} href={`${getBackendBaseURL()}${att.file_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg group cursor-pointer hover:border-[#173F3A] dark:hover:border-[#EEF2ED] transition-colors">
                                            <div className="p-2 bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded text-[#66736F] dark:text-[#A3B0AB] group-hover:text-[#173F3A] dark:group-hover:text-[#EEF2ED] transition-colors">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-[#263238] dark:text-[#F7F5EF] truncate">{att.file_name}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                </div>
            </div>
        </div>
    );
}
