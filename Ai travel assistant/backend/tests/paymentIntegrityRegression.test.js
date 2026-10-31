'use strict';
const assert = require('assert');
const crypto = require('crypto');
const { createOrder, createTransaction, handlePaymentWebhook, processRefund, getPaymentStatus, PAYMENT_STATUSES } = require('../controllers/paymentController');
const { cancelBooking } = require('../controllers/profileController');
const { User, Booking, Trip, Transaction, ProcessedWebhookEvent, sequelize } = require('../models');

async function runPaymentIntegrityRegressionTests() {
  console.log('================================================================');
  console.log('💳 Phase 3 & 4: Payment Integrity, Anti-Replay & Concurrency Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  function createMockRes() {
    return {
      statusCode: null,
      data: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.data = obj;
        return this;
      }
    };
  }

  const webhookSecret = 'test_webhook_gateway_secret_key_32chars!';
  process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET = webhookSecret;
  process.env.PAYMENT_GATEWAY_SECRET = webhookSecret;

  let user1, user2;
  let bookingHigh, bookingLow;

  try {
    // Setup test users
    user1 = await User.create({
      name: 'Payment User 1',
      email: `pay_u1_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    user2 = await User.create({
      name: 'Payment User 2',
      email: `pay_u2_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    // Booking 1: High value ₹11,400
    const trip1 = await Trip.create({
      user_id: user1.id,
      source: 'NDLS',
      destination: 'CSTM',
      travel_mode: 'Train',
      predicted_price: 11400
    });
    bookingHigh = await Booking.create({
      user_id: user1.id,
      trip_id: trip1.id,
      source_station_code: 'NDLS',
      destination_station_code: 'CSTM',
      train_number: '12951',
      travel_class: '1A',
      ticket_fare: 11400,
      payment_status: 'Unpaid',
      booking_status: 'Pending'
    });

    // Booking 2: Low value ₹195
    const trip2 = await Trip.create({
      user_id: user1.id,
      source: 'NDLS',
      destination: 'GZB',
      travel_mode: 'Train',
      predicted_price: 195
    });
    bookingLow = await Booking.create({
      user_id: user1.id,
      trip_id: trip2.id,
      source_station_code: 'NDLS',
      destination_station_code: 'GZB',
      train_number: '12004',
      travel_class: '2S',
      ticket_fare: 195,
      payment_status: 'Unpaid',
      booking_status: 'Pending'
    });

  } catch (err) {
    console.error('Test DB setup failed:', err);
  }

  try {
    // 1. ₹195 payment attempt against ₹11,400 booking
    await test('1. ₹195 payment against ₹11,400 booking is strictly rejected', async () => {
      // Create order for the low booking
      const lowOrderRes = createMockRes();
      await createOrder({ user: user1, body: { booking_id: bookingLow.id } }, lowOrderRes);
      const lowOrderId = lowOrderRes.data.order_id;

      // Attacker generates valid signature for low order
      const lowPaymentId = `pay_low_${Date.now()}`;
      const validLowSig = crypto.createHmac('sha256', webhookSecret)
        .update(`${lowOrderId}|${lowPaymentId}`)
        .digest('hex');

      // Attempt to satisfy ₹11,400 booking using the ₹195 order & payment
      const attackRes = createMockRes();
      await createTransaction({
        user: user1,
        body: {
          booking_id: bookingHigh.id,
          gateway_order_id: lowOrderId,
          gateway_payment_id: lowPaymentId,
          gateway_signature: validLowSig,
          amount: 195
        }
      }, attackRes);

      assert.strictEqual(attackRes.statusCode, 400, 'Must reject ₹195 order for ₹11,400 booking');
      assert.ok(
        attackRes.data.message.includes('mismatch'),
        `Expected mismatch error, got: ${attackRes.data.message}`
      );

      // Verify ₹11,400 booking is still Unpaid
      await bookingHigh.reload();
      assert.strictEqual(bookingHigh.payment_status, 'Unpaid');
      assert.strictEqual(bookingHigh.booking_status, 'Pending');
    });

    // 2. Correct payment against correct booking
    let highOrderId, highPaymentId, validHighSig;
    await test('2. Correct payment against correct booking succeeds and binds atomically', async () => {
      const orderRes = createMockRes();
      await createOrder({ user: user1, body: { booking_id: bookingHigh.id } }, orderRes);
      highOrderId = orderRes.data.order_id;

      highPaymentId = `pay_high_${Date.now()}`;
      validHighSig = crypto.createHmac('sha256', webhookSecret)
        .update(`${highOrderId}|${highPaymentId}`)
        .digest('hex');

      const txnRes = createMockRes();
      await createTransaction({
        user: user1,
        body: {
          booking_id: bookingHigh.id,
          gateway_order_id: highOrderId,
          gateway_payment_id: highPaymentId,
          gateway_signature: validHighSig,
          amount: 11400
        }
      }, txnRes);

      assert.strictEqual(txnRes.statusCode, 201);
      assert.strictEqual(txnRes.data.transaction.status, PAYMENT_STATUSES.SUCCESS);

      await bookingHigh.reload();
      assert.strictEqual(bookingHigh.payment_status, 'Paid');
      assert.strictEqual(bookingHigh.booking_status, 'Confirmed');
    });

    // 3. Payment replay against a second booking
    await test('3. Payment replay against a second booking is rejected (Payment ID cannot be reused)', async () => {
      // Try to use highPaymentId to confirm bookingLow
      const replayOrderRes = createMockRes();
      await createOrder({ user: user1, body: { booking_id: bookingLow.id } }, replayOrderRes);
      const replayOrderId = replayOrderRes.data.order_id;

      const replaySig = crypto.createHmac('sha256', webhookSecret)
        .update(`${replayOrderId}|${highPaymentId}`)
        .digest('hex');

      const replayRes = createMockRes();
      await createTransaction({
        user: user1,
        body: {
          booking_id: bookingLow.id,
          gateway_order_id: replayOrderId,
          gateway_payment_id: highPaymentId, // REPLAYED payment ID
          gateway_signature: replaySig
        }
      }, replayRes);

      assert.strictEqual(replayRes.statusCode, 400);
      assert.ok(replayRes.data.message.includes('already been processed'));
    });

    // 4. Payment associated with User 1 cannot confirm User 2 booking
    await test('4. Payment associated with User 1 cannot confirm User 2 booking', async () => {
      // User 2 creates a booking
      const tripU2 = await Trip.create({ user_id: user2.id, source: 'NDLS', destination: 'CNB', travel_mode: 'Train', predicted_price: 1000 });
      const bookingU2 = await Booking.create({
        user_id: user2.id,
        trip_id: tripU2.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: 1000,
        payment_status: 'Unpaid',
        booking_status: 'Pending'
      });

      // User 1 creates an order
      const u1OrderRes = createMockRes();
      await createOrder({ user: user1, body: { booking_id: bookingLow.id } }, u1OrderRes);
      const u1OrderId = u1OrderRes.data.order_id;
      const u1PaymentId = `pay_cross_${Date.now()}`;
      const u1Sig = crypto.createHmac('sha256', webhookSecret).update(`${u1OrderId}|${u1PaymentId}`).digest('hex');

      // User 2 tries to use User 1's order to confirm User 2's booking
      const crossRes = createMockRes();
      await createTransaction({
        user: user2,
        body: {
          booking_id: bookingU2.id,
          gateway_order_id: u1OrderId,
          gateway_payment_id: u1PaymentId,
          gateway_signature: u1Sig
        }
      }, crossRes);

      assert.strictEqual(crossRes.statusCode, 400);
      assert.ok(crossRes.data.message.includes('mismatch'));
    });

    // 5. Invalid and modified webhook payloads
    await test('5. Webhook rejects invalid HMAC signature without changing state', async () => {
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        event_id: `evt_tamper_${Date.now()}`,
        booking_id: bookingLow.id,
        amount: 195,
        currency: 'INR'
      });

      const req = {
        headers: { 'x-payment-signature': 'invalid_forged_signature_12345' },
        rawBody: Buffer.from(webhookPayload),
        body: JSON.parse(webhookPayload)
      };
      const res = createMockRes();
      await handlePaymentWebhook(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Invalid payment signature'));

      await bookingLow.reload();
      assert.strictEqual(bookingLow.payment_status, 'Unpaid');
    });

    // 6. Valid webhook confirming payment
    let validWebhookEventId = `evt_valid_${Date.now()}`;
    let webhookPayId = `pay_wh_${Date.now()}`;
    await test('6. Valid raw-body webhook verifies and confirms booking', async () => {
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        event_id: validWebhookEventId,
        booking_id: bookingLow.id,
        payment_id: webhookPayId,
        amount: 195,
        currency: 'INR'
      });

      const signature = crypto.createHmac('sha256', webhookSecret)
        .update(Buffer.from(webhookPayload))
        .digest('hex');

      const req = {
        headers: { 'x-payment-signature': signature },
        rawBody: Buffer.from(webhookPayload),
        body: JSON.parse(webhookPayload)
      };
      const res = createMockRes();
      await handlePaymentWebhook(req, res);

      assert.strictEqual(res.statusCode, 200);
      await bookingLow.reload();
      assert.strictEqual(bookingLow.payment_status, 'Paid');
      assert.strictEqual(bookingLow.booking_status, 'Confirmed');
    });

    // 7. Duplicate webhook delivery (idempotent 200)
    await test('7. Duplicate webhook delivery returns idempotent 200 without duplicate state change', async () => {
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        event_id: validWebhookEventId,
        booking_id: bookingLow.id,
        payment_id: webhookPayId,
        amount: 195,
        currency: 'INR'
      });

      const signature = crypto.createHmac('sha256', webhookSecret)
        .update(Buffer.from(webhookPayload))
        .digest('hex');

      const req = {
        headers: { 'x-payment-signature': signature },
        rawBody: Buffer.from(webhookPayload),
        body: JSON.parse(webhookPayload)
      };
      const res = createMockRes();
      await handlePaymentWebhook(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.message.includes('Duplicate payment webhook'));
    });

    // 8. Cancellation of an unpaid booking never labels it Refunded
    let unpaidBooking;
    await test('8. Cancellation of an unpaid booking sets Unpaid / Cancelled, NEVER Refunded', async () => {
      const trip = await Trip.create({ user_id: user1.id, source: 'NDLS', destination: 'CNB', travel_mode: 'Train', predicted_price: 500 });
      unpaidBooking = await Booking.create({
        user_id: user1.id,
        trip_id: trip.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: 500,
        payment_status: 'Unpaid',
        booking_status: 'Pending'
      });

      const cancelRes = createMockRes();
      await cancelBooking({ user: user1, params: { id: unpaidBooking.id } }, cancelRes);

      assert.strictEqual(cancelRes.statusCode, null);
      await unpaidBooking.reload();
      assert.strictEqual(unpaidBooking.booking_status, 'Cancelled');
      assert.strictEqual(unpaidBooking.payment_status, 'Unpaid', 'Unpaid booking MUST NOT be marked Refunded');
    });

    // 9. Repeated cancellation is rejected / idempotent
    await test('9. Repeated cancellation is rejected safely (cannot repeat transition)', async () => {
      const cancelRes = createMockRes();
      await cancelBooking({ user: user1, params: { id: unpaidBooking.id } }, cancelRes);

      assert.strictEqual(cancelRes.statusCode, 400);
      assert.ok(cancelRes.data.message.includes('already cancelled'));
    });

    // 10. Refund of a paid booking
    await test('10. Refund of a paid booking transitions state to Refunded atomically', async () => {
      const refundRes = createMockRes();
      await processRefund({ user: user1, body: { booking_id: bookingHigh.id, reason: 'Travel plan cancelled' } }, refundRes);

      assert.strictEqual(refundRes.statusCode, 200);
      assert.strictEqual(refundRes.data.status, PAYMENT_STATUSES.REFUNDED);

      await bookingHigh.reload();
      assert.strictEqual(bookingHigh.payment_status, 'Refunded');
      assert.strictEqual(bookingHigh.booking_status, 'Cancelled');
    });

    // 11. Refund of an already-refunded payment
    await test('11. Refund of an already-refunded payment is rejected (no double refund)', async () => {
      const refundRes = createMockRes();
      await processRefund({ user: user1, body: { booking_id: bookingHigh.id } }, refundRes);

      assert.strictEqual(refundRes.statusCode, 400);
      assert.ok(refundRes.data.message.includes('already been refunded'));
    });

    // 12. Webhook replay AFTER refund is rejected and CANNOT restore Paid/Confirmed
    await test('12. Webhook replay AFTER refund is rejected (never restores Paid/Confirmed)', async () => {
      const replayPayload = JSON.stringify({
        event: 'payment.captured',
        event_id: `evt_replay_after_rfnd_${Date.now()}`,
        booking_id: bookingHigh.id,
        amount: 11400,
        currency: 'INR'
      });

      const signature = crypto.createHmac('sha256', webhookSecret)
        .update(Buffer.from(replayPayload))
        .digest('hex');

      const req = {
        headers: { 'x-payment-signature': signature },
        rawBody: Buffer.from(replayPayload),
        body: JSON.parse(replayPayload)
      };
      const res = createMockRes();
      await handlePaymentWebhook(req, res);

      assert.strictEqual(res.statusCode, 400, 'Must reject webhook on refunded booking');
      assert.ok(res.data.message.includes('already been refunded'));

      // Ensure booking remains Refunded and Cancelled
      await bookingHigh.reload();
      assert.strictEqual(bookingHigh.payment_status, 'Refunded', 'Must remain Refunded');
      assert.strictEqual(bookingHigh.booking_status, 'Cancelled', 'Must remain Cancelled');
    });

    // 13. Two simultaneous refund requests race test
    await test('13. Concurrent refund operations race safely (only one succeeds)', async () => {
      const trip = await Trip.create({ user_id: user1.id, source: 'NDLS', destination: 'CSTM', travel_mode: 'Train', predicted_price: 2000 });
      const raceBooking = await Booking.create({
        user_id: user1.id,
        trip_id: trip.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CSTM',
        train_number: '12951',
        travel_class: '3A',
        ticket_fare: 2000,
        payment_status: 'Paid',
        booking_status: 'Confirmed'
      });

      await Transaction.create({
        booking_id: raceBooking.id,
        user_id: user1.id,
        transaction_id: `TXN-RACE-${Date.now()}`,
        order_id: `order_race_${Date.now()}`,
        payment_id: `pay_race_${Date.now()}`,
        amount: 2000,
        currency: 'INR',
        payment_method: 'UPI',
        status: PAYMENT_STATUSES.SUCCESS
      });

      const res1 = createMockRes();
      const res2 = createMockRes();

      await Promise.all([
        processRefund({ user: user1, body: { booking_id: raceBooking.id } }, res1),
        processRefund({ user: user1, body: { booking_id: raceBooking.id } }, res2)
      ]);

      const statuses = [res1.statusCode, res2.statusCode];
      assert.ok(statuses.includes(200), 'One request must succeed with 200');
      assert.ok(statuses.includes(400), 'Second concurrent request must fail with 400');

      // Verify refund count in DB
      const refundedTxnCount = await Transaction.count({
        where: { booking_id: raceBooking.id, status: PAYMENT_STATUSES.REFUNDED }
      });
      assert.strictEqual(refundedTxnCount, 1, 'Exactly one transaction record must be refunded');
    });

  } finally {
    // Cleanup
    if (user1) {
      await Booking.destroy({ where: { user_id: user1.id } });
      await Trip.destroy({ where: { user_id: user1.id } });
      await Transaction.destroy({ where: { user_id: user1.id } });
      await User.destroy({ where: { id: user1.id } });
    }
    if (user2) {
      await Booking.destroy({ where: { user_id: user2.id } });
      await Trip.destroy({ where: { user_id: user2.id } });
      await Transaction.destroy({ where: { user_id: user2.id } });
      await User.destroy({ where: { id: user2.id } });
    }
  }

  console.log('\n================================================================');
  console.log(`Payment Integrity Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPaymentIntegrityRegressionTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

