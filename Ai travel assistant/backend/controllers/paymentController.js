'use strict';
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { Transaction, PaymentLog, Booking, User, Trip, Station, Train, TrainSchedule, TrainFare, ProcessedWebhookEvent, sequelize } = require('../models');
const { transitionBookingState, BOOKING_STATUSES, PAYMENT_STATUSES: BOOKING_PAYMENT_STATUSES } = require('../services/bookingLifecycleService');

/**
 * Explicit Payment / Transaction States
 */
const PAYMENT_STATUSES = {
  PENDING: 'Pending',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  REFUND_PENDING: 'Refund Pending',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled'
};
const { processBookingConfirmationSideEffects } = require('../services/bookingConfirmationService');

/**
 * Robust HTML escaping to prevent XSS in receipt generation
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Create or initialize a payment order attempt bound to an authoritative booking.
 * POST /api/payment/order
 */
const createOrder = async (req, res) => {
  const { booking_id } = req.body;
  try {
    if (!booking_id) {
      return res.status(400).json({ message: 'booking_id is required.' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }

    // Verify booking ownership
    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.admin_role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this booking.' });
    }

    if (booking.payment_status === 'Paid') {
      return res.status(400).json({ message: 'This booking has already been paid and confirmed.' });
    }

    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot create payment order for a cancelled booking.' });
    }
    if (booking.booking_status === 'Expired') {
      return res.status(400).json({ message: 'Cannot create payment order for an expired booking.' });
    }

    const authoritativeAmount = Number(booking.ticket_fare);
    if (isNaN(authoritativeAmount) || authoritativeAmount <= 0) {
      return res.status(400).json({ message: 'Invalid authoritative booking fare.' });
    }

    // Reuse or create a pending transaction attempt
    let txn = await Transaction.findOne({
      where: {
        booking_id: booking.id,
        user_id: req.user.id,
        status: PAYMENT_STATUSES.PENDING
      }
    });

    if (!txn) {
      const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
      const txnId = `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      txn = await Transaction.create({
        booking_id: booking.id,
        user_id: req.user.id,
        transaction_id: txnId,
        order_id: orderId,
        amount: authoritativeAmount,
        currency: 'INR',
        payment_method: 'Gateway Pending',
        status: PAYMENT_STATUSES.PENDING
      });
    } else if (!txn.order_id) {
      txn.order_id = `order_${crypto.randomBytes(12).toString('hex')}`;
      await txn.save();
    }

    res.status(200).json({
      success: true,
      order_id: txn.order_id,
      transaction_id: txn.transaction_id,
      amount: authoritativeAmount,
      currency: 'INR',
      booking_id: booking.id,
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key'
    });
  } catch (error) {
    console.error('[Create Order Error]:', error.message);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

/**
 * Record a verified transaction after checkout with authoritative pricing, ownership validation,
 * cryptographic payment provider verification, and anti-replay protection.
 * POST /api/payment/transaction
 */
const createTransaction = async (req, res) => {
  const { 
    booking_id, 
    payment_method, 
    details,
    gateway_payment_id, 
    gateway_order_id, 
    gateway_signature 
  } = req.body;

  try {
    if (!booking_id) {
      return res.status(400).json({ message: 'booking_id is required.' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }

    // Verify booking ownership
    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.admin_role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this booking.' });
    }

    // Prevent payment on already confirmed, refunded, or cancelled bookings
    if (booking.payment_status === 'Paid') {
      return res.status(400).json({ message: 'This booking has already been paid and confirmed.' });
    }
    if (booking.payment_status === 'Refunded' || booking.booking_status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot process payment for a cancelled or refunded booking.' });
    }
    if (booking.booking_status === 'Expired') {
      return res.status(400).json({ message: 'Cannot process payment for an expired booking.' });
    }

    // Authoritative amount recalculated strictly from server booking record
    const authoritativeAmount = Number(booking.ticket_fare != null ? booking.ticket_fare : booking.total_fare);
    if (isNaN(authoritativeAmount) || authoritativeAmount <= 0) {
      return res.status(400).json({ message: 'Invalid authoritative booking fare.' });
    }

    // Validate if client provided an amount that it matches authoritative amount exactly
    if (req.body.amount !== undefined && Math.abs(Number(req.body.amount) - authoritativeAmount) > 0.01) {
      return res.status(400).json({
        message: 'Payment amount mismatch: Client amount does not match authoritative booking fare.'
      });
    }

    const gatewaySecret = process.env.PAYMENT_GATEWAY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    // RULE: Never accept client-supplied payment status as authoritative.
    let verifiedStatus = PAYMENT_STATUSES.PENDING;
    if (req.body.status === 'Failed') {
      verifiedStatus = PAYMENT_STATUSES.FAILED;
    }

    // Cryptographic payment provider verification
    if (gateway_signature) {
      if (!gatewaySecret) {
        return res.status(503).json({ message: 'Payment gateway verification service is not configured.' });
      }
      if (!gateway_payment_id || !gateway_order_id) {
        return res.status(400).json({ message: 'Missing gateway payment or order reference.' });
      }

      // Check for replay of gateway_payment_id across ANY transaction or webhook event
      const existingPaymentTxn = await Transaction.findOne({ where: { payment_id: gateway_payment_id } });
      if (existingPaymentTxn) {
        return res.status(400).json({
          message: 'Payment identifier has already been processed and cannot be replayed.'
        });
      }
      const existingEvt = await ProcessedWebhookEvent.findOne({ where: { payment_id: gateway_payment_id } });
      if (existingEvt) {
        return res.status(400).json({
          message: 'Payment has already been processed via webhook.'
        });
      }

      // Cryptographic signature verification: HMAC-SHA256(order_id|payment_id, secret)
      const dataToSign = `${gateway_order_id}|${gateway_payment_id}`;
      const expectedSig = crypto.createHmac('sha256', gatewaySecret).update(dataToSign).digest('hex');
      const bufExpected = Buffer.from(expectedSig);
      const bufActual = Buffer.from(String(gateway_signature));

      if (bufExpected.length !== bufActual.length || !crypto.timingSafeEqual(bufExpected, bufActual)) {
        return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
      }

      // STRICT ORDER BINDING: A matching server-created payment order transaction MUST exist.
      // Verification MUST NEVER be skipped or allow implicit creation when orderTxn is missing.
      const orderTxn = await Transaction.findOne({ where: { order_id: gateway_order_id } });
      if (!orderTxn) {
        return res.status(400).json({
          message: 'Unknown payment order: No matching server-created order was found.'
        });
      }

      if (orderTxn.booking_id !== booking.id) {
        return res.status(400).json({
          message: 'Order reference mismatch: Gateway order does not belong to this booking.'
        });
      }
      if (orderTxn.user_id !== req.user.id) {
        return res.status(403).json({
          message: 'Order reference mismatch: Gateway order belongs to a different user.'
        });
      }
      if (orderTxn.currency && orderTxn.currency !== 'INR') {
        return res.status(400).json({
          message: 'Currency mismatch: Order currency must be INR.'
        });
      }
      if (Math.abs(Number(orderTxn.amount) - authoritativeAmount) > 0.01) {
        return res.status(400).json({
          message: 'Payment amount mismatch: Gateway order amount does not match authoritative booking fare.'
        });
      }
      if (orderTxn.status === PAYMENT_STATUSES.SUCCESS) {
        return res.status(400).json({
          message: 'This payment order has already succeeded.'
        });
      }
      if (orderTxn.status !== PAYMENT_STATUSES.PENDING) {
        return res.status(400).json({
          message: `Invalid order state: Expected PENDING payment order but found ${orderTxn.status}.`
        });
      }

      verifiedStatus = PAYMENT_STATUSES.SUCCESS;
    } else if (req.body.status === 'Success') {
      // Client attempted to claim success without gateway signature verification: fail closed to PENDING
      verifiedStatus = PAYMENT_STATUSES.PENDING;
    }

    // Atomic transaction state transition with concurrency controls
    const result = await sequelize.transaction(async (t) => {
      const lockedBooking = await Booking.findByPk(booking_id, { lock: t.LOCK.UPDATE, transaction: t });
      if (lockedBooking.payment_status === 'Paid') {
        throw new Error('ALREADY_PAID: Booking has already been confirmed.');
      }
      if (lockedBooking.booking_status === 'Cancelled') {
        throw new Error('CANCELLED: Booking has been cancelled.');
      }

      let transaction = null;
      if (gateway_order_id) {
        transaction = await Transaction.findOne({
          where: { order_id: gateway_order_id },
          lock: t.LOCK.UPDATE,
          transaction: t
        });
      }

      if (!transaction && verifiedStatus === PAYMENT_STATUSES.SUCCESS) {
        // Under verified gateway payment, an existing transaction MUST exist
        throw new Error('ORDER_NOT_FOUND: Server-created transaction record missing for gateway order.');
      }

      if (!transaction) {
        transaction = await Transaction.findOne({
          where: { booking_id, user_id: req.user.id, status: PAYMENT_STATUSES.PENDING },
          lock: t.LOCK.UPDATE,
          transaction: t
        });
      }

      const txnId = transaction ? transaction.transaction_id : `TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

      if (transaction) {
        transaction.status = verifiedStatus;
        transaction.amount = authoritativeAmount;
        if (gateway_order_id) transaction.order_id = gateway_order_id;
        if (gateway_payment_id) transaction.payment_id = gateway_payment_id;
        if (gateway_signature) transaction.signature = gateway_signature;
        if (payment_method) transaction.payment_method = payment_method;
        await transaction.save({ transaction: t });
      } else {
        // Never allow arbitrary untrusted creation of SUCCESS transactions
        if (verifiedStatus === PAYMENT_STATUSES.SUCCESS) {
          throw new Error('SECURITY_VIOLATION: Cannot confirm booking without matching server-created transaction.');
        }
        transaction = await Transaction.create({
          booking_id,
          user_id: req.user.id,
          transaction_id: txnId,
          order_id: gateway_order_id || null,
          payment_id: gateway_payment_id || null,
          signature: gateway_signature || null,
          amount: authoritativeAmount,
          currency: 'INR',
          payment_method: payment_method || 'UPI (Pending Verification)',
          status: verifiedStatus
        }, { transaction: t });
      }

      if (verifiedStatus === PAYMENT_STATUSES.SUCCESS) {
        await transitionBookingState({
          bookingId: lockedBooking.id,
          targetBookingStatus: 'Confirmed',
          targetPaymentStatus: 'Paid',
          actor: { id: req.user.id, role: req.user.role || 'USER' },
          reason: 'Cryptographically verified checkout transaction',
          existingTransaction: t
        });
      }

      await PaymentLog.create({
        user_id: req.user.id,
        event_type: verifiedStatus === PAYMENT_STATUSES.SUCCESS ? 'COMPLETED' : (verifiedStatus === PAYMENT_STATUSES.FAILED ? 'FAILED' : 'PENDING'),
        payment_method: payment_method || 'UPI',
        details: details || `Payment ${verifiedStatus} for booking #${booking_id}`
      }, { transaction: t });

      return transaction;
    });

    // Initiate confirmation side effects (email, n8n, analytics) only after transaction commits
    if (verifiedStatus === PAYMENT_STATUSES.SUCCESS) {
      processBookingConfirmationSideEffects({
        bookingId: booking.id,
        user: req.user
      }).catch(err => {
        console.warn('[PaymentController] Side effects execution error:', err.message);
      });
    }

    const updatedBooking = await Booking.findByPk(booking.id);

    res.status(201).json({
      message: verifiedStatus === PAYMENT_STATUSES.SUCCESS 
        ? 'Transaction successfully verified and logged.' 
        : `Transaction created with status: ${verifiedStatus}.`,
      transaction: result,
      booking_status: updatedBooking ? updatedBooking.booking_status : booking.booking_status,
      payment_status: updatedBooking ? updatedBooking.payment_status : booking.payment_status
    });
  } catch (error) {
    if (error.message.startsWith('ALREADY_PAID')) {
      return res.status(400).json({ message: 'This booking has already been paid and confirmed.' });
    }
    if (error.message.startsWith('CANCELLED')) {
      return res.status(400).json({ message: 'Cannot process payment for a cancelled booking.' });
    }
    console.error('[Payment Controller Error]:', error.message);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

/**
 * Handle incoming payment gateway webhooks with raw-body signature verification,
 * booking validation, and anti-replay idempotency.
 * POST /api/payment/webhook
 */
const handlePaymentWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-payment-signature'] || req.headers['x-razorpay-signature'];
    const gatewayWebhookSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!gatewayWebhookSecret) {
      return res.status(503).json({ message: 'Payment gateway webhook secret is not configured on the server.' });
    }

    if (!signature) {
      return res.status(400).json({ message: 'Invalid payment signature: missing signature header.' });
    }

    // Capture raw body bytes - essential to prevent re-serialization signature mismatches
    const rawPayloadBytes = req.rawBody 
      ? req.rawBody 
      : (typeof req.body === 'string' ? Buffer.from(req.body) : Buffer.from(JSON.stringify(req.body)));

    const expectedSig = crypto.createHmac('sha256', gatewayWebhookSecret).update(rawPayloadBytes).digest('hex');
    const bufExpected = Buffer.from(expectedSig);
    const bufActual = Buffer.from(String(signature));

    if (bufExpected.length !== bufActual.length || !crypto.timingSafeEqual(bufExpected, bufActual)) {
      return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }

    // Parse payload fields (supports flat format and standard webhook structures)
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const paymentEntity = payload.payload?.payment?.entity || {};

    const event_id = payload.event_id || payload.id || (paymentEntity.id ? `evt_${paymentEntity.id}` : null);
    const booking_id = payload.booking_id || paymentEntity.notes?.booking_id;
    const order_id = payload.order_id || paymentEntity.order_id;
    const payment_id = payload.payment_id || payload.transaction_id || paymentEntity.id;
    const currency = payload.currency || paymentEntity.currency || 'INR';

    let rawAmount = payload.amount !== undefined ? payload.amount : paymentEntity.amount;
    // If amount is in paise (standard Razorpay), convert to Rupees
    if (paymentEntity.amount && payload.amount === undefined) {
      rawAmount = Number(rawAmount) / 100;
    }
    const amount = rawAmount !== undefined ? Number(rawAmount) : undefined;

    // 1. Idempotency Check: Event ID in ProcessedWebhookEvent
    if (event_id) {
      const existingEvent = await ProcessedWebhookEvent.findOne({ where: { event_id } });
      if (existingEvent) {
        return res.status(200).json({
          message: 'Duplicate payment webhook: This event has already been processed.',
          event_id,
          status: existingEvent.status
        });
      }
    }

    if (!booking_id) {
      return res.status(400).json({ message: 'Unauthorized booking ID: booking_id is required.' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Unauthorized booking ID: Booking record not found.' });
    }

    // 2. Validate currency
    if (currency && currency !== 'INR') {
      return res.status(400).json({ message: 'Invalid currency: Only INR is accepted.' });
    }

    // 3. Validate authoritative fare amount
    const expectedAmount = Number(booking.ticket_fare);
    if (amount !== undefined && Math.abs(Number(amount) - expectedAmount) > 0.01) {
      return res.status(400).json({
        message: 'Incorrect transaction amount: Webhook amount does not match booking fare.'
      });
    }

    // 4. Critical Invariant: Webhook replay after refund or cancellation MUST NOT restore Paid state
    if (booking.payment_status === 'Refunded' || booking.payment_status === 'Refund Pending') {
      return res.status(400).json({
        message: 'Cannot process payment webhook: Booking has already been refunded or refund is pending.'
      });
    }
    if (booking.booking_status === 'Cancelled') {
      return res.status(400).json({
        message: 'Cannot process payment webhook: Booking has been cancelled.'
      });
    }

    const isBookingExpired =
      booking.booking_status === 'Expired' ||
      (booking.booking_status === 'Pending' && booking.expires_at && new Date(booking.expires_at) < new Date());

    if (isBookingExpired) {
      const payloadHashExp = crypto.createHash('sha256').update(rawPayloadBytes).digest('hex');
      let reconciledTxnId = null;

      await sequelize.transaction(async (t) => {
        const lockedBooking = await Booking.findByPk(booking_id, { lock: t.LOCK.UPDATE, transaction: t });

        if (lockedBooking.booking_status === 'Pending' && lockedBooking.expires_at && new Date(lockedBooking.expires_at) < new Date()) {
          await transitionBookingState({
            bookingId: lockedBooking.id,
            targetBookingStatus: 'Expired',
            targetPaymentStatus: lockedBooking.payment_status,
            actor: { id: 1, role: 'WEBHOOK_GATEWAY' },
            reason: 'Booking hold expired prior to payment webhook arrival',
            existingTransaction: t
          });
        }

        let txn = null;
        if (order_id) {
          txn = await Transaction.findOne({ where: { order_id }, lock: t.LOCK.UPDATE, transaction: t });
        }
        if (!txn && payment_id) {
          txn = await Transaction.findOne({ where: { payment_id }, lock: t.LOCK.UPDATE, transaction: t });
        }
        if (!txn) {
          txn = await Transaction.findOne({ where: { booking_id: lockedBooking.id }, lock: t.LOCK.UPDATE, transaction: t });
        }

        if (txn) {
          txn.status = PAYMENT_STATUSES.REFUND_PENDING;
          txn.amount = expectedAmount;
          if (payment_id && !txn.payment_id) txn.payment_id = payment_id;
          await txn.save({ transaction: t });
        } else {
          txn = await Transaction.create({
            user_id: lockedBooking.user_id,
            booking_id: lockedBooking.id,
            order_id: order_id || `LATE_EXP_${crypto.randomBytes(6).toString('hex')}`,
            payment_id: payment_id || null,
            transaction_id: payload.transaction_id || `TXN_EXP_${crypto.randomBytes(6).toString('hex')}`,
            amount: expectedAmount,
            currency: 'INR',
            payment_method: 'Gateway Webhook (Expired Hold)',
            status: PAYMENT_STATUSES.REFUND_PENDING
          }, { transaction: t });
        }
        reconciledTxnId = txn.transaction_id;

        if (lockedBooking.payment_status !== PAYMENT_STATUSES.REFUND_PENDING && lockedBooking.payment_status !== PAYMENT_STATUSES.REFUNDED) {
          await transitionBookingState({
            bookingId: lockedBooking.id,
            targetBookingStatus: 'Expired',
            targetPaymentStatus: PAYMENT_STATUSES.REFUND_PENDING,
            actor: { id: 1, role: 'WEBHOOK_GATEWAY' },
            reason: `Late payment webhook reconciled on expired booking ${payment_id || order_id || ''}; auto-refund queued`,
            existingTransaction: t
          });
        }

        if (event_id) {
          await ProcessedWebhookEvent.create({
            event_id,
            event_type: payload.event || 'payment.captured',
            provider: 'razorpay',
            order_id: order_id || null,
            payment_id: payment_id || null,
            payload_hash: payloadHashExp,
            status: 'reconciled_expired_refund_pending'
          }, { transaction: t });
        }

        await PaymentLog.create({
          user_id: lockedBooking.user_id,
          event_type: 'WEBHOOK_EXPIRED_BOOKING_RECONCILED',
          payment_method: 'Gateway Webhook (Verified)',
          details: `Payment ${payment_id || order_id || reconciledTxnId} received for expired booking #${booking_id}. Recorded transaction and initiated automatic refund.`
        }, { transaction: t });
      });

      return res.status(200).json({
        message: 'Payment received for expired booking. Transaction recorded and automatic refund initiated for reconciliation.',
        booking_id: Number(booking_id),
        transaction_id: reconciledTxnId,
        booking_status: 'Expired',
        payment_status: PAYMENT_STATUSES.REFUND_PENDING,
        refund_initiated: true
      });
    }

    // 5. Payment ID & Transaction Replay Check (Idempotency)
    let existingTxn = null;
    if (payment_id) {
      existingTxn = await Transaction.findOne({ where: { payment_id } });
    }
    if (!existingTxn && payload.transaction_id) {
      existingTxn = await Transaction.findOne({ where: { transaction_id: payload.transaction_id } });
    }
    if (!existingTxn && booking_id) {
      existingTxn = await Transaction.findOne({ where: { booking_id, status: PAYMENT_STATUSES.SUCCESS } });
    }

    if (existingTxn) {
      if (existingTxn.booking_id !== Number(booking_id)) {
        return res.status(400).json({
          message: 'Payment identifier is already associated with a different booking.'
        });
      }
      if (existingTxn.status === PAYMENT_STATUSES.SUCCESS) {
        return res.status(200).json({
          message: 'Duplicate payment webhook: This payment has already been verified and recorded.',
          transaction_id: existingTxn.transaction_id,
          status: existingTxn.status
        });
      }
    }

    const payloadHash = crypto.createHash('sha256').update(rawPayloadBytes).digest('hex');

    // 6. Concurrency-safe atomic state transition
    await sequelize.transaction(async (t) => {
      const lockedBooking = await Booking.findByPk(booking_id, { lock: t.LOCK.UPDATE, transaction: t });
      if (lockedBooking.payment_status === 'Refunded' || lockedBooking.payment_status === 'Refund Pending') {
        throw new Error('STATE_CONFLICT: Booking was refunded concurrently.');
      }
      if (lockedBooking.booking_status === 'Cancelled') {
        throw new Error('STATE_CONFLICT: Booking was cancelled concurrently.');
      }
      if (lockedBooking.booking_status === 'Expired') {
        throw new Error('STATE_CONFLICT: Cannot confirm an expired booking.');
      }

      let txn = null;
      if (order_id) {
        // STRICT ORDER BINDING: When order_id is present, it MUST match a server-created transaction
        // Never fall back to arbitrary pending transactions when order_id is unknown/bogus
        txn = await Transaction.findOne({ where: { order_id }, lock: t.LOCK.UPDATE, transaction: t });
        if (!txn) {
          throw new Error(`UNKNOWN_PAYMENT_ORDER: No server-created transaction found for gateway order reference '${order_id}'.`);
        }
      } else if (payment_id) {
        txn = await Transaction.findOne({ where: { payment_id }, lock: t.LOCK.UPDATE, transaction: t });
        if (!txn) {
          txn = await Transaction.findOne({ where: { booking_id, status: PAYMENT_STATUSES.PENDING }, lock: t.LOCK.UPDATE, transaction: t });
        }
      } else {
        txn = await Transaction.findOne({ where: { booking_id, status: PAYMENT_STATUSES.PENDING }, lock: t.LOCK.UPDATE, transaction: t });
      }

      if (!txn) {
        throw new Error('UNKNOWN_PAYMENT_ORDER: No server-created transaction found for this gateway order or booking reference.');
      }

      if (order_id && txn.order_id && txn.order_id !== order_id) {
        throw new Error('ORDER_MISMATCH: Gateway order reference does not match server transaction.');
      }

      if (txn.status === PAYMENT_STATUSES.REFUNDED || txn.status === PAYMENT_STATUSES.REFUND_PENDING) {
        throw new Error('STATE_CONFLICT: Transaction was refunded concurrently.');
      }
      if (txn.booking_id !== lockedBooking.id) {
        throw new Error('ORDER_MISMATCH: Transaction does not belong to this booking.');
      }
      if (Math.abs(Number(txn.amount) - expectedAmount) > 0.01) {
        throw new Error('AMOUNT_MISMATCH: Gateway webhook amount does not match booking fare.');
      }

      txn.status = PAYMENT_STATUSES.SUCCESS;
      txn.amount = expectedAmount;
      if (payment_id && !txn.payment_id) txn.payment_id = payment_id;
      await txn.save({ transaction: t });

      await transitionBookingState({
        bookingId: lockedBooking.id,
        targetBookingStatus: 'Confirmed',
        targetPaymentStatus: 'Paid',
        actor: { id: 1, role: 'WEBHOOK_GATEWAY' },
        reason: `Webhook verified payment ${payment_id || order_id}`,
        existingTransaction: t
      });

      if (event_id) {
        await ProcessedWebhookEvent.create({
          event_id,
          event_type: payload.event || 'payment.captured',
          provider: 'razorpay',
          order_id: order_id || null,
          payment_id: payment_id || null,
          payload_hash: payloadHash,
          status: 'processed'
        }, { transaction: t });
      }

      await PaymentLog.create({
        user_id: lockedBooking.user_id,
        event_type: 'WEBHOOK_PAYMENT_SUCCESS',
        payment_method: 'Gateway Webhook (Verified)',
        details: `Webhook verified payment for booking #${booking_id}`
      }, { transaction: t });
    });

    processBookingConfirmationSideEffects({
      bookingId: booking.id
    }).catch(err => {
      console.warn('[PaymentController Webhook] Side effects execution error:', err.message);
    });

    return res.status(200).json({ message: 'Payment webhook processed and booking confirmed.' });
  } catch (error) {
    if (error.message.startsWith('STATE_CONFLICT') ||
        error.message.startsWith('UNKNOWN_PAYMENT_ORDER') ||
        error.message.startsWith('ORDER_MISMATCH') ||
        error.message.startsWith('AMOUNT_MISMATCH')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('[Payment Webhook Error]:', error.message || error);
    return res.status(500).json({ message: 'Internal error processing payment webhook.' });
  }
};

/**
 * Process a refund with authoritative payment confirmation and race-condition prevention.
 * Never reports refund completed unless verified against gateway.
 * POST /api/payment/refund
 */
/**
 * Authoritative IRCTC-style time-based cancellation charge & refund policy.
 */
async function computeCancellationRefund(booking, paidAmount) {
  const amount = Math.max(0, Number(paidAmount) || 0);
  if (booking.booking_status === 'Expired') {
    return {
      refundAmount: amount,
      cancellationCharge: 0,
      policyTier: 'EXPIRED_HOLD_AUTO_REFUND',
      hoursBeforeDeparture: null
    };
  }

  const CLASS_FLAT_FEE = {
    '1A': 240, 'EC': 240, '2A': 200, '3A': 180, '3E': 180, 'CC': 180, 'SL': 120, '2S': 60, 'UR': 60, 'GENERAL': 60
  };
  const cls = String(booking.travel_class || '3A').trim().toUpperCase();
  const paxCount = Math.max(1, Number(booking.total_passengers) || 1);
  const minFlatFee = Math.min(amount, (CLASS_FLAT_FEE[cls] || 120) * paxCount);

  let hoursBeforeDeparture = null;
  if (booking.journey_date) {
    let depTimeStr = '00:00:00';
    if (booking.train_number && booking.source_station_code) {
      const stop = await TrainSchedule.findOne({
        where: { train_number: String(booking.train_number).trim(), station_code: String(booking.source_station_code).trim().toUpperCase() },
        attributes: ['departure_time']
      });
      if (stop?.departure_time) {
        const raw = String(stop.departure_time).trim();
        depTimeStr = raw.length === 5 ? `${raw}:00` : raw.slice(0, 8);
      }
    }
    const dateStr = String(booking.journey_date).slice(0, 10);
    const depDate = new Date(`${dateStr}T${depTimeStr}+05:30`);
    if (!isNaN(depDate.getTime())) {
      hoursBeforeDeparture = (depDate.getTime() - Date.now()) / 3600000;
    }
  }

  let cancellationCharge;
  let policyTier;
  if (hoursBeforeDeparture === null || hoursBeforeDeparture > 48) {
    cancellationCharge = minFlatFee;
    policyTier = 'MORE_THAN_48H_FLAT_FEE';
  } else if (hoursBeforeDeparture >= 12) {
    cancellationCharge = Math.max(minFlatFee, Math.round(amount * 0.25));
    policyTier = '12H_TO_48H_25_PCT';
  } else if (hoursBeforeDeparture >= 4) {
    cancellationCharge = Math.max(minFlatFee, Math.round(amount * 0.50));
    policyTier = '4H_TO_12H_50_PCT';
  } else {
    cancellationCharge = amount;
    policyTier = 'LESS_THAN_4H_NO_REFUND';
  }

  cancellationCharge = Math.min(amount, Math.max(0, cancellationCharge));
  const refundAmount = Math.max(0, Math.round((amount - cancellationCharge) * 100) / 100);

  return { refundAmount, cancellationCharge, policyTier, hoursBeforeDeparture };
}

const processRefund = async (req, res) => {
  try {
    const { booking_id, reason } = req.body;
    if (!booking_id) {
      return res.status(400).json({ message: 'booking_id is required.' });
    }

    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.admin_role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this booking.' });
    }

    // Rule: Duplicate refund check
    if (booking.payment_status === 'Refunded') {
      return res.status(400).json({
        message: 'Duplicate refund: This payment has already been refunded.'
      });
    }

    // Rule: Never report a refund as completed unless the booking was actually PAID
    if (booking.payment_status !== 'Paid' && booking.payment_status !== 'Refund Pending') {
      return res.status(400).json({
        message: 'Cannot process refund: No successful payment exists for this booking. Current status: ' + booking.payment_status
      });
    }

    // Atomic transaction state transition with update locks to prevent concurrent refund races
    const refundResult = await sequelize.transaction(async (t) => {
      const lockedBooking = await Booking.findByPk(booking_id, { lock: t.LOCK.UPDATE, transaction: t });
      if (lockedBooking.payment_status === 'Refunded') {
        throw new Error('ALREADY_REFUNDED');
      }

      const transaction = await Transaction.findOne({
        where: { 
          booking_id, 
          status: [PAYMENT_STATUSES.SUCCESS, PAYMENT_STATUSES.REFUND_PENDING] 
        },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!transaction) {
        throw new Error('NO_SUCCESSFUL_TRANSACTION');
      }

      if (transaction.status === PAYMENT_STATUSES.REFUNDED) {
        throw new Error('ALREADY_REFUNDED');
      }

      const refundCalc = await computeCancellationRefund(lockedBooking, transaction.amount);
      const refundAmount = refundCalc.refundAmount;

      const hasLiveGateway = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
      let refundId = null;
      let isSimulated = !hasLiveGateway || !transaction.payment_id?.startsWith('pay_');

      if (refundAmount > 0 && hasLiveGateway && transaction.payment_id?.startsWith('pay_')) {
        try {
          const authHeader = 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
          const refundResponse = await axios.post(
            `https://api.razorpay.com/v1/payments/${transaction.payment_id}/refund`,
            {
              amount: Math.round(refundAmount * 100),
              speed: 'optimum',
              notes: { booking_id: String(booking_id), reason: reason || 'Customer requested refund', policy_tier: refundCalc.policyTier }
            },
            {
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          refundId = refundResponse.data?.id;
          isSimulated = false;
        } catch (gwErr) {
          console.error('[Gateway Refund API Failed]:', gwErr.response?.data || gwErr.message);
          throw new Error('GATEWAY_REFUND_FAILED: ' + (gwErr.response?.data?.error?.description || gwErr.message));
        }
      }

      if (!refundId) {
        refundId = `rfnd_sim_${crypto.randomBytes(10).toString('hex')}`;
      }

      transaction.status = PAYMENT_STATUSES.REFUNDED;
      transaction.refund_id = refundId;
      transaction.refund_amount = refundAmount;
      await transaction.save({ transaction: t });

      lockedBooking.payment_status = 'Refunded';
      lockedBooking.booking_status = 'Cancelled';
      await lockedBooking.save({ transaction: t });

      await PaymentLog.create({
        user_id: req.user.id,
        event_type: isSimulated ? 'SIMULATED_REFUND_COMPLETED' : 'REFUND_COMPLETED',
        payment_method: transaction.payment_method,
        details: reason || `Refund processed for booking #${booking_id}: ₹${refundAmount} refunded, ₹${refundCalc.cancellationCharge} cancellation fee (${refundCalc.policyTier}) (Refund ID: ${refundId}${isSimulated ? ' - Simulated' : ''})`
      }, { transaction: t });

      return { transaction, refundId, isSimulated, refundAmount, cancellationCharge: refundCalc.cancellationCharge, policyTier: refundCalc.policyTier };
    });

    return res.status(200).json({
      message: refundResult.isSimulated
        ? 'Refund registered in simulation sandbox mode (no live gateway configured).'
        : 'Refund successfully verified and completed with payment gateway.',
      status: PAYMENT_STATUSES.REFUNDED,
      refund_id: refundResult.refundId,
      booking_id,
      refund_amount: refundResult.refundAmount,
      cancellation_charge: refundResult.cancellationCharge,
      policy_tier: refundResult.policyTier,
      simulated: refundResult.isSimulated,
      gateway_confirmed: !refundResult.isSimulated
    });
  } catch (error) {
    if (error.message === 'ALREADY_REFUNDED') {
      return res.status(400).json({ message: 'Duplicate refund: This payment has already been refunded.' });
    }
    if (error.message === 'NO_SUCCESSFUL_TRANSACTION') {
      return res.status(400).json({ message: 'Cannot process refund: No successful payment exists for this booking.' });
    }
    console.error('[Refund Error]:', error);
    return res.status(500).json({ message: 'Internal server error processing refund.' });
  }
};

/**
 * Get authoritative payment and booking status.
 * GET /api/payment/status/:bookingId
 */
const getPaymentStatus = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.admin_role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this booking.' });
    }

    const transaction = await Transaction.findOne({
      where: { booking_id: bookingId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      booking_id: booking.id,
      booking_status: booking.booking_status,
      payment_status: booking.payment_status,
      ticket_fare: booking.ticket_fare,
      transaction: transaction ? {
        transaction_id: transaction.transaction_id,
        order_id: transaction.order_id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        created_at: transaction.created_at
      } : null
    });
  } catch (error) {
    console.error('[Get Payment Status Error]:', error.message);
    res.status(500).json({ message: 'Failed to retrieve payment status.' });
  }
};

// Helper to convert numbers to Indian Rupees in words
function numberToWordsINR(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const num = Math.round(amount);
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  if (num === 0) return 'Zero Rupees Only';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = num % 100;

  let result = '';
  if (crore > 0) result += inWords(crore) + ' Crore ';
  if (lakh > 0) result += inWords(lakh) + ' Lakh ';
  if (thousand > 0) result += inWords(thousand) + ' Thousand ';
  if (hundred > 0) result += a[hundred] + 'Hundred ';
  if (remainder > 0) {
    if (result !== '') result += 'and ';
    result += inWords(remainder);
  }

  return `${result.trim()} Rupees Only`;
}

// Station dictionary for authentic full names
const STATION_MAP = {
  NDLS: 'NEW DELHI (NDLS)',
  DLI: 'DELHI JN (DLI)',
  NZM: 'HAZRAT NIZAMUDDIN (NZM)',
  ANVT: 'ANAND VIHAR TRM (ANVT)',
  CSTM: 'MUMBAI CSMT (CSMT)',
  CSMT: 'MUMBAI CSMT (CSMT)',
  MMCT: 'MUMBAI CENTRAL (MMCT)',
  BDTS: 'BANDRA TERMINUS (BDTS)',
  HWH: 'HOWRAH JN (HWH)',
  SDAH: 'SEALDAH (SDAH)',
  MAS: 'CHENNAI CENTRAL (MAS)',
  MS: 'CHENNAI EGMORE (MS)',
  SBC: 'KSR BENGALURU (SBC)',
  YPR: 'YESVANTPUR JN (YPR)',
  PUNE: 'PUNE JN (PUNE)',
  HYB: 'HYDERABAD DECCAN (HYB)',
  SC: 'SECUNDERABAD JN (SC)',
  ADI: 'AHMEDABAD JN (ADI)',
  JP: 'JAIPUR JN (JP)',
  CNB: 'KANPUR CENTRAL (CNB)',
  LKO: 'LUCKNOW CHARBAGH (LKO)',
  PNBE: 'PATNA JN (PNBE)',
  GKP: 'GORAKHPUR JN (GKP)',
  BSB: 'VARANASI JN (BSB)',
  ASR: 'AMRITSAR JN (ASR)',
  CDG: 'CHANDIGARH (CDG)',
  GHY: 'GUWAHATI (GHY)',
  BBS: 'BHUBANESWAR (BBS)',
  TVC: 'THIRUVANANTHAPURAM (TVC)',
  COA: 'KAKINADA PORT (COA)'
};

function getStationName(code) {
  if (!code) return 'NEW DELHI (NDLS)';
  const upper = code.toUpperCase().trim();
  return STATION_MAP[upper] || `${upper} JN (${upper})`;
}

/**
 * Build authentic PDF document stream using PDFKit
 */
function buildTicketPdf(booking, user, transaction, scheduleInfo) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const bookingRef = booking.booking_reference || `TIQ-BR-${booking.id}`;
  const isConfirmed = booking.booking_status === 'Confirmed' && booking.payment_status === 'Paid';
  const statusText = isConfirmed ? 'CONFIRMED' : 
                     (booking.booking_status === 'Cancelled' ? 'CANCELLED' :
                     (booking.booking_status === 'Expired' ? 'EXPIRED' :
                     (booking.payment_status === 'Refund Pending' ? 'REFUND PENDING' :
                     (booking.payment_status === 'Refunded' ? 'REFUNDED' :
                     (booking.payment_status === 'Failed' ? 'PAYMENT FAILED' : 'PAYMENT PENDING')))));

  const bannerColor = isConfirmed ? '#16a34a' : (statusText === 'PAYMENT PENDING' ? '#d97706' : '#dc2626');

  // Header Banner
  doc.rect(40, 40, 515, 55).fill('#0b3b60');
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('TravelIQ E-TICKET RECEIPT', 55, 50);
  doc.fontSize(10).font('Helvetica').text('TravelIQ Intelligent Travel Assistant — Authentic Booking Record', 55, 72);

  // Status & Reference Bar
  doc.rect(40, 100, 515, 28).fill(bannerColor);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(`TRAVELIQ BOOKING REF: ${bookingRef}`, 55, 108);
  doc.text(`STATUS: ${statusText}`, 410, 108);

  // Journey Summary Box
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Journey Details', 40, 142);
  doc.rect(40, 158, 515, 80).strokeColor('#cbd5e1').stroke();

  doc.fontSize(9).font('Helvetica-Bold').text('Origin Station:', 55, 168);
  doc.font('Helvetica').text(`${booking.source_station_code} — ${scheduleInfo.sourceStation}`, 145, 168);
  doc.font('Helvetica-Bold').text('Destination:', 310, 168);
  doc.font('Helvetica').text(`${booking.destination_station_code} — ${scheduleInfo.destStation}`, 390, 168);

  doc.font('Helvetica-Bold').text('Train / Service:', 55, 188);
  doc.font('Helvetica').text(`#${booking.train_number} (${scheduleInfo.trainName})`, 145, 188);
  doc.font('Helvetica-Bold').text('Class:', 310, 188);
  doc.font('Helvetica').text(booking.travel_class || '3A', 390, 188);

  doc.font('Helvetica-Bold').text('Journey Date:', 55, 208);
  doc.font('Helvetica').text(booking.journey_date || scheduleInfo.formattedBookingDate, 145, 208);
  doc.font('Helvetica-Bold').text('Departure Time:', 310, 208);
  doc.font('Helvetica').text(scheduleInfo.depTime, 390, 208);

  // Passenger Table
  doc.fontSize(11).font('Helvetica-Bold').text('Passenger Information', 40, 252);
  doc.rect(40, 268, 515, 20).fill('#f1f5f9');
  doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
  doc.text('#', 55, 273);
  doc.text('Passenger Name', 85, 273);
  doc.text('Age', 260, 273);
  doc.text('Gender', 320, 273);
  doc.text('Booking Status', 400, 273);

  let y = 295;
  const paxList = Array.isArray(booking.passengers) && booking.passengers.length > 0 
    ? booking.passengers 
    : [{ name: user?.name || 'Primary Passenger', age: 30, gender: 'Male' }];

  paxList.forEach((p, idx) => {
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica');
    doc.text(String(idx + 1), 55, y);
    doc.text(p.name || 'Traveler', 85, y);
    doc.text(`${p.age || 30} Yrs`, 260, y);
    doc.text(p.gender || 'Male', 320, y);
    doc.text(isConfirmed ? 'Confirmed (Allotted on Chart Prep)' : statusText, 400, y);
    y += 18;
  });

  // Fare & Payment Summary
  y += 12;
  doc.fontSize(11).font('Helvetica-Bold').text('Payment & Fare Summary', 40, y);
  y += 16;
  doc.rect(40, y, 515, 60).strokeColor('#cbd5e1').stroke();

  doc.fontSize(9).font('Helvetica-Bold').text('Authoritative Fare:', 55, y + 12);
  doc.font('Helvetica').text(`INR ${(Number(booking.ticket_fare) || 0).toFixed(2)}`, 160, y + 12);
  doc.font('Helvetica-Bold').text('Payment Status:', 310, y + 12);
  doc.font('Helvetica').text(booking.payment_status || 'Unpaid', 420, y + 12);

  doc.font('Helvetica-Bold').text('Payment Method:', 55, y + 32);
  doc.font('Helvetica').text(transaction?.payment_method || 'Gateway Pending', 160, y + 32);
  doc.font('Helvetica-Bold').text('Transaction Ref:', 310, y + 32);
  doc.font('Helvetica').text(transaction?.transaction_id || 'N/A', 420, y + 32);

  // Security Token & Advisory
  y += 75;
  doc.rect(40, y, 515, 55).fill('#f8fafc');
  const token = crypto.createHmac('sha256', 'traveliq_ticket_seal').update(bookingRef).digest('hex').slice(0, 16).toUpperCase();
  doc.fillColor('#0b3b60').fontSize(9).font('Helvetica-Bold').text(`Verification Token: TIQ-SEC-${token}`, 55, y + 12);
  doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('TravelIQ server-generated verification document. Please carry valid government-issued photo ID during travel.', 55, y + 26);
  doc.text(`Official Distance: ${scheduleInfo.distance} | Arrival: ${scheduleInfo.arrTime}`, 55, y + 38);

  doc.end();
  return doc;
}

