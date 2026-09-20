import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Plus, Edit2, Trash2, Search, Save, X, BookOpen, Upload, RefreshCw, FileText, Database, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function AdminChatbotManager() {
  const [activeTab, setActiveTab] = useState('static'); // 'static' or 'rag'
  
  // Static FAQ State
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ question: '', keywords: '', answer: '', category: 'General' });
  const [isSaving, setIsSaving] = useState(false);

  // RAG State
  const [ragStats, setRagStats] = useState({
    kb_size_kb: '0.00',
    documents_indexed: 0,
    chunks_indexed: 0,
    queries_processed: 0,
    response_accuracy: '0.00',
    vector_db_status: 'Empty'
  });
  const [ragDocuments, setRagDocuments] = useState([]);
  const [loadingRAG, setLoadingRAG] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Travel Guide');
  const [isUploading, setIsUploading] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildLogs, setRebuildLogs] = useState('');

  useEffect(() => {
    fetchKnowledge();
    fetchRAGData();
  }, []);

  // ─── Static FAQ Handlers ───
  const fetchKnowledge = async () => {
    try {
      const { data } = await api.get('/admin/chatbot/knowledge');
      setKnowledge(data);
    } catch (err) {
      toast.error('Failed to fetch knowledge base.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (entry = null) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        question: entry.question,
        keywords: entry.keywords,
        answer: entry.answer,
        category: entry.category
      });
    } else {
      setEditingId(null);
      setFormData({ question: '', keywords: '', answer: '', category: 'General' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.question || !formData.keywords || !formData.answer) {
      return toast.error('Please fill in all required fields.');
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const { data } = await api.put(`/admin/chatbot/knowledge/${editingId}`, formData);
        setKnowledge(knowledge.map(k => k.id === editingId ? data : k));
        toast.success('Entry updated successfully.');
      } else {
        const { data } = await api.post('/admin/chatbot/knowledge', formData);
        setKnowledge([data, ...knowledge]);
        toast.success('Entry added successfully.');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chatbot response?')) return;
    
    try {
      await api.delete(`/admin/chatbot/knowledge/${id}`);
      setKnowledge(knowledge.filter(k => k.id !== id));
      toast.success('Entry deleted.');
    } catch (err) {
      toast.error('Failed to delete entry.');
    }
  };

  // ─── RAG Document Handlers ───
  const fetchRAGData = async () => {
    setLoadingRAG(true);
    try {
      const statsRes = await api.get('/rag/stats');
      setRagStats(statsRes.data);
      const docsRes = await api.get('/rag/documents');
      setRagDocuments(docsRes.data);
    } catch (err) {
      console.error('Failed to fetch RAG stats:', err);
    } finally {
      setLoadingRAG(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return toast.error('Please select a file to upload.');

    setIsUploading(true);
    const formDataObj = new FormData();
    formDataObj.append('file', uploadFile);
    formDataObj.append('category', uploadCategory);

    try {
      const res = await api.post('/rag/upload', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(res.data.message || 'File indexed successfully.');
      setUploadFile(null);
      
      // Reset input element
      const fileInput = document.getElementById('rag-file-input');
      if (fileInput) fileInput.value = '';

      fetchRAGData(); // Refresh list and stats
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload and index document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRAGDoc = async (id) => {
    if (!window.confirm('Are you sure you want to delete this RAG document? All associated chunks and embeddings will be wiped.')) return;
    
    try {
      await api.delete(`/rag/documents/${id}`);
      toast.success('Document vectors removed.');
      fetchRAGData();
    } catch (err) {
      toast.error('Failed to delete RAG document.');
    }
  };

  const handleRebuildIndex = async () => {
    if (!window.confirm('WARNING: Rebuilding index will reprocess all uploaded documents from scratch. This can take several seconds.')) return;
    
    setIsRebuilding(true);
    setRebuildLogs('Initializing vector reindexing...\nClearing old database chunks...\n');
    
    try {
      const res = await api.post('/rag/rebuild');
      setRebuildLogs(prev => prev + `Success: ${res.data.message}\nReindexing finished.\n`);
      toast.success('RAG Knowledge base successfully rebuilt!');
      fetchRAGData();
    } catch (err) {
      setRebuildLogs(prev => prev + `Fatal Error: ${err.message}\nRebuild aborted.\n`);
      toast.error('Failed to rebuild vector database.');
    } finally {
      setIsRebuilding(false);
    }
  };

  const filteredKnowledge = knowledge.filter(k => 
    k.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.keywords.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] pt-24 flex justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pt-24 px-4 pb-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)] flex items-center gap-3">
              <Bot className="w-8 h-8 text-[var(--color-primary)]" />
              Chatbot Brain Manager
            </h1>
            <p className="text-[var(--color-text-muted)] mt-2">Manage the local knowledge base, vector database, and custom FAQ responses.</p>
          </div>
        </div>

        {/* Tabs Selection */}
        <div className="flex border-b border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab('static')}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'static'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-soft)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Static FAQ Responses
          </button>
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'rag'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-soft)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Advanced AI RAG Engine
          </button>
        </div>

        {/* Tab Content 1: Static FAQs */}
        {activeTab === 'static' && (
          <div className="space-y-6">
            {/* Search and Add Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="travel-card rounded-xl p-3 flex items-center gap-3 w-full md:max-w-md">
                <Search className="text-[var(--color-text-muted)] w-5 h-5 ml-2" />
                <input 
                  type="text"
                  placeholder="Search questions or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--color-text)] placeholder-[var(--color-text-muted)] text-sm"
                />
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="btn-primary flex items-center gap-2 w-full md:w-auto justify-center"
              >
                <Plus className="w-5 h-5" /> Add New Response
              </button>
            </div>

            {/* Knowledge Table */}
            <div className="travel-card rounded-xl overflow-hidden border border-[var(--color-border)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-soft)] text-[var(--color-text)] font-semibold uppercase text-xs tracking-wider border-b border-[var(--color-border)]">
                    <tr>
                      <th className="px-6 py-4">Question & Category</th>
                      <th className="px-6 py-4">Trigger Keywords</th>
                      <th className="px-6 py-4">Bot Answer</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                    {filteredKnowledge.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50 text-[var(--color-primary)]" />
                          <p>No knowledge base entries found.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredKnowledge.map(entry => (
                        <tr key={entry.id} className="hover:bg-[var(--color-bg)] transition-colors">
                          <td className="px-6 py-4 align-top">
                            <p className="text-[var(--color-text)] font-medium mb-1">{entry.question}</p>
                            <span className="travel-badge inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">
                              {entry.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-wrap gap-1.5">
                              {entry.keywords.split(',').map((kw, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-[var(--color-soft)] text-[var(--color-text-muted)] text-xs border border-[var(--color-border)]">
                                  {kw.trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <p className="text-[var(--color-text-muted)] line-clamp-2" title={entry.answer}>{entry.answer}</p>
                          </td>
                          <td className="px-6 py-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleOpenModal(entry)} className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-soft)] rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(entry.id)} className="p-2 text-[var(--color-danger)] hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Advanced AI RAG */}
        {activeTab === 'rag' && (
          <div className="space-y-6">
            
            {/* 1. Telemetry Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { title: 'Indexed Files', val: ragStats.documents_indexed, icon: FileText },
                { title: 'Extracted Chunks', val: ragStats.chunks_indexed, icon: Cpu },
                { title: 'Queries Routed', val: ragStats.queries_processed, icon: Bot },
                { title: 'Avg Score / Accuracy', val: `${ragStats.response_accuracy}%`, icon: CheckCircle },
                { title: 'V-DB Size', val: `${ragStats.kb_size_kb} KB`, icon: Database },
                { title: 'Vector Status', val: ragStats.vector_db_status, icon: ShieldAlert },
              ].map((card, idx) => (
                <div key={idx} className="travel-card rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{card.title}</span>
                    <card.icon className="h-5 w-5 p-1 rounded-lg text-[var(--color-primary)] bg-[var(--color-soft)]" />
                  </div>
                  <span className="text-xl font-bold text-[var(--color-text)] mt-1">{card.val}</span>
                </div>
              ))}
            </div>

            {/* 2. Upload Portal & Rebuild Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Card */}
              <div className="lg:col-span-2 travel-card rounded-xl p-5 flex flex-col gap-4">
                <h2 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[var(--color-primary)]" />
                  Upload Knowledge Document
                </h2>

                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">Category</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="travel-input w-full text-xs"
                      >
                        <option value="Travel Guide">Travel Guide</option>
                        <option value="Station FAQ">Station FAQ</option>
                        <option value="Occupancy Manual">Occupancy Manual</option>
                        <option value="General Support">General Support</option>
                      </select>
                    </div>

                    <div className="flex-[2]">
                      <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">Select Document (.pdf, .txt, .json, .csv)</label>
                      <input
                        id="rag-file-input"
                        type="file"
                        accept=".pdf,.txt,.json,.csv"
                        onChange={(e) => setUploadFile(e.target.files[0])}
                        className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-soft)] file:text-[var(--color-primary)] file:cursor-pointer hover:file:bg-[var(--color-primary)] hover:file:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Extracting Text & Embedding Vectors...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        Start Vector Ingestion
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Vector Rebuild Card */}
              <div className="travel-card rounded-xl p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[var(--color-accent)]" />
                  Reindexing Controls
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Triggers parsing reindexing of all uploaded files in the Python semantic engine. Cleans and aligns vocabulary.
                </p>

                <button
                  onClick={handleRebuildIndex}
                  disabled={isRebuilding}
                  className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRebuilding ? 'animate-spin' : ''}`} />
                  {isRebuilding ? 'Rebuilding Index...' : 'Rebuild Knowledge Base'}
                </button>

                {/* Simulated build logs console output */}
                {(rebuildLogs || isRebuilding) && (
                  <div className="mt-2 flex-1 min-h-[90px] bg-[#263238] rounded-lg p-3 font-mono text-[9px] text-[#EEF2ED] overflow-y-auto whitespace-pre-wrap leading-tight shadow-inner">
                    {rebuildLogs}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Uploaded Documents List */}
            <div className="travel-card rounded-xl overflow-hidden border border-[var(--color-border)]">
              <div className="px-5 py-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface)]">
                <h3 className="text-sm font-bold text-[var(--color-text)] uppercase tracking-wider">Indexed Documents</h3>
                <button onClick={fetchRAGData} className="p-1 hover:bg-[var(--color-soft)] rounded transition text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto bg-[var(--color-surface)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--color-soft)] text-[var(--color-text)] uppercase tracking-wider border-b border-[var(--color-border)] font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Filename</th>
                      <th className="px-6 py-3.5">Format</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Processing Status</th>
                      <th className="px-6 py-3.5">Ingested On</th>
                      <th className="px-6 py-3.5 text-right">Wipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                    {loadingRAG ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--color-primary)]" />
                          Loading vector index entries...
                        </td>
                      </tr>
                    ) : ragDocuments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-[var(--color-text-muted)]">
                          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50 text-[var(--color-primary)]" />
                          No document files indexed yet.
                        </td>
                      </tr>
                    ) : (
                      ragDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[var(--color-bg)] transition">
                          <td className="px-6 py-3 font-medium text-[var(--color-text)]">{doc.filename}</td>
                          <td className="px-6 py-3 uppercase text-[var(--color-text-muted)]">{doc.file_type}</td>
                          <td className="px-6 py-3 text-[var(--color-text-muted)]">{doc.category}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              doc.status === 'indexed' ? 'bg-[#4F7D62]/10 text-[#4F7D62] border-[#4F7D62]/20' :
                              doc.status === 'failed' ? 'bg-[#B94A48]/10 text-[#B94A48] border-[#B94A48]/20' :
                              'bg-[#E5B85C]/10 text-[#E5B85C] border-[#E5B85C]/20 animate-spin-none'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-[var(--color-text-muted)]">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleDeleteRAGDoc(doc.id)}
                              className="p-1 text-[var(--color-danger)] hover:bg-red-50 rounded transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Editor Modal for FAQ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#263238]/60"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="travel-card relative z-10 w-full max-w-lg p-6 rounded-xl shadow-lg border border-[var(--color-border)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
                  {editingId ? <Edit2 className="w-5 h-5 text-[var(--color-primary)]"/> : <Plus className="w-5 h-5 text-[var(--color-primary)]"/>}
                  {editingId ? 'Edit Knowledge Entry' : 'Add New Knowledge Entry'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X className="w-5 h-5"/></button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Target Question Example</label>
                  <input 
                    required type="text" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})}
                    placeholder="e.g. How do I reset my password?"
                    className="travel-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Keywords (comma separated)</label>
                  <input 
                    required type="text" value={formData.keywords} onChange={e => setFormData({...formData, keywords: e.target.value})}
                    placeholder="e.g. password, reset, forgot, account"
                    className="travel-input w-full"
                  />
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">The bot uses these to match user queries via fuzzy search.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Category</label>
                  <select 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="travel-input w-full"
                  >
                    <option value="General">General</option>
                    <option value="Account">Account Settings</option>
                    <option value="Booking">Booking & Travel</option>
                    <option value="Support">Support & Contact</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Bot Answer</label>
                  <textarea 
                    required rows="4" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})}
                    placeholder="Type the exact response the bot should give..."
                    className="travel-input w-full resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Entry'}
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
