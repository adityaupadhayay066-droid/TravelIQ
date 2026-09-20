const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
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

router.get('/stations/search', searchStations);
router.post('/routes/search', searchRoutes);
router.get('/trains/search', searchTrains);
router.get('/trains/live-status/:trainNumber', getLiveTrainStatus);
router.post('/predict', predictTrip);
router.post('/optimize', optimizeTripRoute);

// Protected routes
router.post('/save-trip', protect, saveUserTrip);
router.get('/history', protect, getUserHistory);
router.get('/analytics', protect, getUserAnalytics);

module.exports = router;
