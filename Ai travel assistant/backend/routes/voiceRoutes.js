const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const { listenVoice, respondVoice } = require('../controllers/voiceController');

router.post('/listen', optionalProtect, listenVoice);
router.post('/respond', optionalProtect, respondVoice);

module.exports = router;
