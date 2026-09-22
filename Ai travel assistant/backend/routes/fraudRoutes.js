const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getFraudAnalytics } = require('../controllers/fraudController');

router.get('/analytics', protect, getFraudAnalytics);

module.exports = router;
