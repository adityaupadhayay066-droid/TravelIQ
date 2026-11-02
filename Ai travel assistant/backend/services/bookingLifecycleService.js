'use strict';
const crypto = require('crypto');
const { Booking, Transaction, PaymentLog, AdminLog, sequelize } = require('../models');

const BOOKING_STATUSES = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired'
};

const PAYMENT_STATUSES = {
  UNPAID: 'Unpaid',
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUND_PENDING: 'Refund Pending',
  REFUNDED: 'Refunded'
};

/**
 * Valid allowed status transitions
 */
const ALLOWED_BOOKING_TRANSITIONS = {
  [BOOKING_STATUSES.PENDING]: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.CANCELLED, BOOKING_STATUSES.EXPIRED],
  [BOOKING_STATUSES.CONFIRMED]: [BOOKING_STATUSES.CANCELLED],
  [BOOKING_STATUSES.CANCELLED]: [], // Terminal state
  [BOOKING_STATUSES.EXPIRED]: []    // Terminal state
};

const ALLOWED_PAYMENT_TRANSITIONS = {
  [PAYMENT_STATUSES.UNPAID]: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.FAILED, 'Cancelled'],
  [PAYMENT_STATUSES.PENDING]: [PAYMENT_STATUSES.PAID, PAYMENT_STATUSES.FAILED, 'Cancelled'],
  [PAYMENT_STATUSES.PAID]: [PAYMENT_STATUSES.REFUND_PENDING, PAYMENT_STATUSES.REFUNDED],
  [PAYMENT_STATUSES.REFUND_PENDING]: [PAYMENT_STATUSES.REFUNDED],
  [PAYMENT_STATUSES.FAILED]: [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID], // Retry payment
  [PAYMENT_STATUSES.REFUNDED]: [] // Terminal state
};

/**
 * Generate a cryptographically secure, unique TravelIQ Booking Reference.
 * Never derived from sequential database ID, timestamp, user ID, or passenger details.
 */
function generateBookingReference() {
  const randomChars = crypto.randomBytes(5).toString('hex').toUpperCase();
  return `TIQ-BR-${randomChars}`;
}

/**
 * Centralized booking state transition service.
 * Enforces atomic state transitions, row-level locking, transition validity,
 * and preserves an auditable transition log.
 */
