'use strict';
const assert = require('assert');
const crypto = require('crypto');
const { createTransaction, handlePaymentWebhook, processRefund, PAYMENT_STATUSES } = require('../controllers/paymentController');
const { createReservation } = require('../services/hotelService');
const { Booking, Transaction, PaymentLog } = require('../models');

async function runPaymentVerificationTests() {
  console.log('================================================================');
  console.log('💳 Priority 2: Payment Status Verification & Gateway Security');
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

  const webhookSecret = 'test_webhook_gateway_secret_key_32chars!';
  process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET = webhookSecret;
  process.env.PAYMENT_GATEWAY_SECRET = webhookSecret;

  // Mock DB storage
  const mockBookings = {
    10: { id: 10, user_id: 1, ticket_fare: 1500, payment_status: 'Pending', booking_status: 'Pending', save: async () => {} },
    11: { id: 11, user_id: 2, ticket_fare: 2200, payment_status: 'Pending', booking_status: 'Pending', save: async () => {} }
  };
  const mockTransactions = [];
  const mockPaymentLogs = [];

  const origBookingFindByPk = Booking.findByPk;
  const origTxnFindOne = Transaction.findOne;
  const origTxnCreate = Transaction.create;
  const origLogCreate = PaymentLog.create;

  Booking.findByPk = async (id) => mockBookings[id] || null;
  Transaction.findOne = async ({ where }) => {
    return mockTransactions.find(t => {
      if (where.booking_id && t.booking_id === where.booking_id) {
        if (where.status && t.status !== where.status) return false;
        return true;
      }
      if (where.transaction_id && t.transaction_id === where.transaction_id) return true;
      return false;
    }) || null;
  };
  Transaction.create = async (data) => {
    const txn = { ...data, id: mockTransactions.length + 1, save: async () => {} };
    mockTransactions.push(txn);
    return txn;
  };
  PaymentLog.create = async (data) => {
    mockPaymentLogs.push(data);
    return data;
  };

  function createMockRes() {
    return {
      statusCode: 200,
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

  try {
    // ─── Test 1: Forged Successful Payment ───
    await test('Forged successful payment: Client cannot fabricate Success without gateway signature', async () => {
      const req = {
        user: { id: 1, role: 'user' },
        body: {
          booking_id: 10,
          status: 'Success', // Client forged status
          payment_method: 'Card'
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.transaction.status, PAYMENT_STATUSES.PENDING, 'Status must remain Pending');
      assert.notStrictEqual(res.data.transaction.status, PAYMENT_STATUSES.SUCCESS, 'Must NOT be marked Success');
      assert.strictEqual(mockBookings[10].payment_status, 'Pending', 'Booking must NOT be marked Paid');
    });

    // ─── Test 2: Client-Supplied Status Manipulation ───
    await test('Client-supplied status manipulation: Arbitrary status strings are ignored', async () => {
      const req = {
        user: { id: 1, role: 'user' },
        body: {
          booking_id: 10,
          status: 'AUTHORIZED_BYPASS_CONFIRMED'
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.transaction.status, PAYMENT_STATUSES.PENDING, 'Manipulated status must default to Pending');
    });

    // ─── Test 3: Incorrect Transaction Amount ───
    await test('Incorrect transaction amount: Rejected if amount does not match authoritative fare', async () => {
      const req = {
        user: { id: 1, role: 'user' },
        body: {
          booking_id: 10,
          amount: 1.00 // Tampered amount (authoritative is 1500)
        }
      };
      const res = createMockRes();
      await createTransaction(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Payment amount mismatch'));
    });

    // ─── Test 4: Invalid Payment Signature ───
    await test('Invalid payment signature: Webhook rejects invalid HMAC signature', async () => {
      const payload = {
        event: 'payment.captured',
        booking_id: 10,
        amount: 1500,
        currency: 'INR'
      };
      const req = {
        headers: { 'x-payment-signature': 'forged_fake_signature_hex_12345' },
        body: payload
      };
      const res = createMockRes();
      await handlePaymentWebhook(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Invalid payment signature'));
    });

    // ─── Test 5: Valid Webhook & Duplicate Payment Webhook (Anti-Replay) ───
    await test('Webhook verification & duplicate payment webhook rejected as duplicate', async () => {
      const payload = {
        event: 'payment.captured',
        booking_id: 10,
        transaction_id: 'TXN-WEBHOOK-101',
        amount: 1500,
        currency: 'INR'
      };
      const rawPayload = JSON.stringify(payload);
      const validSig = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');

      const req1 = {
        headers: { 'x-payment-signature': validSig },
        body: payload
      };
      const res1 = createMockRes();
      await handlePaymentWebhook(req1, res1);

      assert.strictEqual(res1.statusCode, 200);
      assert.strictEqual(mockBookings[10].payment_status, 'Paid');
      assert.strictEqual(mockBookings[10].booking_status, 'Confirmed');

      // Replay same webhook (duplicate)
      const res2 = createMockRes();
      await handlePaymentWebhook(req1, res2);

      assert.strictEqual(res2.statusCode, 200);
      assert.ok(res2.data.message.includes('Duplicate payment webhook'), 'Must detect duplicate replay');
    });

    // ─── Test 6: Unauthorized Booking ID ───
    await test('Unauthorized booking ID: Attacker cannot checkout or refund another user booking', async () => {
      const reqCheckout = {
        user: { id: 99, role: 'user' }, // User 99 does not own booking 10 (owned by user 1)
        body: { booking_id: 10 }
      };
      const resCheckout = createMockRes();
      await createTransaction(reqCheckout, resCheckout);
      assert.strictEqual(resCheckout.statusCode, 403);

      const reqRefund = {
        user: { id: 99, role: 'user' },
        body: { booking_id: 10, reason: 'Unauthorized refund attempt' }
      };
      const resRefund = createMockRes();
      await processRefund(reqRefund, resRefund);
      assert.strictEqual(resRefund.statusCode, 403);
    });

    // ─── Test 7: Hotel Booking with No Verified Payment ───
    await test('Hotel booking with no verified payment remains PENDING (never marked PAID)', () => {
      const reservation = createReservation(1, {
        hotelName: 'Taj Bengal',
        city: 'Kolkata',
        checkInDate: '2026-11-10',
        checkOutDate: '2026-11-12',
        guestName: 'Jane Doe',
        guestEmail: 'jane@example.com',
        guestPhone: '+91 9876543210',
        paymentMethod: 'Credit Card', // Online payment selected
        govIdVerified: true // Client asserts they are verified
      });

      assert.strictEqual(reservation.paymentStatus, 'PENDING', 'Online hotel booking paymentStatus must be PENDING without payment proof');
      assert.notStrictEqual(reservation.paymentStatus, 'PAID', 'Must never mark PAID based solely on payment method');
      assert.strictEqual(reservation.govIdVerified, false, 'Client-supplied govIdVerified must be rejected');
      assert.strictEqual(reservation.govIdStatus, 'PENDING_KYC');
    });

    // ─── Test 8: Refund Requested for Unpaid / Pending Payment ───
    await test('Refund requested for a payment that never succeeded is rejected', async () => {
      // Booking 11 has never been successfully paid
      const req = {
        user: { id: 2, role: 'user' }, // Owner of booking 11
        body: {
          booking_id: 11,
          reason: 'I want my money back for an unpaid booking'
        }
      };
      const res = createMockRes();
      await processRefund(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('No successful payment exists'), 'Must reject refund for unverified/unpaid booking');
    });

  } finally {
    Booking.findByPk = origBookingFindByPk;
    Transaction.findOne = origTxnFindOne;
    Transaction.create = origTxnCreate;
    PaymentLog.create = origLogCreate;
  }

  console.log(`\n================================================================`);
  console.log(`Payment Verification Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPaymentVerificationTests().catch(err => {
  console.error('Fatal test error in payment verification suite:', err);
  process.exit(1);
});
