const axios = require('axios');
const { SupportMessage, SupportTicket } = require('../models');

// In-memory automation telemetry & event log
const n8nStats = {
  totalDispatched: 0,
  supportDispatched: 0,
  bookingDispatched: 0,
  lastEvent: null,
  lastStatus: 'Idle',
  lastError: null,
  history: []
};

function recordEvent(type, payload, status, responseOrError) {
  n8nStats.totalDispatched += 1;
  if (type.includes('support')) n8nStats.supportDispatched += 1;
  if (type.includes('booking')) n8nStats.bookingDispatched += 1;

  n8nStats.lastEvent = {
    type,
    timestamp: new Date().toISOString(),
    status,
    summary: typeof responseOrError === 'string' ? responseOrError : JSON.stringify(responseOrError).slice(0, 150)
  };
  n8nStats.lastStatus = status;

  // Keep last 30 events in history
  n8nStats.history.unshift({
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    timestamp: new Date().toISOString(),
    status,
    detail: responseOrError
  });
  if (n8nStats.history.length > 30) n8nStats.history.pop();
}

/**
 * Helper to generate an AI fallback reply using Gemini or local FastAPI /chat
 */
async function generateAIFallback(prompt) {
  const rawApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (rawApiKey) {
    const geminiApiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');
    if (geminiApiKey && !geminiApiKey.includes('your_')) {
      const models = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-3.1-pro-preview'];
      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const gRes = await axios.post(
            url,
            {
              contents: [{ parts: [{ text: prompt }] }]
            },
            { timeout: 15000 }
          );
          if (gRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return gRes.data.candidates[0].content.parts[0].text.trim();
          }
        } catch (err) {
          // try next model
        }
      }
    }
  }

  // Fallback to FastAPI AI engine on port 8000
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const pyRes = await axios.post(`${aiUrl}/chat`, { message: prompt }, { timeout: 4000 });
    if (pyRes.data?.response) {
      return pyRes.data.response;
    }
  } catch (err) {
    // ignore
  }

  return null;
}

/**
 * 1. Trigger Support Automation Webhook
 * Sends ticket & user information to n8n when a user needs help.
 */
async function triggerSupportWebhook(ticket, initialMessage, user) {
  const webhookUrl = process.env.N8N_SUPPORT_WEBHOOK_URL ||
    `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/traveliq-support`;
  const backendPort = process.env.PORT || 5000;
  const callbackUrl = `http://localhost:${backendPort}/api/n8n/support-reply`;

  const payload = {
    event: 'support.ticket_created',
    timestamp: new Date().toISOString(),
    secret: process.env.N8N_WEBHOOK_SECRET || 'traveliq_n8n_secret_token_2026',
    callback_url: callbackUrl,
    ticket: {
      id: ticket.id,
      ticket_number: `TRV-${ticket.id.toString().padStart(5, '0')}`,
      subject: ticket.subject,
      category: ticket.category || 'General',
      priority: ticket.priority || 'Medium',
      status: ticket.status || 'Open',
      created_at: ticket.created_at || new Date()
    },
    message: initialMessage,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    }
  };

  console.log(`[n8nService] 🚀 Dispatching support webhook to: ${webhookUrl}`);

  try {
    const response = await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-TravelIQ-Secret': process.env.N8N_WEBHOOK_SECRET || 'traveliq_n8n_secret_token_2026'
      }
    });

    recordEvent('support.ticket_created', payload, 'Success', response.data);
    console.log(`[n8nService] ✅ n8n support webhook delivered successfully!`);

    // If n8n responded with an immediate AI reply in the webhook response (synchronous workflow)
    const replyText = response.data?.reply || response.data?.message || response.data?.ai_response;
    if (replyText) {
      await SupportMessage.create({
        ticket_id: ticket.id,
        sender_type: 'Admin',
        sender_id: user.id,
        message: `🤖 [AI Support via n8n]:\n${replyText}`
      });
      ticket.admin_reply = replyText;
      ticket.status = 'In Progress';
      await ticket.save();
    }
    return { success: true, delivered: true, response: response.data };
  } catch (err) {
    console.warn(`[n8nService] ⚠️ n8n webhook unavailable (${err.message}). Activating built-in AI fallback...`);
    recordEvent('support.ticket_created', payload, 'Fallback', err.message);

    // AI Fallback: Generate intelligent resolution
    const prompt = `You are TravelIQ AI Customer Support Assistant.
A traveler named ${user.name} opened ticket #${ticket.id}:
Subject: "${ticket.subject}"
Category: "${ticket.category}"
User's issue: "${initialMessage}"

Provide an empathetic, ultra-helpful, 2-3 sentence initial response outlining potential immediate solutions or explaining that the AI system and operations team are assisting. Be polite, reassuring, and concise.`;

    const aiReply = await generateAIFallback(prompt) ||
      `Hello ${user.name}, thank you for reaching out to TravelIQ Support! We have received your query regarding "${ticket.subject}". Our AI diagnostic system has logged this ticket with ${ticket.priority} priority. If this is related to a live transit booking, please keep your PNR / Booking reference handy while our support team reviews your request.`;

    try {
      await SupportMessage.create({
        ticket_id: ticket.id,
        sender_type: 'Admin',
        sender_id: user.id,
        message: `🤖 [AI Support Assistant]:\n${aiReply}`
      });
      ticket.admin_reply = aiReply;
      ticket.status = 'In Progress';
      await ticket.save();
      console.log(`[n8nService] 🤖 AI fallback reply posted to ticket #${ticket.id}`);
    } catch (saveErr) {
      console.error('[n8nService] Error saving fallback AI reply:', saveErr.message);
    }

    return { success: true, delivered: false, fallback: true, aiReply };
  }
}

