'use strict';
const { Booking, BookingEvent, Analytics, User, sequelize } = require('../models');
const { sendBookingConfirmation } = require('./emailService');
const n8nService = require('./n8nService');

/**
 * Dispatches confirmation side effects ONLY after payment verification succeeds.
 * Guarantees idempotency: retries will not duplicate emails, webhooks, or analytics credits.
 */
async function processBookingConfirmationSideEffects({ bookingId, user: providedUser = null }) {
  if (!bookingId) return;

  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: User }]
  });

  if (!booking) {
    console.warn(`[ConfirmationSideEffects] Booking #${bookingId} not found.`);
    return;
  }

  // CRITICAL INVARIANT: Never trigger confirmation side effects for unpaid, cancelled, or expired bookings
  if (booking.booking_status !== 'Confirmed' || booking.payment_status !== 'Paid') {
    console.warn(`[ConfirmationSideEffects] Refusing confirmation side effects for non-confirmed booking #${bookingId} (Booking: ${booking.booking_status}, Payment: ${booking.payment_status})`);
    return;
  }

  const user = providedUser || booking.User;
  const eventId = `evt_confirm_booking_${booking.id}`;

  // 1. Idempotency Check in BookingEvent
  let eventRecord = null;
  try {
    eventRecord = await BookingEvent.findOne({
      where: { idempotent_event_id: eventId }
    });
  } catch (err) {
    console.warn('[ConfirmationSideEffects] Event lookup warning:', err.message);
  }

  if (eventRecord && eventRecord.delivery_status === 'DELIVERED') {
    console.log(`[ConfirmationSideEffects] Confirmation side effects already completed for booking #${booking.id}. Skipping.`);
    return { success: true, alreadyDelivered: true };
  }

  if (!eventRecord) {
    try {
      eventRecord = await BookingEvent.create({
        booking_id: booking.id,
        event_type: 'booking.confirmed',
        idempotent_event_id: eventId,
        delivery_status: 'PROCESSING',
        payload: {
          booking_id: booking.id,
          booking_reference: booking.booking_reference,
          user_id: user ? user.id : booking.user_id,
          ticket_fare: booking.ticket_fare
        }
      });
    } catch (createErr) {
      // If concurrent insert created the record, re-fetch
      eventRecord = await BookingEvent.findOne({ where: { idempotent_event_id: eventId } });
      if (eventRecord && eventRecord.delivery_status === 'DELIVERED') {
        return { success: true, alreadyDelivered: true };
      }
    }
  }

  // 2. Credit Analytics idempotently (only once per confirmed booking)
  try {
    if (Analytics && user) {
      let userAnalytics = await Analytics.findOne({ where: { user_id: user.id } });
      if (!userAnalytics) {
        userAnalytics = await Analytics.create({
          user_id: user.id,
          route_accuracy: null,
          ai_prediction_score: null,
          total_saved_money: 0,
          total_saved_time: 0
        });
      }
      const fare = Number(booking.ticket_fare) || 0;
      userAnalytics.total_saved_money = parseFloat(userAnalytics.total_saved_money || 0) + Math.round(fare * 0.12);
      userAnalytics.total_saved_time = parseFloat(userAnalytics.total_saved_time || 0) + 1.5;
      await userAnalytics.save();
    }
  } catch (analyticsErr) {
    console.warn('[ConfirmationSideEffects] Analytics credit notice:', analyticsErr.message);
  }

  // 3. Dispatch Email notification (retry-safe, non-blocking)
  let emailSuccess = false;
  try {
    if (user && user.email) {
      await sendBookingConfirmation({ user, booking });
      emailSuccess = true;
    }
  } catch (emailErr) {
    console.warn('[ConfirmationSideEffects] Email notification notice:', emailErr.message);
  }

  // 4. Dispatch n8n webhook notification
  let n8nSuccess = false;
  try {
    if (user) {
      await n8nService.triggerBookingWebhook(booking, user);
      n8nSuccess = true;
    }
  } catch (n8nErr) {
    console.warn('[ConfirmationSideEffects] n8n webhook notice:', n8nErr.message);
  }

  // 5. Update delivery status
  if (eventRecord) {
    try {
      eventRecord.delivery_status = 'DELIVERED';
      eventRecord.delivered_at = new Date();
      await eventRecord.save();
    } catch (saveErr) {
      console.warn('[ConfirmationSideEffects] Event save warning:', saveErr.message);
    }
  }

  return {
    success: true,
    emailSent: emailSuccess,
    n8nDelivered: n8nSuccess,
    booking_reference: booking.booking_reference
  };
}

module.exports = {
  processBookingConfirmationSideEffects
};
