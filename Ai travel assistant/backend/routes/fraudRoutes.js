const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/authMiddleware');
const { getFraudAnalytics } = require('../controllers/fraudController');

router.get('/analytics', adminProtect, getFraudAnalytics);

module.exports = router;