async function transitionBookingState(arg1, arg2, arg3, arg4) {
  let bookingId, targetBookingStatus, targetPaymentStatus, actor, reason, existingTransaction;

  if (typeof arg1 === 'object' && arg1 !== null) {
    bookingId = arg1.bookingId;
    targetBookingStatus = arg1.targetBookingStatus;
    targetPaymentStatus = arg1.targetPaymentStatus;
    actor = arg1.actor || { id: 1, role: 'SYSTEM' };
    reason = arg1.reason || 'Lifecycle transition';
    existingTransaction = arg1.existingTransaction || null;
  } else {
    bookingId = arg1;
    targetBookingStatus = arg2;
    targetPaymentStatus = arg3;
    const opts = typeof arg4 === 'object' && arg4 !== null ? arg4 : {};
    actor = opts.actor || { id: 1, role: 'SYSTEM' };
    reason = opts.reason || 'Lifecycle transition';
    existingTransaction = opts.existingTransaction || null;
  }
  const executeTransition = async (t) => {
    // 1. Fetch booking with row-level lock
    const booking = await Booking.findByPk(bookingId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!booking) {
      const err = new Error(`Booking #${bookingId} not found.`);
      err.statusCode = 404;
      throw err;
    }

    const currentBookingStatus = booking.booking_status || BOOKING_STATUSES.PENDING;
    const currentPaymentStatus = booking.payment_status || PAYMENT_STATUSES.UNPAID;

    // 2. Validate Booking Status Transition if requested
    if (targetBookingStatus && targetBookingStatus !== currentBookingStatus) {
      const allowed = ALLOWED_BOOKING_TRANSITIONS[currentBookingStatus] || [];
      if (!allowed.includes(targetBookingStatus)) {
        const err = new Error(
          `Illegal booking state transition: Cannot transition from '${currentBookingStatus}' to '${targetBookingStatus}'.`
        );
        err.statusCode = 400;
        throw err;
      }

      // INVARIANT: Confirmed booking status requires Paid payment status
      const effectivePaymentStatus = targetPaymentStatus || currentPaymentStatus;
      if (targetBookingStatus === BOOKING_STATUSES.CONFIRMED && effectivePaymentStatus !== PAYMENT_STATUSES.PAID) {
        const err = new Error(
          `Cannot confirm booking #${bookingId}: Payment status is '${effectivePaymentStatus}', but 'Paid' is required.`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Validate Payment Status Transition if requested
    if (targetPaymentStatus && targetPaymentStatus !== currentPaymentStatus) {
      const allowed = ALLOWED_PAYMENT_TRANSITIONS[currentPaymentStatus] || [];
      if (!allowed.includes(targetPaymentStatus)) {
        const err = new Error(
          `Illegal payment state transition: Cannot transition from '${currentPaymentStatus}' to '${targetPaymentStatus}'.`
        );
        err.statusCode = 400;
        throw err;
      }

      // INVARIANT: A refunded or cancelled booking cannot become Paid or Confirmed
      if (currentPaymentStatus === PAYMENT_STATUSES.REFUNDED && targetPaymentStatus === PAYMENT_STATUSES.PAID) {
        const err = new Error(
          `Integrity violation: Refunded booking #${bookingId} cannot be restored to Paid.`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // INVARIANT: Confirmed status cannot coexist with Unpaid, Cancelled, Refund Pending, or Refunded payment
    const finalBookingStatus = targetBookingStatus || currentBookingStatus;
    const finalPaymentStatus = targetPaymentStatus || currentPaymentStatus;

    if (finalBookingStatus === BOOKING_STATUSES.CONFIRMED && finalPaymentStatus !== PAYMENT_STATUSES.PAID) {
      const err = new Error(
        `State conflict: Booking cannot be Confirmed while payment status is '${finalPaymentStatus}'.`
      );
      err.statusCode = 400;
      throw err;
    }

    if ((finalPaymentStatus === PAYMENT_STATUSES.REFUNDED || finalPaymentStatus === PAYMENT_STATUSES.REFUND_PENDING) &&
        finalBookingStatus === BOOKING_STATUSES.CONFIRMED) {
      const err = new Error(
        `State conflict: Refunded/Refund Pending booking cannot have Confirmed status.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Apply updates
    const prevBStatus = booking.booking_status;
    const prevPStatus = booking.payment_status;

    if (targetBookingStatus) booking.booking_status = targetBookingStatus;
    if (targetPaymentStatus) booking.payment_status = targetPaymentStatus;

    if (typeof booking.save === 'function') {
      await booking.save({ transaction: t });
    } else if (typeof booking.update === 'function') {
      await booking.update({
        booking_status: booking.booking_status,
        payment_status: booking.payment_status
      }, { transaction: t });
    }

    // 5. Preserved audit record
    try {
      if (AdminLog) {
        await AdminLog.create({
          admin_id: actor.id || 1,
          action: 'BOOKING_STATE_TRANSITION',
          target_id: String(booking.id),
          details: `Booking #${booking.id} (${booking.booking_reference}) changed: ` +
                   `[Booking: ${prevBStatus} -> ${booking.booking_status}] ` +
                   `[Payment: ${prevPStatus} -> ${booking.payment_status}]. Reason: ${reason}. Actor: ${actor.role || 'USER'} (#${actor.id})`
        }, { transaction: t });
      }
    } catch (auditErr) {
      console.warn('[BookingLifecycleService] Audit logging warning:', auditErr.message);
    }

    return booking;
  };

  if (existingTransaction) {
    return await executeTransition(existingTransaction);
  } else {
    return await sequelize.transaction(executeTransition);
  }
}

/**
 * Safe expiration for pending bookings past hold duration
 */
async function expirePendingBookings({ maxAgeMinutes = 15 } = {}) {
  const expirationThreshold = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  const { Op } = require('sequelize');

  const expiredList = await Booking.findAll({
    where: {
      booking_status: BOOKING_STATUSES.PENDING,
      payment_status: { [Op.in]: [PAYMENT_STATUSES.UNPAID, PAYMENT_STATUSES.PENDING] },
      [Op.or]: [
        { expires_at: { [Op.lt]: new Date() } },
        {
          expires_at: null,
          booking_date: { [Op.lt]: expirationThreshold }
        }
      ]
    }
  });

  const expiredIds = [];
  for (const b of expiredList) {
    try {
      await transitionBookingState({
        bookingId: b.id,
        targetBookingStatus: BOOKING_STATUSES.EXPIRED,
        actor: { id: 1, role: 'SYSTEM_SCHEDULER' },
        reason: `Pending booking hold expired after ${maxAgeMinutes} minutes without payment.`
      });
      expiredIds.push(b.id);
    } catch (err) {
      console.warn(`[ExpirePending] Skipped booking #${b.id}:`, err.message);
    }
  }

  return { expiredCount: expiredIds.length, expiredIds };
}

module.exports = {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  generateBookingReference,
  transitionBookingState,
  expirePendingBookings
};
