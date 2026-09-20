const { SupportTicket, SupportMessage, User } = require('../models');
const n8nService = require('../services/n8nService');

/**
 * Validates incoming webhook secret from n8n
 */
function isAuthorized(req) {
  const configuredSecret = process.env.N8N_WEBHOOK_SECRET || 'traveliq_n8n_secret_token_2026';
  const providedSecret = req.headers['x-traveliq-secret'] || req.body?.secret || req.query?.secret;
  return !configuredSecret || providedSecret === configuredSecret;
}

/**
 * 1. POST /api/n8n/support-reply
 * Called by n8n workflow after generating an AI support resolution.
 */
exports.handleSupportReply = async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized n8n webhook secret.' });
    }

    const { ticket_id, message, sender_name, status } = req.body;

    if (!ticket_id || !message) {
      return res.status(400).json({ success: false, message: 'ticket_id and message are required.' });
    }

    const ticket = await SupportTicket.findByPk(ticket_id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: `Support Ticket #${ticket_id} not found.` });
    }

    // Format reply prefix to clearly identify n8n automation
    const replySource = sender_name ? `🤖 [${sender_name} via n8n]` : '🤖 [AI Assistant via n8n]';
    const formattedMessage = message.startsWith('🤖') ? message : `${replySource}:\n${message}`;

    const newMsg = await SupportMessage.create({
      ticket_id: ticket.id,
      sender_type: 'Admin',
      sender_id: ticket.user_id,
      message: formattedMessage
    });

    ticket.admin_reply = message;
    ticket.status = status || 'In Progress';
    await ticket.save();

    console.log(`[n8nController] ✅ Successfully ingested AI reply from n8n for Ticket #${ticket.id}`);

    res.status(201).json({
      success: true,
      message: 'AI Support reply successfully posted to ticket conversation.',
      messageId: newMsg.id,
      ticket_status: ticket.status
    });
  } catch (error) {
    console.error('[n8nController] Error handling support reply:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 2. POST /api/n8n/booking-notification
 * Called by n8n workflow after generating a travel briefing / confirmation.
 */
exports.handleBookingNotification = async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized n8n webhook secret.' });
    }

    const { booking_id, user_id, title, briefing, message } = req.body;
    const content = briefing || message;

    console.log(`[n8nController] 📨 Received booking AI notification from n8n for Booking #${booking_id || 'N/A'}: ${title}`);

    res.json({
      success: true,
      message: 'Booking notification acknowledged.',
      received: { booking_id, user_id, title, content }
    });
  } catch (error) {
    console.error('[n8nController] Error handling booking notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. POST /api/n8n/delay-alert
 * Called by n8n workflow after generating delay & refund advisory.
 */
exports.handleDelayAlert = async (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({ success: false, message: 'Unauthorized n8n webhook secret.' });
    }

    const { pnr, train_number, delay_minutes, title, advisory } = req.body;

    console.log(`[n8nController] ⚠️ Received delay alert from n8n for Train #${train_number} (+${delay_minutes}m): ${title}`);

    res.json({
      success: true,
      message: 'Delay alert acknowledged and logged.',
      received: { pnr, train_number, delay_minutes, title, advisory }
    });
  } catch (error) {
    console.error('[n8nController] Error handling delay alert:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. GET /api/n8n/status
 * Returns connection metrics and configuration status.
 */
exports.getStatus = async (req, res) => {
  try {
    const telemetry = n8nService.getTelemetry();
    res.json({
      success: true,
      service: 'TravelIQ n8n Automation Engine',
      telemetry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. POST /api/n8n/test
 * Diagnostic endpoint for admins to test n8n connectivity from the frontend.
 */
exports.testWebhook = async (req, res) => {
  try {
    const { type } = req.body || {};
    const results = await n8nService.sendTestWebhook(type || 'all');
    res.json({
      success: true,
      message: 'Test webhook sent.',
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
