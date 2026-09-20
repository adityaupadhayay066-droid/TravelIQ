const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { triggerSOS, getAlerts } = require('../controllers/sosController');
const { protect, adminProtect } = require('../middleware/authMiddleware');

const sosRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per `window` (here, per hour)
    message: { message: 'Too many SOS alerts triggered from this IP, please try again after an hour.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router.post('/trigger', protect, sosRateLimiter, triggerSOS);
router.get('/alerts', adminProtect, getAlerts);

module.exports = router;
