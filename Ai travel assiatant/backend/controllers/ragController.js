const path = require('path');
const fs = require('fs');
const { KnowledgeDocument, DocumentChunk, Embedding, AiQuery, sequelize } = require('../models');
const aiService = require('../services/aiService');

// Get RAG Dashboard statistics
const getRAGStats = async (req, res) => {
    try {
        const documentsCount = await KnowledgeDocument.count();
        const chunksCount = await DocumentChunk.count();
        const queriesCount = await AiQuery.count();

        // Calculate total file size on disk for uploaded documents
        let totalSizeKB = 0;
        const docs = await KnowledgeDocument.findAll({ attributes: ['file_path'] });
        docs.forEach(doc => {
            if (doc.file_path && fs.existsSync(doc.file_path)) {
                try {
                    const stats = fs.statSync(doc.file_path);
                    totalSizeKB += stats.size / 1024;
                } catch (err) {
                    console.error('Error reading file size:', err);
                }
            }
        });

        // Calculate average accuracy (confidence score)
        const avgConfidenceRes = await AiQuery.findAll({
            attributes: [[sequelize.fn('AVG', sequelize.col('confidence_score')), 'avgConfidence']],
            raw: true
        });
        const avgConfidence = parseFloat(avgConfidenceRes[0]?.avgConfidence || 0).toFixed(2);

        // Vector DB Status check
        // Check if there are active embeddings
        const embeddingCount = await Embedding.count();
        const vectorDBStatus = embeddingCount > 0 ? 'Active' : 'Empty';

        return res.status(200).json({
            kb_size_kb: parseFloat(totalSizeKB).toFixed(2),
            documents_indexed: documentsCount,
            chunks_indexed: chunksCount,
            queries_processed: queriesCount,
            response_accuracy: avgConfidence,
            vector_db_status: vectorDBStatus
        });
    } catch (error) {
        console.error('Failed to get RAG stats:', error);
        return res.status(500).json({ message: 'Internal server error while fetching stats.' });
    }
};

// Get list of all knowledge documents
const getRAGDocuments = async (req, res) => {
    try {
        const docs = await KnowledgeDocument.findAll({
            order: [['created_at', 'DESC']]
        });
        return res.status(200).json(docs);
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        return res.status(500).json({ message: 'Failed to fetch knowledge documents.' });
    }
};

// Upload document & trigger ingestion
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided.' });
        }

        const category = req.body.category || 'Travel Guide';
        const file_path = path.resolve(req.file.path);
        const filename = req.file.originalname;
        const file_type = path.extname(filename).toLowerCase().replace('.', '');

        // 1. Create KnowledgeDocument entry
        const doc = await KnowledgeDocument.create({
            filename,
            file_type,
            file_path,
            category,
            status: 'processing'
        });

        // 2. Call python service for processing (runs in background or synchronously depending on uvicorn wait)
        try {
            const result = await aiService.uploadRAGDocument(file_path, filename, category);
            
            // 3. Update doc status based on python ingestion success
            if (result.success) {
                await doc.update({ status: 'indexed' });
                return res.status(200).json({
                    message: `File uploaded and successfully indexed! Ingested ${result.chunks_count} chunks.`,
                    document: doc
                });
            } else {
                await doc.update({ status: 'failed' });
                return res.status(500).json({ message: 'File processing failed in AI engine.', error: result.error });
            }
        } catch (aiErr) {
            console.error('AI Service RAG Ingestion Error:', aiErr);
            await doc.update({ status: 'failed' });
            return res.status(500).json({ message: 'Failed to connect to AI engine for text ingestion.', error: aiErr.message });
        }
    } catch (error) {
        console.error('Upload handler crash:', error);
        return res.status(500).json({ message: 'Internal server error during upload.' });
    }
};

// Perform RAG Query
const queryRAGEngine = async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!query) {
            return res.status(400).json({ message: 'Query string is required.' });
        }

        // Call Python AI Service RAG query
        const result = await aiService.queryRAG(query, userId);

        // Log query inside ai_queries database table
        await AiQuery.create({
            user_id: userId,
            query,
            response: result.response,
            confidence_score: result.confidence || 0.00,
            vector_db_status: result.vector_db_status || 'Active'
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('RAG query failure:', error);
        return res.status(500).json({ message: 'Internal server error while executing query.' });
    }
};

// Delete a document and its chunks/embeddings
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await KnowledgeDocument.findByPk(id);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }

        // Delete physical file if exists
        if (doc.file_path && fs.existsSync(doc.file_path)) {
            try {
                fs.unlinkSync(doc.file_path);
            } catch (err) {
                console.error('Error deleting physical file:', err);
            }
        }

        // Delete associated chunks and embeddings via cascading
        // In Sequelize, if onDelete: CASCADE is configured, deleting the doc will clean up chunks and embeddings
        // Let's manually double check or clean up chunks to be safe
        const chunks = await DocumentChunk.findAll({ where: { document_id: doc.id } });
        const chunkIds = chunks.map(c => c.id);
        
        if (chunkIds.length > 0) {
            await Embedding.destroy({ where: { chunk_id: chunkIds } });
            await DocumentChunk.destroy({ where: { document_id: doc.id } });
        }

        await doc.destroy();
        return res.status(200).json({ message: 'Document and all indexed vectors deleted successfully.' });
    } catch (error) {
        console.error('Failed to delete document:', error);
        return res.status(500).json({ message: 'Internal server error while deleting document.' });
    }
};

// Trigger full knowledge base rebuild
const rebuildRAGIndex = async (req, res) => {
    try {
        // Clear all chunks and embeddings
        await Embedding.destroy({ truncate: { cascade: true }, force: true });
        await DocumentChunk.destroy({ truncate: { cascade: true }, force: true });

        // Retrieve all files in knowledge_documents
        const docs = await KnowledgeDocument.findAll();
        
        let successCount = 0;
        let totalChunks = 0;

        for (const doc of docs) {
            if (doc.file_path && fs.existsSync(doc.file_path)) {
                try {
                    await doc.update({ status: 'processing' });
                    const result = await aiService.uploadRAGDocument(doc.file_path, doc.filename, doc.category);
                    if (result.success) {
                        await doc.update({ status: 'indexed' });
                        successCount++;
                        totalChunks += result.chunks_count;
                    } else {
                        await doc.update({ status: 'failed' });
                    }
                } catch (err) {
                    console.error(`Failed to re-index doc ${doc.filename}:`, err);
                    await doc.update({ status: 'failed' });
                }
            } else {
                await doc.update({ status: 'failed' });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Knowledge base rebuild complete. Reindexed ${successCount}/${docs.length} documents, generating ${totalChunks} total chunks.`
        });
    } catch (error) {
        console.error('Failed to rebuild knowledge base:', error);
        return res.status(500).json({ message: 'Failed to rebuild RAG index.' });
    }
};

module.exports = {
    getRAGStats,
    getRAGDocuments,
    uploadDocument,
    queryRAGEngine,
    deleteDocument,
    rebuildRAGIndex
};
