const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY;

if (!INTERNAL_SERVICE_KEY && process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL] INTERNAL_SERVICE_KEY is required in production.');
}

const aiClient = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        ...(INTERNAL_SERVICE_KEY ? { 'X-Internal-Service-Key': INTERNAL_SERVICE_KEY } : {})
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
    try {
        const response = await aiClient.post('/predict-delay', delayData);
        return response.data;
    } catch (err) {
        console.warn(`[aiService.predictDelay] AI microservice call failed (${err.message}). Using telemetry heuristic fallback.`);
        const trainNumInt = parseInt(delayData.train_number) || 12000;
        const isRajdhaniOrShatabdi = [12001, 12002, 12004, 12301, 12302, 12423, 12424].includes(trainNumInt);
        const isSuperfast = trainNumInt >= 12000 && trainNumInt < 13000;
        
        const arrDelay = isRajdhaniOrShatabdi ? 6 : isSuperfast ? 14 : 28;
        const depDelay = isRajdhaniOrShatabdi ? 2 : isSuperfast ? 8 : 18;
        const prob = isRajdhaniOrShatabdi ? 16.5 : isSuperfast ? 32.0 : 48.0;

        return {
            expected_arrival_delay_mins: arrDelay,
            expected_departure_delay_mins: depDelay,
            delay_probability: prob,
            confidence: 88.0,
            fallback: true
        };
    }
};

const predictFare = async (fareData) => {
    try {
        const response = await aiClient.post('/predict-fare', fareData);
        return response.data;
    } catch (err) {
        console.warn(`[aiService.predictFare] AI microservice call failed (${err.message}). Using telemetry heuristic fallback.`);
        const currentFare = parseFloat(fareData.current_fare) || 1200.0;
        const forecasted = Math.round(currentFare * 1.08);
        return {
            current_fare: currentFare,
            forecasted_fare_7d: forecasted,
            recommendation: "Book Now",
            demand_level: "High",
            fallback: true
        };
    }
};

const predictCrowd = async (crowdData) => {
    try {
        const response = await aiClient.post('/predict-crowd', crowdData);
        return response.data;
    } catch (err) {
        console.warn(`[aiService.predictCrowd] AI microservice call failed (${err.message}). Using telemetry heuristic fallback.`);
        const hour = parseInt(crowdData.hour_of_day) || 12;
        const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
        return {
            crowd_level: isPeak ? "High" : "Moderate",
            expected_crowd_percent: isPeak ? 74.0 : 45.0,
            platform_congestion_percent: isPeak ? 68.0 : 38.0,
            peak_time_alert: isPeak,
            fallback: true
        };
    }
};

const predictOccupancy = async (occupancyData) => {
    try {
        const response = await aiClient.post('/predict-occupancy', occupancyData);
        return response.data;
    } catch (err) {
        console.warn(`[aiService.predictOccupancy] AI microservice call failed (${err.message}). Using telemetry heuristic fallback.`);
        return {
            predicted_occupancy: 68.5,
            waitlist_clearing_chance: 72.0,
            status: "RAC / High Confirmation Probability",
            fallback: true
        };
    }
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
