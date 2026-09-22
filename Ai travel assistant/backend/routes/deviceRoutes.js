const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getActiveSessions,
    revokeSession,
    revokeOtherSessions
} = require('../controllers/deviceController');

// All device session endpoints are secured under the protect middleware
router.get('/', protect, getActiveSessions);
router.delete('/:sessionId', protect, revokeSession);
router.delete('/', protect, revokeOtherSessions);

module.exports = router;
