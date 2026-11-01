const express = require('express');
const router = express.Router();
const n8nController = require('../controllers/n8nController');
const { adminProtect } = require('../middleware/authMiddleware');

// Inbound callbacks from n8n workflows (secured via x-traveliq-secret timingSafeEqual)
router.post('/support-reply', n8nController.handleSupportReply);
router.post('/booking-notification', n8nController.handleBookingNotification);
router.post('/delay-alert', n8nController.handleDelayAlert);

// Health & Testing diagnostics (Restricted to Administrator sessions)
router.get('/status', adminProtect, n8nController.getStatus);
router.post('/test', adminProtect, n8nController.testWebhook);

module.exports = router;