/**
 * 2. Trigger Booking Automation Webhook
 * Sends confirmed booking & travel details to n8n for journey briefing and customer messaging.
 */
async function triggerBookingWebhook(booking, user) {
  const webhookUrl = process.env.N8N_BOOKING_WEBHOOK_URL ||
    `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/traveliq-booking`;
  const backendPort = process.env.PORT || 5000;
  const callbackUrl = `http://localhost:${backendPort}/api/n8n/booking-notification`;

  const payload = {
    event: 'booking.ticket_confirmed',
    timestamp: new Date().toISOString(),
    secret: process.env.N8N_WEBHOOK_SECRET || 'traveliq_n8n_secret_token_2026',
    callback_url: callbackUrl,
    booking: {
      id: booking.id,
      booking_reference: `#TK-${booking.id}`,
      train_number: booking.train_number || '12301',
      source_station_code: booking.source_station_code,
      destination_station_code: booking.destination_station_code,
      travel_class: booking.travel_class || 'SL',
      ticket_fare: booking.ticket_fare,
      seat_preference: booking.seat_preference || 'No Preference',
      berth_preference: booking.berth_preference || 'No Preference',
      booking_date: booking.booking_date,
      passengers: booking.passengers,
      total_passengers: booking.total_passengers || 1,
      booking_status: booking.booking_status || 'Confirmed'
    },
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || ''
    }
  };

  console.log(`[n8nService] 🚀 Dispatching booking webhook to: ${webhookUrl}`);

  try {
    const response = await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-TravelIQ-Secret': process.env.N8N_WEBHOOK_SECRET || 'traveliq_n8n_secret_token_2026'
      }
    });

    recordEvent('booking.ticket_confirmed', payload, 'Success', response.data);
    console.log(`[n8nService] ✅ n8n booking webhook delivered successfully!`);
    return { success: true, delivered: true, response: response.data };
  } catch (err) {
    console.warn(`[n8nService] ⚠️ n8n booking webhook unavailable (${err.message}). Generating fallback AI travel brief...`);
    recordEvent('booking.ticket_confirmed', payload, 'Fallback', err.message);

    // AI Fallback: Generate smart journey brief
    const prompt = `You are TravelIQ AI Concierge.
A user named ${user.name} just booked a ticket:
Train: ${booking.train_number || 'Express'}
Route: ${booking.source_station_code} to ${booking.destination_station_code}
Class: ${booking.travel_class || 'SL'}
Date: ${booking.booking_date}

Generate a concise, cheerful 2-sentence travel briefing with 1 packing tip and 1 station amenity recommendation.`;

    const brief = await generateAIFallback(prompt) ||
      `Booking Confirmed for Train #${booking.train_number || '12301'} from ${booking.source_station_code} to ${booking.destination_station_code}! AI Route Advisory: On-time performance expected. Remember to carry your government ID and keep a power bank handy. Safe travels!`;

    console.log(`[n8nService] 🤖 AI fallback travel briefing generated for booking #${booking.id}`);
    return { success: true, delivered: false, fallback: true, brief };
  }
}

/**
 * 3. Trigger Delay & Refund Alert Webhook
 * Sends train disruption details to n8n for delay calculation & customer recovery advisory.
 */
