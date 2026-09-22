const express = require('express');
const router = express.Router();
const { sendMessage, getCommonQuestions } = require('../controllers/chatbotController');

// Using optional middleware if we want to attach user ID to the session, 
// but we don't strictly require authentication to chat.
const { optionalProtect } = require('../middleware/authMiddleware');

router.post('/message', optionalProtect, sendMessage);
router.get('/questions', getCommonQuestions);

module.exports = router;
