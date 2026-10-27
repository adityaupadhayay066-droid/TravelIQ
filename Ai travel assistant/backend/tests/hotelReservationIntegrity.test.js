'use strict';
const assert = require('assert');
const hotelService = require('../services/hotelService');

async function runHotelIntegrityTests() {
  console.log('================================================================');
  console.log('🏨 Priority 9: Hotel Reservation Data Integrity & Persistence');
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

  // Ensure hotel dataset is loaded for authoritative checks
  hotelService.loadHotelData();

  const futureCheckIn = new Date();
  futureCheckIn.setDate(futureCheckIn.getDate() + 10);
  const checkInDate = futureCheckIn.toISOString().split('T')[0];

  const futureCheckOut = new Date();
  futureCheckOut.setDate(futureCheckOut.getDate() + 13);
  const checkOutDate = futureCheckOut.toISOString().split('T')[0];

  // ─── Test 1: Invalid dates rejection ───
  await test('Rejects check-in date in the past', async () => {
    assert.throws(() => {
      hotelService.createReservation(1, {
        hotelName: 'Taj Bengal',
        city: 'Kolkata',
        checkInDate: '2020-01-01',
        checkOutDate: '2020-01-05'
      });
    }, /cannot be in the past/);
  });

  await test('Rejects check-out before or equal to check-in date', async () => {
    assert.throws(() => {
      hotelService.createReservation(1, {
        hotelName: 'Taj Bengal',
        city: 'Kolkata',
        checkInDate: checkOutDate,
        checkOutDate: checkInDate
      });
    }, /Check-out date must be after check-in date/);
  });

  await test('Rejects stay duration exceeding 30 nights', async () => {
    const tooFar = new Date();
    tooFar.setDate(tooFar.getDate() + 50);
    assert.throws(() => {
      hotelService.createReservation(1, {
        hotelName: 'Taj Bengal',
        city: 'Kolkata',
        checkInDate: checkInDate,
        checkOutDate: tooFar.toISOString().split('T')[0]
      });
    }, /Stay duration must be between 1 and 30 nights/);
  });

  // ─── Test 2: Server-authoritative pricing (ignores manipulated prices) ───
  await test('Server authoritatively computes pricing, completely ignoring client-supplied amounts', async () => {
    const res = hotelService.createReservation(1, {
      hotelName: 'Taj Bengal',
      city: 'Kolkata',
      roomType: 'Deluxe City View Room',
      unitsCount: 1,
      guestsCount: 2,
      checkInDate,
      checkOutDate,
      guestName: 'Alice Traveler',
      guestEmail: 'alice@example.com',
      guestPhone: '9876543210',
      price: 1, // Malicious attempt to pay ₹1
      grandTotal: 1,
      ratePerNight: 1
    });

    assert.ok(res.pricing.grandTotal > 1000, `Grand total must be calculated authoritatively (got ${res.pricing.grandTotal})`);
    assert.strictEqual(res.unitsCount, 1);
    assert.strictEqual(res.nights, 3);
  });

  // ─── Test 3: Never trust client-supplied govIdVerified ───
  await test('Never trusts client-supplied govIdVerified: true', async () => {
    const res = hotelService.createReservation(1, {
      hotelName: 'Taj Bengal',
      city: 'Kolkata',
      checkInDate,
      checkOutDate,
      guestName: 'Bob Verifier',
      guestEmail: 'bob@example.com',
      guestPhone: '9876543211',
      govIdNumber: '123456789012',
      govIdVerified: true // Attacker claims they are pre-verified
    });

    assert.strictEqual(res.govIdVerified, false, 'govIdVerified must always remain false upon client creation');
    assert.strictEqual(res.govIdStatus, 'PENDING_KYC');
  });

  // ─── Test 4: Administrator KYC verification & non-admin rejection ───
  await test('Only administrators can verify government ID; ordinary users are rejected with 403', async () => {
    const res = hotelService.createReservation(1, {
      hotelName: 'Taj Bengal',
      city: 'Kolkata',
      checkInDate,
      checkOutDate,
      guestName: 'Charlie KYC',
      guestEmail: 'charlie@example.com',
      guestPhone: '9876543212',
      govIdNumber: '999988887777'
    });

    // Regular user attempt
    await assert.rejects(async () => {
      await hotelService.verifyGovernmentId(res.id, { id: 2, role: 'user' }, 'VERIFIED');
    }, (err) => err.status === 403);

    // Admin attempt succeeds
    const verified = await hotelService.verifyGovernmentId(res.id, { id: 10, role: 'admin', admin_role: 'super_admin' }, 'VERIFIED');
    assert.strictEqual(verified.success, true);
    assert.strictEqual(verified.reservation.govIdVerified, true);
    assert.strictEqual(verified.reservation.govIdStatus, 'VERIFIED');
  });

  // ─── Test 5: Overlapping reservations exceeding capacity ───
  await test('Rejects reservation exceeding available room capacity for overlapping dates', async () => {
    const dIn = new Date();
    dIn.setDate(dIn.getDate() + 20);
    const dOut = new Date();
    dOut.setDate(dOut.getDate() + 22);
    const inDate5 = dIn.toISOString().split('T')[0];
    const outDate5 = dOut.toISOString().split('T')[0];

    // Presidential suite has availableUnits = 1
    const res1 = hotelService.createReservation(1, {
      hotelName: 'Taj Bengal',
      city: 'Kolkata',
      roomType: 'Grand Signature Suite',
      unitsCount: 1,
      checkInDate: inDate5,
      checkOutDate: outDate5,
      guestName: 'VIP 1',
      guestEmail: 'vip1@example.com',
      guestPhone: '9876543213'
    });
    assert.ok(res1.id);

    // Second booking for the same room & overlapping dates must be rejected
    assert.throws(() => {
      hotelService.createReservation(2, {
        hotelName: 'Taj Bengal',
        city: 'Kolkata',
        roomType: 'Grand Signature Suite',
        unitsCount: 1,
        checkInDate: inDate5,
        checkOutDate: outDate5,
        guestName: 'VIP 2',
        guestEmail: 'vip2@example.com',
        guestPhone: '9876543214'
      });
    }, /Requested room is not available for the selected dates/);
  });

  // ─── Test 6: IDOR protection on cancellation ───
  await test('Prevents another user from cancelling a reservation (IDOR protection)', async () => {
    const res = hotelService.createReservation(2, {
      hotelName: 'Taj Bengal',
      city: 'Kolkata',
      roomType: 'Deluxe City View Room',
      checkInDate,
      checkOutDate,
      guestName: 'Owner User',
      guestEmail: 'owner@example.com',
      guestPhone: '9876543215'
    });

    await assert.rejects(async () => {
      await hotelService.cancelReservation(res.id, 3, 'Malicious cancel attempt', false);
    }, (err) => err.status === 403);
  });

  // ─── Test 7: Idempotent cancellation and safe refund transition ───
  await test('Cancellation is idempotent and paid reservations transition to REFUND_PENDING', async () => {
    const res = hotelService.createReservation(2, {
      hotelName: 'Taj Bengal',
      city: 'Kolkata',
      roomType: 'Deluxe City View Room',
      paymentMethod: 'Online Payment (UPI/Cards)',
      checkInDate,
      checkOutDate,
      guestName: 'Refund Test',
      guestEmail: 'refund@example.com',
      guestPhone: '9876543216'
    });

    // Simulate verified payment
    res.paymentStatus = 'PAID';

    // First cancel
    const cancel1 = await hotelService.cancelReservation(res.id, 2, 'Change of plans', false);
    assert.strictEqual(cancel1.success, true);
    assert.strictEqual(cancel1.alreadyCancelled, false);
    assert.strictEqual(res.status, 'REFUND_PENDING', 'Paid reservation must not be fabricated as REFUNDED without gateway confirmation');
    assert.strictEqual(res.paymentStatus, 'REFUND_PENDING');

    // Duplicate cancel call must be idempotent
    const cancel2 = await hotelService.cancelReservation(res.id, 2, 'Change of plans again', false);
    assert.strictEqual(cancel2.success, true);
    assert.strictEqual(cancel2.alreadyCancelled, true, 'Second cancellation must return alreadyCancelled: true');
  });

  // ─── Test 8: Cryptographic identifier format ───
  await test('Generates cryptographic IDs matching TIQ-STAY-[0-9A-F]{12}', async () => {
    const dIn = new Date();
    dIn.setDate(dIn.getDate() + 25);
    const dOut = new Date();
    dOut.setDate(dOut.getDate() + 27);
    const inDate8 = dIn.toISOString().split('T')[0];
    const outDate8 = dOut.toISOString().split('T')[0];

    const res = hotelService.createReservation(1, {
      hotelName: 'Taj Bengal',
      city: 'Kolkata',
      checkInDate: inDate8,
      checkOutDate: outDate8,
      guestName: 'Crypto ID Test',
      guestEmail: 'crypto@example.com',
      guestPhone: '9876543217'
    });

    assert.ok(/^TIQ-STAY-[0-9A-F]{12}$/.test(res.id), `ID ${res.id} must match 12-hex cryptographic pattern`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runHotelIntegrityTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = runHotelIntegrityTests;
