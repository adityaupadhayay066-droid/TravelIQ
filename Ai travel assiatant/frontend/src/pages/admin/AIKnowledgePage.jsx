import React, { useState } from 'react';
import { 
    Database, BookOpen, Plus, Trash2, RefreshCw, 
    Upload, FileText, CheckCircle, Clock, Layers 
} from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Modal from '../../components/admin/Modal';
import toast from 'react-hot-toast';

export default function AIKnowledgePage() {
    const [docs, setDocs] = useState([
        { id: 1, name: 'Indian_Railways_Catering_Rules_2026.pdf', category: 'Train Food & MRP', chunks: 142, status: 'Indexed', lastIndexed: '2 hours ago', size: '2.4 MB' },
        { id: 2, name: 'Varanasi_Heritage_Ghats_Guide.md', category: 'Destination Guide', chunks: 86, status: 'Indexed', lastIndexed: 'Yesterday', size: '1.1 MB' },
        { id: 3, name: 'Himalayan_Winter_Pass_Restrictions.docx', category: 'Safety & Weather', chunks: 54, status: 'Indexed', lastIndexed: '3 days ago', size: '820 KB' },
        { id: 4, name: 'Goa_Coastal_Transport_Regulations.pdf', category: 'Local Transport', chunks: 68, status: 'Processing', lastIndexed: 'Just now', size: '1.8 MB' },
        { id: 5, name: 'Puri_Temple_Darshan_Code_2026.pdf', category: 'Cultural Norms', chunks: 62, status: 'Indexed', lastIndexed: '5 days ago', size: '940 KB' }
    ]);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [docName, setDocName] = useState('');
    const [docCategory, setDocCategory] = useState('Destination Guide');

    const handleUpload = (e) => {
        e.preventDefault();
        const newDoc = {
            id: Date.now(),
            name: docName,
            category: docCategory,
            chunks: Math.floor(Math.random() * 80) + 40,
            status: 'Processing',
            lastIndexed: 'Just now',
            size: '1.2 MB'
        };
        setDocs([newDoc, ...docs]);
        toast.success(`Document "${docName}" uploaded and queued for RAG embedding.`);
        setShowUploadModal(false);
        setDocName('');

        // Simulate indexing complete after 3 seconds
        setTimeout(() => {
            setDocs(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'Indexed' } : d));
            toast.success(`RAG Indexing complete for ${docName}!`);
        }, 3000);
    };

    const handleReindex = (id) => {
        setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'Processing', lastIndexed: 'Re-indexing...' } : d));
        toast.success('Triggered embedding re-indexing.');
        setTimeout(() => {
            setDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'Indexed', lastIndexed: 'Just now' } : d));
            toast.success('Document chunks updated in vector database.');
        }, 2000);
    };

    const handleDelete = (id) => {
        setDocs(docs.filter(d => d.id !== id));
        toast.success('Knowledge document deleted.');
    };

    const columns = [
        {
            key: 'name',
            label: 'Document Name',
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-[var(--color-text)]">{val}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">{row.size} • {row.chunks} chunks</div>
                    </div>
                </div>
            )
        },
        {
            key: 'category',
            label: 'Category',
            render: (val) => (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-soft)] border border-[var(--color-border)] text-[var(--color-text)]">
                    {val}
                </span>
            )
        },
        {
            key: 'status',
            label: 'Indexing Status',
            render: (s) => <StatusBadge status={s} size="xs" />
        },
        {
            key: 'lastIndexed',
            label: 'Last Indexed',
            render: (val) => (
                <span className="text-xs text-[var(--color-text-muted)] font-mono">{val}</span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (_, row) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleReindex(row.id)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-sky-400 hover:bg-sky-500/10 transition"
                        title="Re-index Document"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Document"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-text)] font-heading">
                        AI Knowledge & RAG Documents
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">
                        Vector knowledge base, tourism guides, railway rulebooks, and chunk indexing.
                    </p>
                </div>

                <button
                    onClick={() => setShowUploadModal(true)}
                    className="btn-primary !h-9 !px-4 text-xs inline-flex items-center gap-1.5"
                >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Knowledge Doc</span>
                </button>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={docs}
                keyField="id"
                totalRecords={docs.length}
                searchPlaceholder="Search knowledge documents by name or category..."
            />

            {/* Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload Knowledge Base Document"
                subtitle="Upload guidebooks, fare rules, or itinerary data for vector embedding"
                size="md"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            className="btn-ghost text-xs !h-9"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={!docName}
                            className="btn-primary text-xs !h-9 !px-4"
                        >
                            Upload & Index Document
                        </button>
                    </>
                }
            >
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                            Document Title / File Name
                        </label>
                        <input
                            type="text"
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder="e.g. Kerala_Backwaters_Ferry_Timetable.pdf"
                            className="travel-input !h-10 !text-xs !rounded-xl"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--color-text)] mb-1.5">
                            Knowledge Category
                        </label>
                        <select
                            value={docCategory}
                            onChange={(e) => setDocCategory(e.target.value)}
                            className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:border-sky-500"
                        >
                            <option value="Destination Guide">Destination Guide</option>
                            <option value="Train Food & MRP">Train Food & Platform MRP</option>
                            <option value="Safety & Weather">Safety & Weather Restrictions</option>
                            <option value="Local Transport">Local Transport & Taxis</option>
                            <option value="Cultural Norms">Cultural & Temple Guidelines</option>
                        </select>
                    </div>

                    <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-6 text-center bg-[var(--color-soft)]/20">
                        <Upload className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
                        <p className="text-xs text-[var(--color-text)] font-semibold">Select PDF, Markdown, or Word file</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Vector chunking will run automatically</p>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
