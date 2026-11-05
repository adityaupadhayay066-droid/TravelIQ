'use strict';
const assert = require('assert');
const crypto = require('crypto');
const { Writable } = require('stream');
const { createBooking, cancelBooking } = require('../controllers/profileController');
const { 
  createOrder, 
  createTransaction, 
  handlePaymentWebhook, 
  processRefund, 
  getReceiptPDF,
  PAYMENT_STATUSES 
} = require('../controllers/paymentController');
const { updateBooking, createBooking: adminCreateBooking } = require('../controllers/adminController');
const { 
  BOOKING_STATUSES, 
  generateBookingReference, 
  transitionBookingState, 
  expirePendingBookings 
} = require('../services/bookingLifecycleService');
const { processBookingConfirmationSideEffects } = require('../services/bookingConfirmationService');
const { 
  User, 
  Booking, 
  Trip, 
  Transaction, 
  ProcessedWebhookEvent, 
  IdempotencyKey, 
  BookingEvent, 
  AdminLog, 
  Station,
  TrainFare,
  sequelize 
} = require('../models');

async function runBookingLifecycleIntegrityMatrixTests() {
  console.log('================================================================');
  console.log('🧪 Comprehensive Booking Lifecycle & Ticketing Integrity Matrix');
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
      if (err.stack) {
        console.error(`     Stack: ${err.stack.split('\n').slice(1, 3).join('\n')}`);
      }
      failed++;
    }
  }

  function createMockRes() {
    const chunks = [];
    const res = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      }
    });
    res.statusCode = 200;
    res.headers = {};
    res.data = null;
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(obj) {
      this.data = obj;
      return this;
    };
    res.setHeader = function(k, v) {
      this.headers[k.toLowerCase()] = v;
      return this;
    };
    res.getHeader = function(k) {
      return this.headers[k.toLowerCase()];
    };
    res.send = function(body) {
      this.data = body;
      if (typeof body === 'string') {
        chunks.push(Buffer.from(body));
      } else if (Buffer.isBuffer(body)) {
        chunks.push(body);
      }
      this.end();
      return this;
    };
    res.getBuffer = function() {
      return Buffer.concat(chunks);
    };
    return res;
  }

  const webhookSecret = 'test_webhook_gateway_secret_key_32chars!';
  process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET = webhookSecret;
  process.env.PAYMENT_GATEWAY_SECRET = webhookSecret;

  let testUser1, testUser2, adminUser;

  try {
    testUser1 = await User.create({
      name: 'Integrity Tester 1',
      email: `matrix_u1_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    testUser2 = await User.create({
      name: 'Integrity Tester 2',
      email: `matrix_u2_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    adminUser = await User.create({
      name: 'Integrity Admin',
      email: `matrix_admin_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'admin',
      admin_role: 'super_admin',
      account_status: 'active'
    });

    // Ensure stations exist
    await Station.findOrCreate({
      where: { station_code: 'NDLS' },
      defaults: { station_name: 'New Delhi', city: 'Delhi', state: 'Delhi', latitude: 28.6415, longitude: 77.2185 }
    });
    await Station.findOrCreate({
      where: { station_code: 'CNB' },
      defaults: { station_name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', latitude: 26.4539, longitude: 80.3514 }
    });

    // Authoritative fare lookup for 12004 CC
    let authoritativeFare = 3165;

    // Helper for valid future date within 120 days
    const validFutureDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 1: BOOKING CREATION & PASSENGER VALIDATION
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Booking Creation, Validation & Fare Rules ---');

    let validBookingId = null;
    let validBookingRef = null;

    await test('1. Valid train booking creates PENDING booking with secure reference and expiration hold', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: validFutureDate,
          transport_type: 'Train',
          passengers: [
            { name: 'Aditya Sharma', age: 28, gender: 'M', berth_preference: 'Window' }
          ],
          total_passengers: 1
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201, `Expected 201 Created but got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.booking, 'Response must contain booking object');
      assert.strictEqual(res.data.booking.booking_status, 'Pending', 'Booking must be created in Pending status');
      assert.strictEqual(res.data.booking.payment_status, 'Unpaid', 'Booking payment must be Unpaid initially');
      assert.ok(res.data.booking.booking_reference, 'Must have a booking_reference');
      assert.ok(res.data.booking.booking_reference.startsWith('TIQ-'), 'Reference must be prefixed with TIQ-');
      assert.ok(res.data.booking.expires_at, 'Must have an expiration timestamp');

      validBookingId = res.data.booking.id;
      validBookingRef = res.data.booking.booking_reference;
      authoritativeFare = res.data.booking.ticket_fare;

      // Ensure NO premature confirmation events were dispatched
      const events = await BookingEvent.findAll({ where: { booking_id: validBookingId } });
      assert.strictEqual(events.length, 0, 'No confirmation events should exist for newly created pending booking');
    });

    await test('2. Empty journey date string is rejected with 400', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          transport_type: 'Train',
          journey_date: '',
          passengers: [{ name: 'User One', age: 25, gender: 'F' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('journey_date cannot be empty'));
    });

    await test('3. Journey date in the past is rejected with 400', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: '2020-01-01',
          transport_type: 'Train',
          passengers: [{ name: 'User One', age: 25, gender: 'F' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('past'));
    });

    await test('4. Journey date beyond 120-day ARP window is rejected with 400', async () => {
      const farFuture = new Date(Date.now() + 150 * 86400000).toISOString().split('T')[0];
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: farFuture,
          transport_type: 'Train',
          passengers: [{ name: 'User One', age: 25, gender: 'F' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('120 days') || res.data.message.includes('120-day'));
    });

    await test('5. Unsupported transport type (Flight/Bus) returns honest 400 without fake booking', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'DEL',
          destination_station_code: 'BOM',
          train_number: 'AI-805',
          travel_class: 'Economy',
          journey_date: validFutureDate,
          transport_type: 'Flight',
          passengers: [{ name: 'User One', age: 25, gender: 'F' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Direct ticketing is currently supported for Trains only'));
    });

    await test('6. Passenger with empty or whitespace name is rejected with 400', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: validFutureDate,
          transport_type: 'Train',
          passengers: [{ name: '   ', age: 25, gender: 'F' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('valid non-empty name'));
    });

    await test('7. Passenger with negative or invalid age is rejected with 400', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: validFutureDate,
          transport_type: 'Train',
          passengers: [{ name: 'Aditya', age: -5, gender: 'M' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('valid age'));
    });

    await test('8. Zero passenger array is rejected with 400', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: validFutureDate,
          transport_type: 'Train',
          passengers: []
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('at least 1 passenger'));
    });

    await test('9. Discrepancy between passengers array and total_passengers is rejected with 400', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: validFutureDate,
          transport_type: 'Train',
          passengers: [
            { name: 'Aditya', age: 28, gender: 'M' }
          ],
          total_passengers: 5
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Passenger count mismatch'));
    });

    await test('10. Infant under 5 years travels free without being billed full adult fare', async () => {
      // 1 adult + 1 infant (age 3) on Train 12004 CC
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: validFutureDate,
          transport_type: 'Train',
          passengers: [
            { name: 'Parent Passenger', age: 30, gender: 'F' },
            { name: 'Baby Passenger', age: 3, gender: 'M' }
          ]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(Number(res.data.booking.ticket_fare), authoritativeFare, 'Infant <5 should not be billed base fare');
    });

    await test('11. Client-forged ticket_fare is overridden with authoritative server calculation', async () => {
      const req = {
        user: testUser1,
        headers: {},
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          journey_date: validFutureDate,
          transport_type: 'Train',
          ticket_fare: 5, // Client attempts to forge fare to ₹5
          passengers: [
            { name: 'Aditya', age: 28, gender: 'M' }
          ]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(Number(res.data.booking.ticket_fare), authoritativeFare, `Must calculate authoritative fare of ${authoritativeFare}, ignoring forged 5`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 2: PAYMENT VERIFICATION & STATE TRANSITIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Payment Verification & State Transitions ---');

    await test('12. Client submitting status: Success without gateway signature leaves booking in Pending', async () => {
      const req = {
        user: testUser1,
        body: {
          booking_id: validBookingId,
          amount: authoritativeFare,
          payment_method: 'UPI',
          status: 'Success' // Client tries old bypass!
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.ok([200, 201].includes(res.statusCode), `Expected 200/201 but got ${res.statusCode}`);
      assert.strictEqual(res.data.booking_status, 'Pending', 'Booking must stay Pending without cryptographic signature');
      assert.strictEqual(res.data.payment_status, 'Unpaid', 'Booking payment must stay Unpaid');
    });

    let gatewayOrderId = null;
    await test('13. Server creates authoritative payment order bound to booking record', async () => {
      const req = {
        user: testUser1,
        body: {
          booking_id: validBookingId
        }
      };
      const res = createMockRes();
      await createOrder(req, res);

      assert.ok([200, 201].includes(res.statusCode), `Expected 200/201 but got ${res.statusCode}`);
      assert.ok(res.data.order_id, 'Must return order_id');
      assert.strictEqual(res.data.amount, authoritativeFare, 'Order amount must match authoritative booking fare');
      gatewayOrderId = res.data.order_id;
    });

    await test('14. Payment transaction with invalid HMAC signature is rejected with 400', async () => {
      const req = {
        user: testUser1,
        body: {
          booking_id: validBookingId,
          gateway_order_id: gatewayOrderId,
          gateway_payment_id: 'pay_test_invalid_sig_123',
          gateway_signature: 'forged_fake_invalid_signature_hex_value',
          amount: authoritativeFare,
          payment_method: 'CARD'
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Invalid payment signature'));
    });

    await test('15. Payment transaction with unknown gateway_order_id is rejected with 400', async () => {
      const fakeOrder = 'order_nonexistent_999999999';
      const fakePayment = 'pay_fake_999999999';
      const sig = crypto.createHmac('sha256', webhookSecret).update(`${fakeOrder}|${fakePayment}`).digest('hex');

      const req = {
        user: testUser1,
        body: {
          booking_id: validBookingId,
          gateway_order_id: fakeOrder,
          gateway_payment_id: fakePayment,
          gateway_signature: sig,
          amount: authoritativeFare,
          payment_method: 'UPI'
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Unknown payment order'));
    });

    await test('16. Payment transaction with mismatched amount is rejected with 400', async () => {
      const req = {
        user: testUser1,
        body: {
          booking_id: validBookingId,
          gateway_order_id: gatewayOrderId,
          amount: 500 // Booking is authoritativeFare, client sends 500
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('amount mismatch'));
    });

    await test('17. Legitimate verified transaction transitions booking atomically to Paid & Confirmed', async () => {
      const legitimatePaymentId = `pay_legit_${Date.now()}`;
      const validSig = crypto.createHmac('sha256', webhookSecret).update(`${gatewayOrderId}|${legitimatePaymentId}`).digest('hex');

      const req = {
        user: testUser1,
        body: {
          booking_id: validBookingId,
          gateway_order_id: gatewayOrderId,
          gateway_payment_id: legitimatePaymentId,
          gateway_signature: validSig,
          amount: authoritativeFare,
          payment_method: 'UPI'
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.ok([200, 201].includes(res.statusCode), `Expected 200/201 but got ${res.statusCode}`);
      assert.strictEqual(res.data.booking_status, 'Confirmed');
      assert.strictEqual(res.data.payment_status, 'Paid');

      // Verify in DB directly
      const updated = await Booking.findByPk(validBookingId);
      assert.strictEqual(updated.booking_status, 'Confirmed');
      assert.strictEqual(updated.payment_status, 'Paid');
    });

    await test('18. Idempotent confirmation side effects execute safely and skip duplicate execution', async () => {
      const result1 = await processBookingConfirmationSideEffects(validBookingId);
      assert.strictEqual(result1.alreadyProcessed, false, 'First side-effect run must process');
      assert.strictEqual(result1.emailSent, true);
      assert.strictEqual(result1.webhookSent, true);

      // Second run immediately following should detect existing event and skip
      const result2 = await processBookingConfirmationSideEffects(validBookingId);
      assert.strictEqual(result2.alreadyProcessed, true, 'Second run must skip duplicates');
    });

    await test('19. Replay of already-used gateway_payment_id is strictly rejected', async () => {
      const trip2 = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const b2 = await Booking.create({
        trip_id: trip2.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Pending',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      const order2 = await Transaction.create({
        booking_id: b2.id,
        user_id: testUser1.id,
        transaction_id: `TXN-${Date.now()}`,
        order_id: `order_${Date.now()}`,
        amount: authoritativeFare,
        currency: 'INR',
        payment_method: 'Gateway Pending',
        status: PAYMENT_STATUSES.PENDING
      });

      // Attempt to replay the previous verified transaction's payment ID
      const priorTxn = await Transaction.findOne({ where: { booking_id: validBookingId, status: PAYMENT_STATUSES.SUCCESS } });
      const replayedPaymentId = priorTxn.payment_id;
      const replaySig = crypto.createHmac('sha256', webhookSecret).update(`${order2.order_id}|${replayedPaymentId}`).digest('hex');

      const req = {
        user: testUser1,
        body: {
          booking_id: b2.id,
          gateway_order_id: order2.order_id,
          gateway_payment_id: replayedPaymentId,
          gateway_signature: replaySig,
          amount: authoritativeFare,
          payment_method: 'UPI'
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('already been processed'));
    });

    await test('20. Payment on expired booking is rejected with 400', async () => {
      const tripExp = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const expiredBooking = await Booking.create({
        trip_id: tripExp.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Expired',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      const req = {
        user: testUser1,
        body: {
          booking_id: expiredBooking.id
        }
      };
      const res = createMockRes();
      await createOrder(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('expired booking'));
    });

    await test('21. Cancellation of an unpaid booking sets Unpaid / Cancelled (NEVER Refunded)', async () => {
      const tripCancel = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const unpaidBooking = await Booking.create({
        trip_id: tripCancel.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Pending',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      const req = {
        user: testUser1,
        params: { id: unpaidBooking.id }
      };
      const res = createMockRes();
      await cancelBooking(req, res);

      assert.ok([200, 201].includes(res.statusCode), `Expected 200/201 but got ${res.statusCode}`);
      const reloaded = await Booking.findByPk(unpaidBooking.id);
      assert.strictEqual(reloaded.booking_status, 'Cancelled');
      assert.strictEqual(reloaded.payment_status, 'Unpaid', 'Unpaid booking must never be marked Refunded');
    });

    await test('22. Refund requested on an unpaid or unconfirmed booking is rejected with 400', async () => {
      const tripRefund = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const pendingBooking = await Booking.create({
        trip_id: tripRefund.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Pending',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      const req = {
        user: testUser1,
        body: {
          booking_id: pendingBooking.id
        }
      };
      const res = createMockRes();
      await processRefund(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.toLowerCase().includes('refund'));
    });

    await test('23. Replay of payment webhook on cancelled or refunded booking is rejected', async () => {
      const tripWk = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const cancelledBooking = await Booking.create({
        trip_id: tripWk.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Cancelled',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_replay_after_cancel_${Date.now()}`,
              order_id: `order_replay_after_cancel_${Date.now()}`,
              amount: authoritativeFare * 100,
              currency: 'INR',
              notes: {
                booking_id: cancelledBooking.id,
                user_id: testUser1.id
              }
            }
          }
        }
      };
      const rawPayload = JSON.stringify(payload);
      const sig = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');

      const req = {
        headers: { 'x-razorpay-signature': sig },
        body: payload,
        rawBody: rawPayload
      };
      const res = createMockRes();
      await handlePaymentWebhook(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('cancelled') || res.data.message.includes('refunded'));

      // Ensure DB status did NOT change
      const after = await Booking.findByPk(cancelledBooking.id);
      assert.strictEqual(after.booking_status, 'Cancelled');
      assert.strictEqual(after.payment_status, 'Unpaid');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 3: TICKET GENERATION & AUTHENTIC DATA
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Ticket Generation & Authentic Data ---');

    await test('24. User B cannot access User A ticket (403 Forbidden)', async () => {
      const req = {
        user: testUser2, // User 2 trying to access User 1's booking
        params: { bookingId: validBookingId },
        query: { format: 'html' }
      };
      const res = createMockRes();
      await getReceiptPDF(req, res);

      assert.strictEqual(res.statusCode, 403);
      const msg = typeof res.data === 'string' ? res.data : (res.data?.message || '');
      assert.ok(msg.includes('Access Denied') || msg.includes('authorized') || msg.includes('Forbidden'));
    });

    await test('25. Confirmed booking ticket renders CONFIRMED badge and genuine booking reference', async () => {
      const req = {
        user: testUser1,
        params: { bookingId: validBookingId },
        query: { format: 'html' }
      };
      const res = createMockRes();
      await getReceiptPDF(req, res);

      assert.ok([200, 201].includes(res.statusCode), `Expected 200/201 but got ${res.statusCode}`);
      const html = res.data;
      assert.ok(html.includes('CONFIRMED'), 'HTML must display CONFIRMED');
      assert.ok(html.includes(validBookingRef), 'HTML must display stored booking_reference');
      assert.ok(!html.includes('49204'), 'HTML must NEVER display formula-based 49204');
      assert.ok(!html.includes('1,384 KM'), 'HTML must not have fabricated 1,384 KM distance');
      assert.ok(!html.includes('||||| ||| ||||'), 'HTML must not have static barcode');
      assert.ok(!html.includes('EXP #'), 'HTML must not have invented EXP # train label');
    });

    await test('26. Unpaid booking ticket displays PAYMENT PENDING and does NOT show CNF seat assignment', async () => {
      const tripPend = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const unpaidBooking = await Booking.create({
        trip_id: tripPend.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Pending',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      const req = {
        user: testUser1,
        params: { bookingId: unpaidBooking.id },
        query: { format: 'html' }
      };
      const res = createMockRes();
      await getReceiptPDF(req, res);

      assert.ok([200, 201].includes(res.statusCode), `Expected 200/201 but got ${res.statusCode}`);
      const html = res.data;
      assert.ok(html.includes('PAYMENT PENDING'), 'HTML must state PAYMENT PENDING');
      assert.ok(!html.includes('CONFIRMED (CNF)'), 'HTML must not claim CONFIRMED (CNF)');
    });

    await test('27. Ticket endpoint generates genuine application/pdf binary with %PDF- header', async () => {
      const req = {
        user: testUser1,
        params: { bookingId: validBookingId },
        query: {} // Default format is PDF
      };
      const res = createMockRes();
      await getReceiptPDF(req, res);

      // Await stream finish
      await new Promise(resolve => {
        if (res.writableEnded) return resolve();
        res.on('finish', resolve);
        // Timeout guard in case
        setTimeout(resolve, 800);
      });

      assert.strictEqual(res.headers['content-type'], 'application/pdf');
      assert.ok(res.headers['content-disposition'].includes('.pdf'));

      const buffer = res.getBuffer();
      assert.ok(buffer.length > 500, `PDF buffer length should be substantial, got ${buffer.length}`);
      const headerMagic = buffer.slice(0, 5).toString('ascii');
      assert.strictEqual(headerMagic, '%PDF-', 'Generated binary must start with standard %PDF- magic bytes');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 4: IDEMPOTENCY & CONCURRENCY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Idempotency & State Machine Concurrency ---');

    await test('28. Idempotency-Key with identical payload returns existing booking without duplicate record', async () => {
      await Booking.destroy({ where: { user_id: testUser1.id, booking_status: 'Pending' } });
      const idemKey = `idem_test_${Date.now()}_abc`;
      const payload = {
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        journey_date: validFutureDate,
        transport_type: 'Train',
        passengers: [{ name: 'Idem User', age: 26, gender: 'M' }]
      };

      const req1 = { user: testUser1, headers: { 'idempotency-key': idemKey }, body: payload };
      const res1 = createMockRes();
      await createBooking(req1, res1);
      assert.strictEqual(res1.statusCode, 201);
      const initialId = res1.data.booking.id;

      // Replay identical request with same key
      const req2 = { user: testUser1, headers: { 'idempotency-key': idemKey }, body: payload };
      const res2 = createMockRes();
      await createBooking(req2, res2);
      assert.ok([200, 201].includes(res2.statusCode), `Replay should return success (got ${res2.statusCode})`);
      assert.strictEqual(res2.data.booking.id, initialId, 'Should return the identical booking id');
    });

    await test('29. Same Idempotency-Key with conflicting payload returns 409 Conflict', async () => {
      const idemKey = `idem_test_${Date.now()}_conflict`;
      const payload1 = {
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        journey_date: validFutureDate,
        transport_type: 'Train',
        passengers: [{ name: 'Payload 1', age: 26, gender: 'M' }]
      };

      const req1 = { user: testUser1, headers: { 'idempotency-key': idemKey }, body: payload1 };
      const res1 = createMockRes();
      await createBooking(req1, res1);
      assert.strictEqual(res1.statusCode, 201);

      // Replay with DIFFERENT payload
      const payload2 = {
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        journey_date: validFutureDate,
        transport_type: 'Train',
        passengers: [{ name: 'Payload 2 Differing Name', age: 30, gender: 'F' }]
      };
      const req2 = { user: testUser1, headers: { 'idempotency-key': idemKey }, body: payload2 };
      const res2 = createMockRes();
      await createBooking(req2, res2);

      assert.strictEqual(res2.statusCode, 409, 'Must return 409 Conflict for modified payload with reused key');
      assert.ok(res2.data.message.toLowerCase().includes('conflict'));
    });

    await test('30. State machine rejects illegal transitions and prevents state corruption', async () => {
      const tripSM = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const b = await Booking.create({
        trip_id: tripSM.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Refunded',
        payment_status: 'Refunded',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      // Attempt illegal transition: Refunded -> Confirmed
      await assert.rejects(
        async () => {
          await transitionBookingState(b.id, BOOKING_STATUSES.CONFIRMED, PAYMENT_STATUSES.PAID, { reason: 'Illegal test' });
        },
        /Illegal booking state transition/i
      );
    });

    await test('31. expirePendingBookings safely sweeps expired holds without affecting confirmed bookings', async () => {
      const tripExpHold = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      // Create an expired hold (expires_at 1 hour in the past)
      const pastTime = new Date(Date.now() - 3600000);
      const staleBooking = await Booking.create({
        trip_id: tripExpHold.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Pending',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference(),
        expires_at: pastTime
      });

      const result = await expirePendingBookings();
      assert.ok(result.expiredCount >= 1, 'Should have expired at least 1 booking');

      const reloadedStale = await Booking.findByPk(staleBooking.id);
      assert.strictEqual(reloadedStale.booking_status, 'Expired');

      // Check that valid confirmed booking was untouched
      const confirmedCheck = await Booking.findByPk(validBookingId);
      assert.strictEqual(confirmedCheck.booking_status, 'Confirmed');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION 5: ADMIN OPERATIONS & AUDIT TRAIL
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Admin Booking Controls & Audit Trail ---');

    await test('32. Admin cannot arbitrarily re-confirm a cancelled or refunded booking', async () => {
      const tripAdminC = await Trip.create({
        user_id: testUser1.id,
        source: 'NDLS',
        destination: 'CNB',
        travel_date: new Date(),
        status: 'Planned'
      });

      const cancelledBooking = await Booking.create({
        trip_id: tripAdminC.id,
        user_id: testUser1.id,
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12004',
        travel_class: 'CC',
        ticket_fare: authoritativeFare,
        booking_status: 'Cancelled',
        payment_status: 'Unpaid',
        journey_date: validFutureDate,
        transport_type: 'Train',
        booking_reference: generateBookingReference()
      });

      const req = {
        user: adminUser,
        params: { id: cancelledBooking.id },
        body: {
          booking_status: 'Confirmed' // Admin tries to force Confirmed on Cancelled
        }
      };
      const res = createMockRes();
      await updateBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Illegal booking transition'));
    });

    await test('33. Admin booking creation validates stations, sets Pending, generates unique ref & logs audit', async () => {
      const req = {
        user: adminUser,
        body: {
          user_id: testUser1.id,
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: '12004',
          travel_class: 'CC',
          ticket_fare: authoritativeFare,
          journey_date: validFutureDate,
          transport_type: 'Train',
          passengers: [{ name: 'Admin Assisted Guest', age: 45, gender: 'F' }]
        }
      };
      const res = createMockRes();
      await adminCreateBooking(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.booking.booking_status, 'Pending');
      assert.strictEqual(res.data.booking.payment_status, 'Pending');
      assert.ok(res.data.booking.booking_reference.startsWith('TIQ-'));

      // Check AdminLog audit trail
      const audit = await AdminLog.findOne({
        where: {
          admin_id: adminUser.id,
          action: 'ADMIN_CREATE_BOOKING'
        },
        order: [['id', 'DESC']]
      });
      assert.ok(audit, 'Audit log entry must be recorded for admin booking creation');
    });

  } finally {
    // Cleanup generated test users
    if (testUser1) await testUser1.destroy().catch(() => {});
    if (testUser2) await testUser2.destroy().catch(() => {});
    if (adminUser) await adminUser.destroy().catch(() => {});
  }

  console.log('\n================================================================');
  console.log(`Booking Lifecycle Integrity Matrix: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBookingLifecycleIntegrityMatrixTests().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
