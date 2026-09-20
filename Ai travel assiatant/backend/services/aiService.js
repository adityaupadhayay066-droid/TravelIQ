const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const predictPrice = async (tripData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-price`, tripData);
    return response.data;
};

const predictTime = async (tripData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-time`, tripData);
    return response.data;
};

const optimizeRoute = async (routeData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/optimize-route`, routeData);
    return response.data;
};

const predictDelay = async (delayData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-delay`, delayData);
    return response.data;
};

const predictFare = async (fareData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-fare`, fareData);
    return response.data;
};

const predictCrowd = async (crowdData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-crowd`, crowdData);
    return response.data;
};

const predictOccupancy = async (occupancyData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-occupancy`, occupancyData);
    return response.data;
};

const recommendRoute = async (routeRecData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/recommend-route`, routeRecData);
    return response.data;
};

const recommendFood = async (foodRecData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/recommend-food`, foodRecData);
    return response.data;
};

const predictBehavior = async (behaviorData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/predict-behavior`, behaviorData);
    return response.data;
};

const retrainModels = async () => {
    const response = await axios.post(`${AI_SERVICE_URL}/retrain`);
    return response.data;
};

const getModelMetrics = async () => {
    const response = await axios.get(`${AI_SERVICE_URL}/model-metrics`);
    return response.data;
};

const uploadRAGDocument = async (filePath, filename, category) => {
    const response = await axios.post(`${AI_SERVICE_URL}/rag/upload`, {
        file_path: filePath,
        filename: filename,
        category: category
    });
    return response.data;
};

const queryRAG = async (query, userId) => {
    const response = await axios.post(`${AI_SERVICE_URL}/rag/query`, {
        query,
        user_id: userId
    });
    return response.data;
};

const parseVoiceCommand = async (text, language, userId) => {
    const response = await axios.post(`${AI_SERVICE_URL}/voice/respond`, {
        text,
        language,
        user_id: userId
    });
    return response.data;
};

const queryCopilot = async (query, userId) => {
    const response = await axios.post(`${AI_SERVICE_URL}/copilot/query`, {
        query,
        user_id: userId
    });
    return response.data;
};

const getMemoryProfile = async (userId) => {
    const response = await axios.post(`${AI_SERVICE_URL}/memory/profile`, {
        user_id: userId
    });
    return response.data;
};

const updateMemoryProfile = async (profileData) => {
    const response = await axios.post(`${AI_SERVICE_URL}/memory/update`, profileData);
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
