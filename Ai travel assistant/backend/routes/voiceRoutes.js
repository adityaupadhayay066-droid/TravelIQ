const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const { listenVoice, respondVoice } = require('../controllers/voiceController');

router.use(aiLimiter);

router.post('/listen', optionalProtect, listenVoice);
router.post('/respond', optionalProtect, respondVoice);

module.exports = router;
