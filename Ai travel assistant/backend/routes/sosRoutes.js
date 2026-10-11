const express = require('express');
const router = express.Router();
const { triggerSOS, getAlerts } = require('../controllers/sosController');
const { protect, adminProtect } = require('../middleware/authMiddleware');
const { sosLimiter } = require('../middleware/rateLimiter');

router.post('/trigger', protect, sosLimiter, triggerSOS);
router.get('/alerts', adminProtect, getAlerts);

module.exports = router;
