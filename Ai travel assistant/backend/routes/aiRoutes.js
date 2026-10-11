const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const {
    getDelayPrediction,
    getFareForecast,
    getCrowdPrediction,
    getOccupancyPrediction,
    getRouteRecommendation,
    getFoodRecommendation,
    getUserBehaviorProfile,
    triggerRetraining,
    getModelStatusMetrics,
    getCopilotQuery,
    getMemoryProfile,
    updateMemoryProfile
} = require('../controllers/aiController');

// Rate limiting on all AI intelligence endpoints
router.use(aiLimiter);

// All AI routes are protected by default to log telemetry mapped to users
router.post('/predict-delay', protect, getDelayPrediction);
router.post('/predict-fare', protect, getFareForecast);
router.post('/predict-crowd', protect, getCrowdPrediction);
router.post('/predict-occupancy', protect, getOccupancyPrediction);
router.post('/recommend-route', protect, getRouteRecommendation);
router.post('/recommend-food', protect, getFoodRecommendation);
router.post('/predict-behavior', protect, getUserBehaviorProfile);
router.post('/retrain', protect, triggerRetraining);
router.get('/model-metrics', protect, getModelStatusMetrics);
router.post('/copilot/query', protect, getCopilotQuery);
router.get('/memory/profile', protect, getMemoryProfile);
router.post('/memory/update', protect, updateMemoryProfile);

module.exports = router;
