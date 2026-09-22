import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';

import { getBackendURL } from '../utils/api';

const AdminDataStatus = () => {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSystemStatus();
    }, []);

    const fetchSystemStatus = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const res = await axios.get(`${getBackendURL()}/admin/system-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatusData(res.data.metrics);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load system status.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center flex flex-col items-center justify-center min-h-[50vh]">
                <Spinner animation="border" className="text-[#173F3A] dark:text-[#EEF2ED] animate-spin" />
                <h5 className="mt-4 text-[#263238] dark:text-[#F7F5EF] font-manrope font-medium">Analyzing Dataset Telemetry...</h5>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert variant="danger" className="bg-[#B94A48]/10 text-[#B94A48] border border-[#B94A48]/20 rounded-lg p-4 font-inter">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="py-12 bg-[#F7F5EF] dark:bg-[#12201D] text-[#263238] dark:text-[#F7F5EF] min-h-screen font-inter transition-colors duration-300">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto px-4">
                <h2 className="mb-4 text-center font-bold text-3xl font-manrope text-[#173F3A] dark:text-[#EEF2ED]">
                    <i className="bi bi-database-check me-2"></i> Data Integration & Validation Admin
                </h2>
                <p className="text-center text-[#66736F] dark:text-[#A3B0AB] mb-12 max-w-2xl mx-auto">
                    Live telemetry of uploaded datasets, RAG knowledge graph state, and system search metrics.
                </p>

                <Row className="g-6 mb-4">
                    <Col md={4} className="mb-6 md:mb-0">
                        <Card className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <Card.Body className="text-center p-6">
                                <h5 className="text-[#173F3A] dark:text-[#EEF2ED] mb-4 font-manrope font-semibold"><i className="bi bi-train-freight-front me-2"></i> Records Loaded</h5>
                                <div className="text-5xl font-bold text-[#D96C4F] dark:text-[#E5B85C] mb-2">{statusData?.records_loaded?.trains || 0}</div>
                                <div className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Total Trains Indexed</div>
                                <hr className="border-[#E3DED2] dark:border-[#2A403A] my-4" />
                                <div className="flex justify-between text-[#263238] dark:text-[#F7F5EF] text-sm font-medium">
                                    <span>Stations: {statusData?.records_loaded?.stations || 0}</span>
                                    <span>Schedules: {statusData?.records_loaded?.schedules || 0}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    <Col md={4} className="mb-6 md:mb-0">
                        <Card className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <Card.Body className="text-center p-6">
                                <h5 className="text-[#173F3A] dark:text-[#EEF2ED] mb-4 font-manrope font-semibold"><i className="bi bi-diagram-3 me-2"></i> RAG Knowledge Status</h5>
                                <div className="text-5xl font-bold text-[#D96C4F] dark:text-[#E5B85C] mb-2">{statusData?.rag_status?.documents_indexed || 0}</div>
                                <div className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Documents Indexed</div>
                                <hr className="border-[#E3DED2] dark:border-[#2A403A] my-4" />
                                <div className="flex justify-between text-[#263238] dark:text-[#F7F5EF] text-sm font-medium">
                                    <span>Vector Embeddings: {statusData?.rag_status?.embeddings || 0}</span>
                                    <span>Text Chunks: {statusData?.rag_status?.chunks || 0}</span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] h-full rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <Card.Body className="text-center p-6">
                                <h5 className="text-[#173F3A] dark:text-[#EEF2ED] mb-4 font-manrope font-semibold"><i className="bi bi-cpu me-2"></i> AI Search Accuracy</h5>
                                <div className="text-5xl font-bold text-[#D96C4F] dark:text-[#E5B85C] mb-2">{statusData?.search_accuracy || 'N/A'}</div>
                                <div className="text-[#66736F] dark:text-[#A3B0AB] text-sm">Avg Model Confidence Score</div>
                                <hr className="border-[#E3DED2] dark:border-[#2A403A] my-4" />
                                <div className="flex justify-between items-center text-[#263238] dark:text-[#F7F5EF] text-sm font-medium">
                                    <span>Dataset Integration:</span>
                                    <Badge className={`${statusData?.dataset_status === 'Active' ? 'bg-[#4F7D62] text-white' : 'bg-[#B94A48] text-white'} px-3 py-1 rounded-full font-normal`}>
                                        {statusData?.dataset_status || 'Empty'}
                                    </Badge>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </motion.div>
        </Container>
    );
};

export default AdminDataStatus;
