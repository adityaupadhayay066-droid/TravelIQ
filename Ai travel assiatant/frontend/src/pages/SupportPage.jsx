import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Plus, Search, MessageSquare, ChevronDown, ChevronUp, Clock, AlertCircle, FileText, CheckCircle, Upload, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const FAQS = [
    { q: "How to search trains?", a: "Enter your source and destination stations on the home page, select your date, and click Search." },
    { q: "How to track trains?", a: "Go to the 'Live Tracking' section from the top navigation and enter your Train Number." },
    { q: "How to book tickets?", a: "Select a train from your search results, choose your preferred class, and click 'Book Now' to proceed with payment." },
    { q: "How to reset password?", a: "Click on 'Forgot Password' at the login screen and follow the instructions sent to your email." },
    { q: "How to contact support?", a: "You can create a support ticket directly from this page using the 'Create Ticket' tab." }
];

const CATEGORIES = [
    'Train Search Issue', 'Booking Issue', 'Payment Issue', 'Login Issue', 
    'Profile Issue', 'Live Tracking Issue', 'Food Module Issue', 
    'Technical Bug', 'Feature Request', 'Other'
];

export default function SupportPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('My Tickets');
    const [openFaq, setOpenFaq] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // Mock User (replace with actual auth context in production)
    const mockUser = { id: 1, name: 'Aditya' };

    useEffect(() => {
        if (activeTab === 'My Tickets') {
            fetchTickets();
        }
    }, [activeTab]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/support');
            setTickets(data.tickets || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if(!subject.trim() || !description.trim()) {
            return toast.error("Subject and Description are required");
        }

        const toastId = toast.loading("Creating Support Ticket...");
        
        try {
            const formData = new FormData();
            formData.append('category', category);
            formData.append('subject', subject);
            formData.append('message', description);
            formData.append('priority', priority);
            if (file) formData.append('attachments', file);

            const { data } = await api.post('/support', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success(`Support Ticket Created Successfully: TRV-${data.ticket.id.toString().padStart(5, '0')}`, { id: toastId });
            
            // Reset form
            setSubject('');
            setDescription('');
            setCategory(CATEGORIES[0]);
            setPriority('Medium');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            setActiveTab('My Tickets');
            
        } catch(err) {
            toast.error("Failed to create ticket", { id: toastId });
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Open': return 'bg-[#EEF2ED] text-[#173F3A] border-[#173F3A]/20 dark:bg-[#213530] dark:text-[#EEF2ED]';
            case 'In Progress': return 'bg-[#E5B85C]/10 text-[#E5B85C] border-[#E5B85C]/20';
            case 'Resolved': return 'bg-[#4F7D62]/10 text-[#4F7D62] border-[#4F7D62]/20';
            case 'Closed': return 'bg-[#66736F]/10 text-[#66736F] border-[#66736F]/20 dark:text-[#A3B0AB]';
            case 'Rejected': return 'bg-[#B94A48]/10 text-[#B94A48] border-[#B94A48]/20';
            default: return 'bg-[#66736F]/10 text-[#66736F] border-[#66736F]/20 dark:text-[#A3B0AB]';
        }
    };

    const getPriorityColor = (priority) => {
        switch(priority) {
            case 'Low': return 'text-[#66736F] dark:text-[#A3B0AB]';
            case 'Medium': return 'text-[#173F3A] dark:text-[#EEF2ED]';
            case 'High': return 'text-[#E5B85C]';
            case 'Critical': return 'text-[#D96C4F] font-bold';
            default: return 'text-[#66736F] dark:text-[#A3B0AB]';
        }
    };

    return (
        <div className="flex-1 bg-[#F7F5EF] dark:bg-[#12201D] min-h-screen pb-12 transition-colors duration-300 font-sans">
            
            {/* Header Area */}
            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border-b border-[#E3DED2] dark:border-[#2A403A] pt-8 pb-6 px-4 md:px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2 flex items-center gap-3">
                            <HelpCircle className="w-8 h-8 text-[#D96C4F]" /> Help & Support
                        </h1>
                        <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm max-w-2xl">
                            We're here to help. Create a support ticket, track your issues, or browse our frequently asked questions.
                        </p>
                    </div>

                    <div className="flex bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-1">
                        {['My Tickets', 'Create Ticket', 'FAQs'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                                    activeTab === tab 
                                        ? 'bg-[#FFFFFF] dark:bg-[#1B2C28] text-[#173F3A] dark:text-[#EEF2ED] shadow-sm' 
                                        : 'text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
                
                {/* TAB: MY TICKETS */}
                {activeTab === 'My Tickets' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF]">Your Support Tickets</h2>
                            <button 
                                onClick={() => setActiveTab('Create Ticket')}
                                className="bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-white dark:text-[#12201D] px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> New Ticket
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center">
                                <div className="w-8 h-8 border-3 border-[#173F3A]/30 border-t-[#173F3A] dark:border-[#EEF2ED]/30 dark:border-t-[#EEF2ED] rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Loading tickets...</p>
                            </div>
                        ) : tickets.length > 0 ? (
                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
                                <div className="overflow-x-auto scrollbar-none">
                                    <div className="min-w-[700px]">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-4 p-4 bg-[#EEF2ED] dark:bg-[#213530] border-b border-[#E3DED2] dark:border-[#2A403A] text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">
                                            <div className="col-span-3">Ticket ID & Subject</div>
                                            <div className="col-span-2 text-center">Category</div>
                                            <div className="col-span-2 text-center">Status</div>
                                            <div className="col-span-2 text-center">Priority</div>
                                            <div className="col-span-2 text-center">Created</div>
                                            <div className="col-span-1 text-center">Action</div>
                                        </div>

                                        {/* Table Body */}
                                        <div className="divide-y divide-[#E3DED2] dark:divide-[#2A403A]">
                                            {tickets.map(ticket => (
                                                <div key={ticket.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[#F7F5EF] dark:hover:bg-[#213530]/50 transition-colors">
                                                    <div className="col-span-3">
                                                        <p className="text-sm font-bold text-[#263238] dark:text-[#F7F5EF] truncate" title={ticket.subject}>{ticket.subject}</p>
                                                        <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-mono mt-1 block">TRV-{ticket.id.toString().padStart(5, '0')}</span>
                                                    </div>
                                                    
                                                    <div className="col-span-2 text-center">
                                                        <span className="text-xs text-[#263238] dark:text-[#F7F5EF]">{ticket.category}</span>
                                                    </div>

                                                    <div className="col-span-2 flex justify-center">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ticket.status)}`}>
                                                            {ticket.status}
                                                        </span>
                                                    </div>

                                                    <div className="col-span-2 text-center">
                                                        <span className={`text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                                                    </div>
                                                    
                                                    <div className="col-span-2 text-center">
                                                        <span className="text-xs text-[#66736F] dark:text-[#A3B0AB]">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                                    </div>

                                                    <div className="col-span-1 flex justify-center">
                                                        <Link 
                                                            to={`/support/ticket/${ticket.id}`}
                                                            className="p-2 bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg text-[#66736F] dark:text-[#A3B0AB] hover:text-[#D96C4F] dark:hover:text-[#D96C4F] hover:border-[#D96C4F]/50 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-12 text-center shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
                                <FileText className="w-12 h-12 text-[#66736F] dark:text-[#A3B0AB] mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-[#263238] dark:text-[#F7F5EF] mb-2">No Support Tickets</h3>
                                <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm mb-6">You haven't opened any support requests yet.</p>
                                <button 
                                    onClick={() => setActiveTab('Create Ticket')}
                                    className="bg-[#173F3A] hover:bg-[#0F332F] dark:bg-[#EEF2ED] dark:hover:bg-[#FFFFFF] text-white dark:text-[#12201D] px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Create a Ticket
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: CREATE TICKET */}
                {activeTab === 'Create Ticket' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(23,63,58,0.06)]">
                            <h2 className="text-xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-6 border-b border-[#E3DED2] dark:border-[#2A403A] pb-4">Submit a Support Request</h2>
                            
                            <form onSubmit={handleCreateTicket} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Issue Category *</label>
                                        <select 
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 text-[#263238] dark:text-[#F7F5EF] text-sm focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none transition-all"
                                            required
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Priority Level</label>
                                        <select 
                                            value={priority}
                                            onChange={e => setPriority(e.target.value)}
                                            className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 text-[#263238] dark:text-[#F7F5EF] text-sm focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none transition-all"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                            <option value="Critical">Critical</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Subject *</label>
                                    <input 
                                        type="text" 
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        placeholder="Brief summary of the issue"
                                        className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 text-[#263238] dark:text-[#F7F5EF] text-sm focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none transition-all"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Detailed Description *</label>
                                    <textarea 
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Please provide as much detail as possible to help us resolve your issue..."
                                        rows="5"
                                        className="w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg p-3 text-[#263238] dark:text-[#F7F5EF] text-sm focus:border-[#173F3A] dark:focus:border-[#EEF2ED] focus:ring-1 focus:ring-[#173F3A] dark:focus:ring-[#EEF2ED] outline-none transition-all resize-none"
                                        required
                                    ></textarea>
                                </div>

                                {/* File Upload */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[#66736F] dark:text-[#A3B0AB] uppercase tracking-wider">Screenshot (Optional)</label>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            className="bg-[#F7F5EF] dark:bg-[#12201D] border border-[#E3DED2] dark:border-[#2A403A] hover:border-[#173F3A] dark:hover:border-[#EEF2ED] text-[#263238] dark:text-[#F7F5EF] px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Upload className="w-4 h-4" /> Choose File
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={e => setFile(e.target.files[0])}
                                            className="hidden" 
                                            accept="image/*"
                                        />
                                        {file && (
                                            <div className="flex items-center gap-2 bg-[#EEF2ED] dark:bg-[#213530] text-[#173F3A] dark:text-[#EEF2ED] px-3 py-2 rounded-lg text-sm border border-[#173F3A]/20 dark:border-[#EEF2ED]/20">
                                                <CheckCircle className="w-4 h-4" /> {file.name}
                                                <button type="button" onClick={() => setFile(null)} className="ml-2 hover:text-[#D96C4F]"><X className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                        {!file && <span className="text-xs text-[#66736F] dark:text-[#A3B0AB]">Max size: 5MB</span>}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#E3DED2] dark:border-[#2A403A] flex justify-end">
                                    <button 
                                        type="submit"
                                        className="bg-[#D96C4F] hover:bg-[#C75D43] text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        Submit Ticket
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TAB: FAQs */}
                {activeTab === 'FAQs' && (
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-[#263238] dark:text-[#F7F5EF] mb-2">Frequently Asked Questions</h2>
                            <p className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Find quick answers to common issues.</p>
                        </div>

                        {FAQS.map((faq, idx) => (
                            <div key={idx} className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl overflow-hidden transition-all shadow-sm">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none hover:bg-[#F7F5EF] dark:hover:bg-[#12201D] transition-colors"
                                >
                                    <span className="font-bold text-[#263238] dark:text-[#F7F5EF]">{faq.q}</span>
                                    {openFaq === idx ? <ChevronUp className="w-5 h-5 text-[#D96C4F]" /> : <ChevronDown className="w-5 h-5 text-[#66736F] dark:text-[#A3B0AB]" />}
                                </button>
                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-5 pt-0 text-[#66736F] dark:text-[#A3B0AB] text-sm leading-relaxed border-t border-[#E3DED2] dark:border-[#2A403A] mt-2">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