async function triggerDelayWebhook(disruptionData, user) {
  const webhookUrl = process.env.N8N_DELAY_WEBHOOK_URL ||
    `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/traveliq-delay-alert`;
  const backendPort = process.env.PORT || 5000;
  const callbackUrl = `http://localhost:${backendPort}/api/n8n/delay-alert`;

  const payload = {
    event: 'transit.delay_detected',
    timestamp: new Date().toISOString(),
    secret: process.env.N8N_WEBHOOK_SECRET || 'traveliq_n8n_secret_token_2026',
    callback_url: callbackUrl,
    pnr: disruptionData.pnr || 'TRV-89412',
    train_number: disruptionData.train_number || '12301',
    train_name: disruptionData.train_name || 'Rajdhani Express',
    delay_minutes: disruptionData.delay_minutes || 45,
    current_station: disruptionData.current_station || 'NDLS',
    user: {
      id: user?.id,
      name: user?.name || 'Traveler',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  };

  console.log(`[n8nService] 🚀 Dispatching delay webhook to: ${webhookUrl}`);

  try {
    const response = await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-TravelIQ-Secret': process.env.N8N_WEBHOOK_SECRET || 'traveliq_n8n_secret_token_2026'
      }
    });

    recordEvent('transit.delay_detected', payload, 'Success', response.data);
    console.log(`[n8nService] ✅ n8n delay webhook delivered successfully!`);
    return { success: true, delivered: true, response: response.data };
  } catch (err) {
    console.warn(`[n8nService] ⚠️ n8n delay webhook unavailable (${err.message}). Generating fallback AI advisory...`);
    recordEvent('transit.delay_detected', payload, 'Fallback', err.message);

    const prompt = `Train #${payload.train_number} delayed by ${payload.delay_minutes} mins at ${payload.current_station}. Provide short AI delay recovery message for ${payload.user.name}.`;
    const advisory = await generateAIFallback(prompt) ||
      `Train #${payload.train_number} is running delayed by ${payload.delay_minutes} minutes near ${payload.current_station}. TravelIQ AI Advisor: If delay exceeds 3 hours, 100% TDR refund guarantee applies.`;

    return { success: true, delivered: false, fallback: true, advisory };
  }
}

/**
 * 4. Diagnostic Test Webhook
 * Sends a test ping to n8n to verify connectivity.
 */
async function sendTestWebhook(type = 'all') {
  const supportUrl = process.env.N8N_SUPPORT_WEBHOOK_URL ||
    `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/traveliq-support`;
  const bookingUrl = process.env.N8N_BOOKING_WEBHOOK_URL ||
    `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/traveliq-booking`;
  const delayUrl = process.env.N8N_DELAY_WEBHOOK_URL ||
    `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook'}/traveliq-delay-alert`;

  const results = {};

  if (type === 'all' || type === 'support') {
    try {
      const res = await axios.post(supportUrl, {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        test: true,
        message: 'TravelIQ n8n integration ping test for Support Automation'
      }, { timeout: 3000 });
      results.support = { status: 'Connected', code: res.status, data: res.data };
    } catch (e) {
      results.support = { status: 'Offline / Unreachable', error: e.message, targetUrl: supportUrl };
    }
  }

  if (type === 'all' || type === 'booking') {
    try {
      const res = await axios.post(bookingUrl, {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        test: true,
        message: 'TravelIQ n8n integration ping test for Booking Automation'
      }, { timeout: 3000 });
      results.booking = { status: 'Connected', code: res.status, data: res.data };
    } catch (e) {
      results.booking = { status: 'Offline / Unreachable', error: e.message, targetUrl: bookingUrl };
    }
  }

  if (type === 'all' || type === 'delay') {
    try {
      const res = await axios.post(delayUrl, {
        event: 'test.ping',
        timestamp: new Date().toISOString(),
        test: true,
        message: 'TravelIQ n8n integration ping test for Delay Automation'
      }, { timeout: 3000 });
      results.delay = { status: 'Connected', code: res.status, data: res.data };
    } catch (e) {
      results.delay = { status: 'Offline / Unreachable', error: e.message, targetUrl: delayUrl };
    }
  }

  return results;
}

function getTelemetry() {
  return {
    ...n8nStats,
    webhookUrls: {
      base: process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678/webhook',
      support: process.env.N8N_SUPPORT_WEBHOOK_URL || 'http://localhost:5678/webhook/traveliq-support',
      booking: process.env.N8N_BOOKING_WEBHOOK_URL || 'http://localhost:5678/webhook/traveliq-booking',
      delay: process.env.N8N_DELAY_WEBHOOK_URL || 'http://localhost:5678/webhook/traveliq-delay-alert'
    }
  };
}

module.exports = {
  triggerSupportWebhook,
  triggerBookingWebhook,
  triggerDelayWebhook,
  sendTestWebhook,
  getTelemetry
};
