const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'traveliq_internal_svc_token_secure_2026';

const aiClient = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': INTERNAL_SERVICE_KEY
    }
});

const predictPrice = async (tripData) => {
    const response = await aiClient.post('/predict-price', tripData);
    return response.data;
};

const predictTime = async (tripData) => {
    const response = await aiClient.post('/predict-time', tripData);
    return response.data;
};

const optimizeRoute = async (routeData) => {
    const response = await aiClient.post('/optimize-route', routeData);
    return response.data;
};

const predictDelay = async (delayData) => {
    const response = await aiClient.post('/predict-delay', delayData);
    return response.data;
};

const predictFare = async (fareData) => {
    const response = await aiClient.post('/predict-fare', fareData);
    return response.data;
};

const predictCrowd = async (crowdData) => {
    const response = await aiClient.post('/predict-crowd', crowdData);
    return response.data;
};

const predictOccupancy = async (occupancyData) => {
    const response = await aiClient.post('/predict-occupancy', occupancyData);
    return response.data;
};

const recommendRoute = async (routeRecData) => {
    const response = await aiClient.post('/recommend-route', routeRecData);
    return response.data;
};

const recommendFood = async (foodRecData) => {
    const response = await aiClient.post('/recommend-food', foodRecData);
    return response.data;
};

const predictBehavior = async (behaviorData) => {
    const response = await aiClient.post('/predict-behavior', behaviorData);
    return response.data;
};

const retrainModels = async () => {
    const response = await aiClient.post('/retrain');
    return response.data;
};

const getModelMetrics = async () => {
    const response = await aiClient.get('/model-metrics');
    return response.data;
};

const uploadRAGDocument = async (filePath, filename, category) => {
    const response = await aiClient.post('/rag/upload', {
        file_path: filePath,
        filename: filename,
        category: category
    });
    return response.data;
};

const queryRAG = async (query, userId) => {
    const response = await aiClient.post('/rag/query', {
        query,
        user_id: userId
    });
    return response.data;
};

const parseVoiceCommand = async (text, language, userId) => {
    const response = await aiClient.post('/voice/respond', {
        text,
        language,
        user_id: userId
    });
    return response.data;
};

const queryCopilot = async (query, userId) => {
    const response = await aiClient.post('/copilot/query', {
        query,
        user_id: userId
    });
    return response.data;
};

const getMemoryProfile = async (userId) => {
    const response = await aiClient.post('/memory/profile', {
        user_id: userId
    });
    return response.data;
};

const updateMemoryProfile = async (profileData) => {
    const response = await aiClient.post('/memory/update', profileData);
    return response.data;
};

module.exports = {
    predictPrice,
    predictTime,
    optimizeRoute,
    predictDelay,
    predictFare,
    predictCrowd,
    predictOccupancy,
    recommendRoute,
    recommendFood,
    predictBehavior,
    retrainModels,
    getModelMetrics,
    uploadRAGDocument,
    queryRAG,
    parseVoiceCommand,
    queryCopilot,
    getMemoryProfile,
    updateMemoryProfile
};
