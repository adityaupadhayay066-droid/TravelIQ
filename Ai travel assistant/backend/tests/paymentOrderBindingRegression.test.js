'use strict';
const assert = require('assert');
const crypto = require('crypto');
const { createTransaction, handlePaymentWebhook, PAYMENT_STATUSES } = require('../controllers/paymentController');
const { User, Booking, Trip, Transaction, ProcessedWebhookEvent, sequelize } = require('../models');

async function runPaymentOrderBindingRegressionTests() {
  console.log('================================================================');
  console.log('🔒 P0 — Payment Order-Binding & Financial Integrity Regression Suite');
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

  const gatewaySecret = 'test_gateway_secret_key_binding_32chars!';
  process.env.PAYMENT_GATEWAY_SECRET = gatewaySecret;
  process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET = gatewaySecret;

  let user1, user2;
  let bookingHigh, bookingLow;
  let tripHigh, tripLow;

  try {
    const ts = Date.now();
    user1 = await User.create({
      name: 'Binding Victim User',
      email: `victim_${ts}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    user2 = await User.create({
      name: 'Binding Attacker User',
      email: `attacker_${ts}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    tripHigh = await Trip.create({
      user_id: user1.id,
      source: 'NDLS',
      destination: 'BOM',
      fare: 19120.00,
      mode: 'Train',
      status: 'Planned'
    });

    bookingHigh = await Booking.create({
      user_id: user1.id,
      trip_id: tripHigh.id,
      ticket_fare: 19120.00,
      total_fare: 19120.00,
      payment_status: 'Pending',
      booking_status: 'Pending'
    });

    tripLow = await Trip.create({
      user_id: user2.id,
      source: 'GHY',
      destination: 'HWH',
      fare: 195.00,
      mode: 'Train',
      status: 'Planned'
    });

    bookingLow = await Booking.create({
      user_id: user2.id,
      trip_id: tripLow.id,
      ticket_fare: 195.00,
      total_fare: 195.00,
      payment_status: 'Pending',
      booking_status: 'Pending'
    });

    // Helper to generate isolated fresh booking
    async function createFreshBooking(user, fare = 19120.00) {
      const trip = await Trip.create({
        user_id: user.id,
        source: 'NDLS',
        destination: 'BOM',
        fare,
        mode: 'Train',
        status: 'Planned'
      });
      const booking = await Booking.create({
        user_id: user.id,
        trip_id: trip.id,
        ticket_fare: fare,
        total_fare: fare,
        payment_status: 'Pending',
        booking_status: 'Pending'
      });
      return { trip, booking };
    }

    // ─── Test 1: Valid payment for a known order and correct amount succeeds ───
    await test('1. A valid payment for a known order and matching authoritative amount succeeds', async () => {
      const { booking } = await createFreshBooking(user1, 19120.00);
      const orderId = `ord_valid_${Date.now()}_1`;
      const paymentId = `pay_valid_${Date.now()}_1`;
      const sigData = `${orderId}|${paymentId}`;
      const validSig = crypto.createHmac('sha256', gatewaySecret).update(sigData).digest('hex');

      // Server creates pending transaction attempt
      await Transaction.create({
        booking_id: booking.id,
        user_id: user1.id,
        transaction_id: `TXN-${Date.now()}-V1`,
        order_id: orderId,
        amount: 19120.00,
        currency: 'INR',
        payment_method: 'Gateway',
        status: PAYMENT_STATUSES.PENDING
      });

      const req = {
        user: user1,
        body: {
          booking_id: booking.id,
          amount: 19120.00,
          gateway_order_id: orderId,
          gateway_payment_id: paymentId,
          gateway_signature: validSig
        }
      };
      const res = createMockRes();

      await createTransaction(req, res);
      assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.data)}`);

      // Verify DB state
      const updatedBooking = await Booking.findByPk(booking.id);
      assert.strictEqual(updatedBooking.payment_status, 'Paid');
      assert.strictEqual(updatedBooking.booking_status, 'Confirmed');

      const updatedTxn = await Transaction.findOne({ where: { order_id: orderId } });
      assert.strictEqual(updatedTxn.status, PAYMENT_STATUSES.SUCCESS);
      assert.strictEqual(updatedTxn.payment_id, paymentId);
    });

    // ─── Test 2: Validly signed payment for an unknown order MUST BE REJECTED ───
    await test('2. Validly signed payment for an order the server never created is strictly rejected (P0 Core Fix)', async () => {
      const { booking } = await createFreshBooking(user1, 19120.00);
      const fakeOrderId = `ord_phantom_${Date.now()}_2`;
      const fakePaymentId = `pay_phantom_${Date.now()}_2`;
      const sigData = `${fakeOrderId}|${fakePaymentId}`;
      const validSigForFakeOrder = crypto.createHmac('sha256', gatewaySecret).update(sigData).digest('hex');

      const req = {
        user: user1,
        body: {
          booking_id: booking.id,
          amount: 19120.00,
          gateway_order_id: fakeOrderId,
          gateway_payment_id: fakePaymentId,
          gateway_signature: validSigForFakeOrder
        }
      };
      const res = createMockRes();

      await createTransaction(req, res);
      assert.strictEqual(res.statusCode, 400, `Expected 400 rejection for unknown order, got ${res.statusCode}`);
      assert.ok(res.data.message.includes('Unknown payment order') || res.data.message.includes('No matching server-created order'),
        `Unexpected error message: ${res.data?.message}`);

      // Crucial: Assert DB state was NOT modified
      const unconfirmedBooking = await Booking.findByPk(booking.id);
      assert.strictEqual(unconfirmedBooking.payment_status, 'Pending');
      assert.strictEqual(unconfirmedBooking.booking_status, 'Pending');

      const phantomTxn = await Transaction.findOne({ where: { order_id: fakeOrderId } });
      assert.strictEqual(phantomTxn, null, 'Phantom transaction must NEVER be implicitly created in database');
    });

    // ─── Test 3: Payment for a different booking is rejected ───
    await test('3. Payment initiated for Booking A cannot confirm Booking B (Order-Booking Binding)', async () => {
      const { booking: bookingA } = await createFreshBooking(user1, 19120.00);
      const { booking: bookingB } = await createFreshBooking(user2, 195.00);

      const orderIdForB = `ord_low_${Date.now()}_3`;
      const paymentIdForB = `pay_low_${Date.now()}_3`;
      const sigData = `${orderIdForB}|${paymentIdForB}`;
      const sig = crypto.createHmac('sha256', gatewaySecret).update(sigData).digest('hex');

      // Server creates order bound to bookingB
      await Transaction.create({
        booking_id: bookingB.id,
        user_id: user2.id,
        transaction_id: `TXN-${Date.now()}-L1`,
        order_id: orderIdForB,
        amount: 195.00,
        currency: 'INR',
        payment_method: 'Gateway',
        status: PAYMENT_STATUSES.PENDING
      });

      // Attacker attempts to apply orderIdForB to bookingA
      const req = {
        user: user1,
        body: {
          booking_id: bookingA.id,
          amount: 19120.00,
          gateway_order_id: orderIdForB,
          gateway_payment_id: paymentIdForB,
          gateway_signature: sig
        }
      };
      const res = createMockRes();

      await createTransaction(req, res);
      assert.strictEqual(res.statusCode, 400, 'Must reject order belonging to a different booking');

      const checkBooking = await Booking.findByPk(bookingA.id);
      assert.strictEqual(checkBooking.payment_status, 'Pending');
    });

    // ─── Test 4: Payment initiated by a different user is rejected ───
    await test('4. Payment order belonging to User 2 cannot confirm booking for User 1 (IDOR Binding)', async () => {
      const { booking } = await createFreshBooking(user1, 19120.00);
      const orderIdUser2 = `ord_u2_${Date.now()}_4`;
      const paymentIdUser2 = `pay_u2_${Date.now()}_4`;
      const sig = crypto.createHmac('sha256', gatewaySecret).update(`${orderIdUser2}|${paymentIdUser2}`).digest('hex');

      await Transaction.create({
        booking_id: booking.id, // maliciously forged in server txn
        user_id: user2.id,      // but owned by user2
        transaction_id: `TXN-${Date.now()}-U2`,
        order_id: orderIdUser2,
        amount: 19120.00,
        currency: 'INR',
        payment_method: 'Gateway',
        status: PAYMENT_STATUSES.PENDING
      });

      const req = {
        user: user1, // caller is user1
        body: {
          booking_id: booking.id,
          amount: 19120.00,
          gateway_order_id: orderIdUser2,
          gateway_payment_id: paymentIdUser2,
          gateway_signature: sig
        }
      };
      const res = createMockRes();

      await createTransaction(req, res);
      assert.strictEqual(res.statusCode, 403, `Expected 403 user mismatch, got ${res.statusCode}`);
    });

    // ─── Test 5: ₹195 payment cannot confirm a ₹19,120 booking ───
    await test('5. ₹195 payment attempt cannot confirm a ₹19,120 booking (Amount Discrepancy Integrity)', async () => {
      const { booking } = await createFreshBooking(user1, 19120.00);
      const orderIdSmall = `ord_small_${Date.now()}_5`;
      const paymentIdSmall = `pay_small_${Date.now()}_5`;
      const sig = crypto.createHmac('sha256', gatewaySecret).update(`${orderIdSmall}|${paymentIdSmall}`).digest('hex');

      await Transaction.create({
        booking_id: booking.id,
        user_id: user1.id,
        transaction_id: `TXN-${Date.now()}-SML`,
        order_id: orderIdSmall,
        amount: 195.00, // Small amount on server order
        currency: 'INR',
        payment_method: 'Gateway',
        status: PAYMENT_STATUSES.PENDING
      });

      const req = {
        user: user1,
        body: {
          booking_id: booking.id,
          amount: 195.00,
          gateway_order_id: orderIdSmall,
          gateway_payment_id: paymentIdSmall,
          gateway_signature: sig
        }
      };
      const res = createMockRes();

      await createTransaction(req, res);
      assert.strictEqual(res.statusCode, 400, 'Must reject when order amount does not match authoritative booking total_fare');

      const checkBooking = await Booking.findByPk(booking.id);
      assert.strictEqual(checkBooking.payment_status, 'Pending');
    });

    // ─── Test 6: Replayed payment cannot confirm another booking ───
    await test('6. Replayed gateway_payment_id is strictly rejected', async () => {
      const { booking: bookingOld } = await createFreshBooking(user2, 195.00);
      const { booking: bookingNew } = await createFreshBooking(user1, 19120.00);

      const alreadyUsedPayId = `pay_already_processed_${Date.now()}_6`;
      await Transaction.create({
        booking_id: bookingOld.id,
        user_id: user2.id,
        transaction_id: `TXN-${Date.now()}-RP`,
        order_id: `ord_rp_${Date.now()}_6`,
        payment_id: alreadyUsedPayId,
        amount: 195.00,
        currency: 'INR',
        payment_method: 'Gateway',
        status: PAYMENT_STATUSES.SUCCESS
      });

      const orderNew = `ord_new_${Date.now()}_6`;
      const sig = crypto.createHmac('sha256', gatewaySecret).update(`${orderNew}|${alreadyUsedPayId}`).digest('hex');

      const req = {
        user: user1,
        body: {
          booking_id: bookingNew.id,
          amount: 19120.00,
          gateway_order_id: orderNew,
          gateway_payment_id: alreadyUsedPayId,
          gateway_signature: sig
        }
      };
      const res = createMockRes();

      await createTransaction(req, res);
      assert.strictEqual(res.statusCode, 400, 'Must reject replayed payment identifier');
      assert.ok(res.data.message.includes('already been processed'), 'Expected replay error message');
    });

    // ─── Test 7: Webhook for unknown order is rejected and does NOT create transaction ───
    await test('7. Gateway webhook for unknown order is rejected and never creates implicit transaction', async () => {
      const { booking } = await createFreshBooking(user1, 19120.00);
      const unknownOrder = `ord_webhook_unknown_${Date.now()}_7`;
      const unknownPay = `pay_webhook_unknown_${Date.now()}_7`;
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: unknownPay,
              order_id: unknownOrder,
              amount: 1912000,
              currency: 'INR',
              notes: {
                booking_id: booking.id
              }
            }
          }
        }
      };
      const rawPayload = JSON.stringify(payload);
      const webhookSig = crypto.createHmac('sha256', gatewaySecret).update(rawPayload).digest('hex');

      const req = {
        rawBody: Buffer.from(rawPayload),
        headers: {
          'x-razorpay-signature': webhookSig
        },
        body: payload
      };
      const res = createMockRes();

      await handlePaymentWebhook(req, res);
      assert.strictEqual(res.statusCode, 400, 'Webhook for unknown order must be rejected with 400');

      const checkTxn = await Transaction.findOne({ where: { order_id: unknownOrder } });
      assert.strictEqual(checkTxn, null, 'Webhook must NEVER create transaction for unknown order');
    });

  } finally {
    // Clean up test records safely
    try {
      if (bookingHigh) await Booking.destroy({ where: { id: bookingHigh.id } });
      if (bookingLow) await Booking.destroy({ where: { id: bookingLow.id } });
      if (tripHigh) await Trip.destroy({ where: { id: tripHigh.id } });
      if (tripLow) await Trip.destroy({ where: { id: tripLow.id } });
      if (user1) {
        await Transaction.destroy({ where: { user_id: user1.id } });
        await User.destroy({ where: { id: user1.id } });
      }
      if (user2) {
        await Transaction.destroy({ where: { user_id: user2.id } });
        await User.destroy({ where: { id: user2.id } });
      }
    } catch (cleanErr) {
      // ignore teardown errors
    }
  }

  console.log(`\n================================================================`);
  console.log(`Payment Order-Binding Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPaymentOrderBindingRegressionTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test runner fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runPaymentOrderBindingRegressionTests };