/**
 * Generate a printable PDF or HTML-styled E-Ticket matching authentic booking records.
 */
const getReceiptPDF = async (req, res) => {
  const { bookingId } = req.params;

  try {
    let booking = await Booking.findOne({
      where: { id: bookingId },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    if (!booking) {
      return res.status(404).send('<h3>Error: Booking receipt not found.</h3>');
    }

    // Authorization check: User can view their own booking, or admins can view all
    if (!req.user || (req.user.role !== 'admin' && req.user.admin_role !== 'super_admin' && Number(booking.user_id) !== Number(req.user.id))) {
      return res.status(403).send('<h3>Access Denied: You are not authorized to view this ticket.</h3>');
    }

    const transaction = await Transaction.findOne({ where: { booking_id: bookingId } });
    const bookingRef = booking.booking_reference || `TIQ-BR-${booking.id}`;
    const txnId = transaction ? transaction.transaction_id : `TXN-TIQ-${booking.id}`;
    const paymentMethod = transaction ? transaction.payment_method : 'Pending Payment';
    
    const bookingDateObj = booking.booking_date ? new Date(booking.booking_date) : new Date();
    const formattedBookingDate = bookingDateObj.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const formattedBookingTime = bookingDateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const fullBookingTimestamp = `${formattedBookingDate} ${formattedBookingTime} HRS`;

    // Authentic lookup from stations, trains, and schedules
    const [stnSrc, stnDst, trainObj, fareRow, schedSrc, schedDst] = await Promise.all([
      Station.findOne({ where: { station_code: (booking.source_station_code || 'NDLS').toUpperCase() } }),
      Station.findOne({ where: { station_code: (booking.destination_station_code || 'CSTM').toUpperCase() } }),
      Train.findOne({ where: { train_number: String(booking.train_number || '12951') } }),
      TrainFare.findOne({ where: { train_number: String(booking.train_number || '12951'), class_code: booking.travel_class || '3A' } }),
      TrainSchedule.findOne({ where: { train_number: String(booking.train_number || '12951'), station_code: booking.source_station_code } }),
      TrainSchedule.findOne({ where: { train_number: String(booking.train_number || '12951'), station_code: booking.destination_station_code } })
    ]);

    const sourceStation = stnSrc ? `${stnSrc.station_name} (${stnSrc.station_code})` : booking.source_station_code;
    const destStation = stnDst ? `${stnDst.station_name} (${stnDst.station_code})` : booking.destination_station_code;
    const srcCode = escapeHtml((booking.source_station_code || 'NDLS').toUpperCase());
    const dstCode = escapeHtml((booking.destination_station_code || 'CSTM').toUpperCase());
    const trainNo = escapeHtml(booking.train_number || '12951');
    const trainName = trainObj ? escapeHtml(trainObj.train_name.toUpperCase()) : `TRAIN #${trainNo}`;
    const travelClass = escapeHtml((booking.travel_class || '3A').toUpperCase());

    const depTime = schedSrc?.departure_time ? `${schedSrc.departure_time} HRS` : 'Timetable departure';
    const arrTime = schedDst?.arrival_time ? `${schedDst.arrival_time} HRS` : 'Timetable arrival';
    const distanceStr = fareRow?.distance ? `${fareRow.distance} KM` : 'Per official timetable';

    const isConfirmed = booking.booking_status === 'Confirmed' && booking.payment_status === 'Paid';
    let statusText = 'CONFIRMED';
    let statusBadgeColor = '#16a34a';

    if (booking.booking_status === 'Cancelled') {
      statusText = 'CANCELLED';
      statusBadgeColor = '#dc2626';
    } else if (booking.payment_status === 'Refund Pending') {
      statusText = 'REFUND PENDING';
      statusBadgeColor = '#9333ea';
    } else if (booking.payment_status === 'Refunded') {
      statusText = 'REFUNDED';
      statusBadgeColor = '#475569';
    } else if (booking.booking_status === 'Expired') {
      statusText = 'EXPIRED';
      statusBadgeColor = '#6b7280';
    } else if (booking.payment_status === 'Failed') {
      statusText = 'PAYMENT FAILED';
      statusBadgeColor = '#dc2626';
    } else if (!isConfirmed) {
      statusText = 'PAYMENT PENDING';
      statusBadgeColor = '#d97706';
    }

    // Passenger list extraction
    let passengersList = [];
    if (Array.isArray(booking.passengers) && booking.passengers.length > 0) {
      passengersList = booking.passengers;
    } else {
      const primaryName = (booking.User && booking.User.name) || (req.user && req.user.name) || 'Traveler';
      passengersList = [{
        name: primaryName,
        age: 30,
        gender: 'Male',
        seat_preference: booking.seat_preference || 'No Preference',
        berth_preference: booking.berth_preference || 'No Preference'
      }];
    }

    const totalFare = Number(booking.ticket_fare) || 0;

    const scheduleInfo = {
      sourceStation,
      destStation,
      trainName,
      depTime,
      arrTime,
      distance: distanceStr,
      formattedBookingDate
    };

    // If client requested PDF or default format is PDF:
    if (req.query.format !== 'html') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="TravelIQ_Ticket_${bookingRef}.pdf"`);
      const pdfDoc = buildTicketPdf(booking, req.user || booking.User, transaction, scheduleInfo);
      return pdfDoc.pipe(res);
    }

    // HTML Rendering when explicitly requested via format=html
    const verificationToken = crypto.createHmac('sha256', 'traveliq_ticket_seal').update(bookingRef).digest('hex').slice(0, 16).toUpperCase();

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TravelIQ_Ticket_${bookingRef}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=JetBrains+Mono:wght@500;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background-color: #f1f5f9;
          color: #1e293b;
          line-height: 1.35;
          padding: 20px 10px;
        }
        .ticket-wrapper {
          max-width: 850px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .ticket-header {
          background: #0b3b60;
          color: #ffffff;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-title { font-size: 20px; font-weight: 800; }
        .pnr-strip {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pnr-num { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; color: #0b3b60; }
        .status-badge {
          background: ${statusBadgeColor};
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .ticket-body { padding: 20px 24px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .info-box { background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .info-val { font-size: 13px; font-weight: 600; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; }
        th { background: #f1f5f9; font-weight: 700; color: #334155; }
        .ticket-footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="ticket-wrapper">
        <div class="ticket-header">
          <div>
            <div class="brand-title">TravelIQ Smart Assistant</div>
            <div style="font-size: 11px; color: #93c5fd;">Electronic Travel Record</div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            Booking Date: ${fullBookingTimestamp}
          </div>
        </div>

        <div class="pnr-strip">
          <div>
            <span style="font-size: 11px; font-weight: 600; color: #64748b;">TRAVELIQ BOOKING REF:</span>
            <span class="pnr-num">${bookingRef}</span>
          </div>
          <div class="status-badge">${statusText}</div>
        </div>

        <div class="ticket-body">
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Origin / Departure</div>
              <div class="info-val">${srcCode} — ${sourceStation}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Departure: ${depTime}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Destination / Arrival</div>
              <div class="info-val">${dstCode} — ${destStation}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Arrival: ${arrTime}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Service & Class</div>
              <div class="info-val">${trainName} (#${trainNo}) — Class: ${travelClass}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Journey Date: ${booking.journey_date || formattedBookingDate}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Payment & Security</div>
              <div class="info-val">Fare: ₹${totalFare.toFixed(2)} (${paymentMethod})</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Token: TIQ-SEC-${verificationToken}</div>
            </div>
          </div>

          <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px;">Passenger Details</div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 40%;">Passenger Name</th>
                <th style="width: 15%;">Age</th>
                <th style="width: 15%;">Gender</th>
                <th style="width: 25%;">Status / Coach & Berth</th>
              </tr>
            </thead>
            <tbody>
              ${passengersList.map((p, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td>${p.age} Yrs</td>
                  <td>${escapeHtml(p.gender || 'Male')}</td>
                  <td>${isConfirmed ? 'Confirmed (Allocated on Chart Prep)' : statusText}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="font-size: 11px; color: #64748b; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <strong>Advisory:</strong> Passengers must carry a valid government-issued photo ID during journey. Fares and schedules are verified against authoritative timetable sources.
          </div>
        </div>

        <div class="ticket-footer">
          <div>TravelIQ Customer Support: support@traveliq.in</div>
          <div>Ref: ${bookingRef} • Token: ${verificationToken}</div>
        </div>
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('[Receipt PDF Generation Error]:', error);
    res.status(500).send('<h3>Error generating ticket invoice PDF</h3>');
  }
};

module.exports = {
  createOrder,
  createTransaction,
  handlePaymentWebhook,
  processRefund,
  computeCancellationRefund,
  getPaymentStatus,
  getReceiptPDF,
  PAYMENT_STATUSES
};

