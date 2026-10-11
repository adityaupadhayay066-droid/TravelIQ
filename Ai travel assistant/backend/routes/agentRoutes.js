const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const { runAgentSimulation } = require('../controllers/agentController');

router.post('/simulate', protect, aiLimiter, runAgentSimulation);

module.exports = router;
