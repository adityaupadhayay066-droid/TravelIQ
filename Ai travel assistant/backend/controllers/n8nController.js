const { SupportTicket, SupportMessage, User } = require('../models');
const n8nService = require('../services/n8nService');

const crypto = require('crypto');

/**
 * Validates incoming webhook secret from n8n.
 * Fails securely if secret is unconfigured or uses insecure defaults.
 * Requires secret strictly via designated 'x-traveliq-secret' HTTP header.
 */
function isAuthorized(req) {
  const configuredSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!configuredSecret || configuredSecret === 'traveliq_n8n_secret_token_2026' || configuredSecret.length < 16) {
    return false; // Fail securely: reject all webhooks when secret is missing or insecure default
  }

  const providedSecret = req.headers['x-aevora-secret'] || req.headers['x-traveliq-secret'];
  if (!providedSecret || typeof providedSecret !== 'string') {
    return false;
  }

  const bufProvided = Buffer.from(providedSecret);
  const bufConfigured = Buffer.from(configuredSecret);

  if (bufProvided.length !== bufConfigured.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufProvided, bufConfigured);
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

    // Gracefully acknowledge test pings from n8n test workflows
    if (ticket_id === 0 || ticket_id === '0' || req.body.is_test) {
      return res.json({ success: true, message: 'Test ping acknowledged by support callback endpoint.' });
    }

    if (!ticket_id || !message) {
      return res.status(400).json({ success: false, message: 'ticket_id and message are required.' });
    }

    const ticket = await SupportTicket.findByPk(ticket_id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: `Support Ticket #${ticket_id} not found.` });
    }

    // Output validation & prompt injection containment
    const validation = n8nService.validateAiSupportReply(message);
    const safeContent = validation.safeText;
    const isBlocked = validation.requiresAdminReview || !validation.isValid;

    // Format reply prefix to clearly identify n8n automation
    const replySource = sender_name ? `🤖 [${sender_name} via n8n]` : '🤖 [AI Assistant via n8n]';
    const formattedMessage = safeContent.startsWith('🤖') ? safeContent : `${replySource}:\n${safeContent}`;

    const newMsg = await SupportMessage.create({
      ticket_id: ticket.id,
      sender_type: 'Admin',
      sender_id: ticket.user_id,
      message: formattedMessage
    });

    ticket.admin_reply = safeContent;
    ticket.status = isBlocked ? 'Needs Review' : (status || 'In Progress');
    await ticket.save();

    // Audit log
    const { AdminLog } = require('../models');
    if (AdminLog && AdminLog.create) {
      await AdminLog.create({
        admin_id: ticket.user_id || 1,
        action: isBlocked ? 'AI_SUPPORT_REPLY_INJECTION_BLOCKED' : 'AI_SUPPORT_REPLY_INGESTED',
        target_id: String(ticket.id),
        ip_address: req.ip || '127.0.0.1',
        details: { reason: validation.reason, isBlocked, summary: safeContent.slice(0, 100) }
      }).catch(() => {});
    }

    console.log(`[n8nController] ${isBlocked ? '⚠️ Blocked suspicious' : '✅ Successfully ingested'} AI reply from n8n for Ticket #${ticket.id}`);

    res.status(201).json({
      success: true,
      message: isBlocked 
        ? 'AI reply flagged for manual administrator review due to security policy.'
        : 'AI Support reply successfully posted to ticket conversation.',
      messageId: newMsg.id,
      ticket_status: ticket.status
    });
  } catch (error) {
    console.error('[n8nController] Error handling support reply:', error);
    res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
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
    res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
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
    res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
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
      service: 'AEVORA n8n Automation Engine',
      telemetry
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
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
    res.status(500).json({ success: false, message: 'Internal server error. Please try again later.' });
  }
};
