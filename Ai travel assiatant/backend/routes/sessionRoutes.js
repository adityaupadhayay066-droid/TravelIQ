const express = require('express');
const router = express.Router();
const { getActiveSessions, terminateSession } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActiveSessions);
router.delete('/:sessionId', protect, terminateSession);

module.exports = router;
