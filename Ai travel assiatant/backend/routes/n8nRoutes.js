const express = require('express');
const router = express.Router();
const n8nController = require('../controllers/n8nController');

// Inbound callbacks from n8n workflows
router.post('/support-reply', n8nController.handleSupportReply);
router.post('/booking-notification', n8nController.handleBookingNotification);
router.post('/delay-alert', n8nController.handleDelayAlert);

// Health & Testing diagnostics
router.get('/status', n8nController.getStatus);
router.post('/test', n8nController.testWebhook);

module.exports = router;
