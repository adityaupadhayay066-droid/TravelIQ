'use strict';
const assert = require('assert');
const crypto = require('crypto');
const { createOrder, createTransaction, getPaymentStatus, handlePaymentWebhook, PAYMENT_STATUSES } = require('../controllers/paymentController');
const { User, Booking, Trip, Transaction, ProcessedWebhookEvent } = require('../models');

async function runCheckoutContractRegressionTests() {
  console.log('================================================================');
  console.log('🛒 Phase 6: Checkout Contract & Authoritative Status Verification');
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

  const gatewaySecret = 'test_checkout_secret_key_32chars!!';
  process.env.PAYMENT_GATEWAY_SECRET = gatewaySecret;
  process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET = gatewaySecret;

  let userA, userB;
  let bookingA;

  try {
    userA = await User.create({
      name: 'Checkout User A',
      email: `checkout_a_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    userB = await User.create({
      name: 'Checkout User B',
      email: `checkout_b_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    const tripA = await Trip.create({
      user_id: userA.id,
      source: 'NDLS',
      destination: 'CSTM',
      travel_mode: 'Train',
      predicted_price: 3200
    });

    bookingA = await Booking.create({
      user_id: userA.id,
      trip_id: tripA.id,
      source_station_code: 'NDLS',
      destination_station_code: 'CSTM',
      train_number: '12951',
      travel_class: '2A',
      ticket_fare: 3200,
      payment_status: 'Unpaid',
      booking_status: 'Pending'
    });

  } catch (err) {
    console.error('Setup error:', err);
  }

  try {
    // 1. Client-submitted status: "Success" without cryptographic signature is downgraded to Pending
    await test('1. Client-submitted status "Success" without signature returns Pending, booking remains Unpaid', async () => {
      const req = {
        user: userA,
        body: {
          booking_id: bookingA.id,
          status: 'Success', // Client claimed success
          amount: 3200,
          payment_method: 'UPI'
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.transaction.status, PAYMENT_STATUSES.PENDING, 'Backend must downgrade unverified success to Pending');

      await bookingA.reload();
      assert.strictEqual(bookingA.payment_status, 'Unpaid', 'Booking MUST remain Unpaid');
      assert.strictEqual(bookingA.booking_status, 'Pending', 'Booking MUST remain Pending');
    });

    // 2. Authoritative status endpoint reflects true database state
    await test('2. Status endpoint /api/payment/status/:bookingId accurately returns Unpaid and Pending transaction', async () => {
      const req = {
        user: userA,
        params: { bookingId: bookingA.id }
      };
      const res = createMockRes();
      await getPaymentStatus(req, res);

      assert.strictEqual(res.data.booking_id, bookingA.id);
      assert.strictEqual(res.data.payment_status, 'Unpaid');
      assert.strictEqual(res.data.booking_status, 'Pending');
      assert.strictEqual(res.data.transaction.status, 'Pending');
    });

    // 3. Status endpoint enforces IDOR ownership: User B cannot inspect User A's transaction
    await test('3. Status endpoint returns 403 Forbidden when User B queries User A booking', async () => {
      const req = {
        user: userB, // Unauthorized user
        params: { bookingId: bookingA.id }
      };
      const res = createMockRes();
      await getPaymentStatus(req, res);

      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.data.message.includes('Forbidden'));
    });

    // 4. Confirmed booking ONLY occurs after server-verified cryptographic payment confirmation
    let orderId, paymentId, validSig;
    await test('4. Confirmed booking ONLY occurs after server cryptographic verification', async () => {
      const orderRes = createMockRes();
      await createOrder({ user: userA, body: { booking_id: bookingA.id } }, orderRes);
      orderId = orderRes.data.order_id;
      paymentId = `pay_checkout_${Date.now()}`;
      validSig = crypto.createHmac('sha256', gatewaySecret).update(`${orderId}|${paymentId}`).digest('hex');

      const txnRes = createMockRes();
      await createTransaction({
        user: userA,
        body: {
          booking_id: bookingA.id,
          gateway_order_id: orderId,
          gateway_payment_id: paymentId,
          gateway_signature: validSig,
          amount: 3200
        }
      }, txnRes);

      assert.strictEqual(txnRes.statusCode, 201);
      assert.strictEqual(txnRes.data.transaction.status, PAYMENT_STATUSES.SUCCESS);

      await bookingA.reload();
      assert.strictEqual(bookingA.payment_status, 'Paid');
      assert.strictEqual(bookingA.booking_status, 'Confirmed');

      // Check status endpoint now reports Paid and Confirmed
      const statusRes = createMockRes();
      await getPaymentStatus({ user: userA, params: { bookingId: bookingA.id } }, statusRes);
      assert.strictEqual(statusRes.data.payment_status, 'Paid');
      assert.strictEqual(statusRes.data.booking_status, 'Confirmed');
    });

    // 5. Asynchronous webhook arrival (Delayed Webhook Simulation)
    await test('5. Delayed webhook arrival smoothly updates status from Pending to Confirmed', async () => {
      // Create new booking B
      const tripB = await Trip.create({ user_id: userA.id, source: 'NDLS', destination: 'CNB', travel_mode: 'Train', predicted_price: 1500 });
      const bookingDelayed = await Booking.create({
        user_id: userA.id,
        trip_id: tripB.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: 1500,
        payment_status: 'Unpaid',
        booking_status: 'Pending'
      });

      // User creates order
      const orderRes = createMockRes();
      await createOrder({ user: userA, body: { booking_id: bookingDelayed.id } }, orderRes);
      const delayedOrderId = orderRes.data.order_id;

      // Status check while pending webhook
      const pollRes1 = createMockRes();
      await getPaymentStatus({ user: userA, params: { bookingId: bookingDelayed.id } }, pollRes1);
      assert.strictEqual(pollRes1.data.payment_status, 'Unpaid');
      assert.strictEqual(pollRes1.data.transaction.status, 'Pending');

      // Webhook arrives asynchronously
      const delayedPayId = `pay_delayed_${Date.now()}`;
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        event_id: `evt_delayed_${Date.now()}`,
        booking_id: bookingDelayed.id,
        order_id: delayedOrderId,
        payment_id: delayedPayId,
        amount: 1500,
        currency: 'INR'
      });

      const signature = crypto.createHmac('sha256', gatewaySecret).update(Buffer.from(webhookPayload)).digest('hex');
      const whRes = createMockRes();
      await handlePaymentWebhook({
        headers: { 'x-payment-signature': signature },
        rawBody: Buffer.from(webhookPayload),
        body: JSON.parse(webhookPayload)
      }, whRes);

      assert.strictEqual(whRes.statusCode, 200);

      // Status check after webhook processed
      const pollRes2 = createMockRes();
      await getPaymentStatus({ user: userA, params: { bookingId: bookingDelayed.id } }, pollRes2);
      assert.strictEqual(pollRes2.data.payment_status, 'Paid');
      assert.strictEqual(pollRes2.data.booking_status, 'Confirmed');
    });

  } finally {
    if (userA) {
      await Booking.destroy({ where: { user_id: userA.id } });
      await Trip.destroy({ where: { user_id: userA.id } });
      await Transaction.destroy({ where: { user_id: userA.id } });
      await User.destroy({ where: { id: userA.id } });
    }
    if (userB) {
      await User.destroy({ where: { id: userB.id } });
    }
  }

  console.log('\n================================================================');
  console.log(`Checkout Contract Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCheckoutContractRegressionTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
