const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { travelLimiter } = require('../middleware/rateLimiter');
const { 
    predictTrip, 
    optimizeTripRoute, 
    saveUserTrip, 
    getUserHistory,
    getUserAnalytics,
    searchRoutes,
    searchTrains,
    getLiveTrainStatus
} = require('../controllers/travelController');

const { searchStations } = require('../controllers/stationController');

// Rate limited travel search & compute endpoints
router.get('/stations/search', travelLimiter, searchStations);
router.post('/routes/search', travelLimiter, searchRoutes);
router.get('/trains/search', travelLimiter, searchTrains);
router.get('/trains/live-status/:trainNumber', travelLimiter, getLiveTrainStatus);
router.post('/predict', travelLimiter, predictTrip);
router.post('/optimize', travelLimiter, optimizeTripRoute);

// Protected routes
router.post('/save-trip', protect, saveUserTrip);
router.get('/history', protect, getUserHistory);
router.get('/analytics', protect, getUserAnalytics);

module.exports = router;
