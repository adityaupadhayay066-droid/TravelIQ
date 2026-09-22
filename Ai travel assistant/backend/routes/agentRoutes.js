const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { runAgentSimulation } = require('../controllers/agentController');

router.post('/simulate', protect, runAgentSimulation);

module.exports = router;
