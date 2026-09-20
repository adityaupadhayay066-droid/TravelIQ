const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getTripCarbonEmission, getUserCarbonSummary } = require('../controllers/carbonController');

router.get('/trip/:tripId', protect, getTripCarbonEmission);
router.get('/summary', protect, getUserCarbonSummary);

module.exports = router;
