'use strict';
const assert = require('assert');
const { createBooking, cancelBooking } = require('../controllers/profileController');
const { User, Trip, Booking, Station, TrainFare, sequelize } = require('../models');

async function runBookingCreationRegressionTests() {
  console.log('================================================================');
  console.log('🎫 Phase 2: Booking Creation Regression & Input Validation Suite');
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

  // Ensure test stations NDLS, CSTM exist with coordinates in DB
  let testUser;
  try {
    testUser = await User.findOne({ where: { email: 'booking_test_user@example.com' } });
    if (!testUser) {
      testUser = await User.create({
        name: 'Booking Test User',
        email: 'booking_test_user@example.com',
        password: 'TestPassword123!@#',
        role: 'user',
        account_status: 'active'
      });
    }

    // Ensure NDLS station
    await Station.findOrCreate({
      where: { station_code: 'NDLS' },
      defaults: {
        station_name: 'New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        latitude: 28.6415,
        longitude: 77.2185
      }
    });

    // Ensure CSTM station
    await Station.findOrCreate({
      where: { station_code: 'CSTM' },
      defaults: {
        station_name: 'Mumbai CSMT',
        city: 'Mumbai',
        state: 'Maharashtra',
        latitude: 18.9400,
        longitude: 72.8353
      }
    });

    // Ensure 12952 and 12951 fares
    await TrainFare.findOrCreate({
      where: { train_number: '12952', class_code: 'SL' },
      defaults: { fare: 700, distance: 1534 }
    });
    await TrainFare.findOrCreate({
      where: { train_number: '12952', class_code: '3A' },
      defaults: { fare: 2085, distance: 1534 }
    });
    await TrainFare.findOrCreate({
      where: { train_number: '12951', class_code: '3A' },
      defaults: { fare: 2085, distance: 1534 }
    });

  } catch (setupErr) {
    console.error('Test setup error:', setupErr);
  }

  try {
    // 1. Valid booking with a matching forward route
    await test('1. A valid booking on forward corridor creates booking and trip atomically with authoritative fare', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email, name: testUser.name },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A',
          passengers: [{ name: 'Traveler 1', age: 30 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.booking, 'Booking object must be returned');
      assert.ok(res.data.booking.ticket_fare > 0, `Expected fare > 0, got ${res.data.booking.ticket_fare}`);
      assert.strictEqual(res.data.booking.payment_status, 'Unpaid', 'New booking must be Unpaid');
      assert.strictEqual(res.data.booking.booking_status, 'Pending', 'New booking must be Pending');

      // Verify trip was created in DB
      const trip = await Trip.findByPk(res.data.booking.trip_id);
      assert.ok(trip, 'Trip record must exist in DB');
      assert.strictEqual(Number(trip.predicted_price), res.data.booking.ticket_fare);
    });

    // 2. Train 12952 in SL with valid route (correct class pricing)
    await test('2. Train 12952 in SL with forward route (correct class pricing)', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: 'SL',
          passengers: [{ name: 'P1', age: 25 }, { name: 'P2', age: 28 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.booking.travel_class, 'SL');
      assert.ok(res.data.booking.ticket_fare > 0);
    });

    // 3. Train 12952 in 3A with matching route
    await test('3. Train 12952 in 3A with matching route', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A',
          total_passengers: 1,
          passengers: [{ name: 'Solo Traveler', age: 35 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.booking.travel_class, '3A');
      assert.ok(res.data.booking.ticket_fare > 0);
    });

    // 4. A train with no matching fare record (dynamic distance fare)
    await test('4. Train with no matching fare record falls back to validated rail distance calculation', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '99999', // Unknown train, but valid stations with coordinates
          travel_class: '3A',
          passengers: [{ name: 'Solo Traveler' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.booking.ticket_fare > 0, 'Must calculate dynamic fare > 0');
    });

    // 5. Unsupported travel class such as ZZ (rejected with 400)
    await test('5. Unsupported travel class such as ZZ is rejected with 400 (no silent fallback)', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12951',
          travel_class: 'ZZ',
          passengers: [{ name: 'Traveler' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400, 'Must return 400 Bad Request for unsupported class ZZ');
      assert.ok(res.data.message.includes('Unsupported travel class: ZZ'));
    });

    // 6. Unknown origin station
    await test('6. Unknown origin station is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'XXXX_UNKNOWN',
          destination_station_code: 'CSTM',
          train_number: '12951',
          travel_class: '3A'
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Unknown origin station'));
    });

    // 7. Unknown destination station
    await test('7. Unknown destination station is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'YYYY_UNKNOWN',
          train_number: '12951',
          travel_class: '3A'
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Unknown destination station'));
    });

    // 8. Manipulated destination that previously triggered 650 km default
    await test('8. Manipulated destination is rejected with 400 instead of defaulting to 650 km', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'MANIPULATED_DEST',
          train_number: '12951',
          travel_class: '3A'
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Unknown destination station'));
    });

    // 9. Identical origin and destination
    await test('9. Identical origin and destination stations are rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'NDLS',
          train_number: '12951',
          travel_class: '3A'
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('Origin and destination stations cannot be identical'));
    });

    // 10. Missing or malformed route information
    await test('10. Missing route information is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: '',
          destination_station_code: '',
          train_number: '12951',
          travel_class: '3A'
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
    });

    // 11. Fare calculation failure without partial booking creation
    await test('11. Fare calculation failure does NOT create partial Trip or Booking', async () => {
      const initialBookingsCount = await Booking.count({ where: { user_id: testUser.id } });
      const initialTripsCount = await Trip.count({ where: { user_id: testUser.id } });

      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'NON_EXISTENT_STN',
          train_number: '12951',
          travel_class: '3A'
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      const afterBookingsCount = await Booking.count({ where: { user_id: testUser.id } });
      const afterTripsCount = await Trip.count({ where: { user_id: testUser.id } });

      assert.strictEqual(afterBookingsCount, initialBookingsCount, 'No Booking must be created on validation failure');
      assert.strictEqual(afterTripsCount, initialTripsCount, 'No Trip must be created on validation failure');
    });

    // 12. Database failure during booking creation and correct rollback
    await test('12. Database failure during booking creation performs clean atomic rollback', async () => {
      const initialBookingsCount = await Booking.count({ where: { user_id: testUser.id } });
      const initialTripsCount = await Trip.count({ where: { user_id: testUser.id } });

      const origBookingCreate = Booking.create;
      Booking.create = async () => {
        throw new Error('Simulated database deadlock or write failure');
      };

      try {
        const req = {
          user: { id: testUser.id, email: testUser.email },
          body: {
            source_station_code: 'NDLS',
            destination_station_code: 'CSTM',
            train_number: '12952',
            travel_class: '3A',
            passengers: [{ name: 'Test Error P', age: 30 }]
          }
        };
        const res = createMockRes();
        await createBooking(req, res);

        assert.strictEqual(res.statusCode, 500, 'Must return 500 on unexpected DB error');
        assert.strictEqual(res.data.message, 'Error processing booking. Please try again later.');

        const afterBookingsCount = await Booking.count({ where: { user_id: testUser.id } });
        const afterTripsCount = await Trip.count({ where: { user_id: testUser.id } });

        assert.strictEqual(afterBookingsCount, initialBookingsCount, 'Booking must be rolled back');
        assert.strictEqual(afterTripsCount, initialTripsCount, 'Trip must be rolled back');
      } finally {
        Booking.create = origBookingCreate;
      }
    });

    // 13. Station name inputs (e.g. 'NEW DELHI') resolve automatically to station codes
    await test('13. Station name inputs (e.g. NEW DELHI) resolve automatically to valid station codes', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NEW DELHI',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A',
          passengers: [{ name: 'Traveler One', age: 30 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201, 'Must accept resolved station name and create booking');
      assert.strictEqual(res.data.booking.source_station_code, 'NDLS', 'Origin must be resolved to NDLS');
    });

    // 14. Connecting train with slash-delimited train numbers is rejected with 400 (Search-Only Option B)
    await test('14. Connecting train with slash-delimited train numbers is rejected with 400 (Search-Only)', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NEW DELHI',
          destination_station_code: 'BSB',
          train_number: '22436 / 12876',
          travel_class: 'COMBINED',
          passengers: [{ name: 'Traveler One', age: 30 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400, 'Must reject multi-leg connecting train booking');
      assert.ok(res.data.message.includes('Multi-leg connecting itineraries cannot be booked as a single ticket'));
    });

    // 15. Truly unknown station is rejected with 400
    await test('15. Truly unknown station is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'UNKNOWN_NONEXISTENT_STN',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A'
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400, 'Must reject unknown station');
      assert.ok(res.data.message.includes('Unknown origin station'));
    });

    // 16. Reverse-direction corridor on Train 12926 (BCT -> NDLS) is rejected with 400
    await test('16. Reverse-direction journey on Train 12926 (BCT -> NDLS) is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'BCT',
          destination_station_code: 'NDLS',
          train_number: '12926',
          travel_class: '3A',
          passengers: [{ name: 'Passenger Test', age: 28 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400, 'Must reject reverse direction');
      assert.ok(res.data.message.includes('reverse direction') || res.data.message.includes('Origin must precede destination'));
    });

    // 17. Solo infant (age < 5) without accompanying adult (18+) is rejected with 400
    await test('17. Solo infant (age < 5) without accompanying adult is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A',
          passengers: [{ name: 'Baby Solo', age: 3 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400, 'Must reject solo infant');
      assert.ok(res.data.message.includes('Infants (under 5 years) must be accompanied by at least one adult'));
    });

    // 18. Invalid passenger age (0 or > 120 or non-integer) is rejected with 400
    await test('18. Invalid passenger age (e.g. 0 or 130) is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A',
          passengers: [{ name: 'Traveler Invalid', age: 0 }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400, 'Must reject invalid passenger age');
      assert.ok(res.data.message.includes('Passenger age must be a valid age between 1 and 120'));
    });

    // 19. Journey-dependent fares: ASR -> LDH vs NDLS -> BCT on Train 12926 must NOT be identical
    await test('19. Different journeys on Train 12926 (ASR->LDH vs NDLS->BDTS) must NOT receive identical fares', async () => {
      await Booking.destroy({ where: { user_id: testUser.id } });

      const req1 = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'ASR',
          destination_station_code: 'LDH',
          train_number: '12926',
          travel_class: 'SL',
          passengers: [{ name: 'Passenger Short', age: 30 }]
        }
      };
      const res1 = createMockRes();
      await createBooking(req1, res1);

      const req2 = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'BDTS',
          train_number: '12926',
          travel_class: 'SL',
          passengers: [{ name: 'Passenger Long', age: 30 }]
        }
      };
      const res2 = createMockRes();
      await createBooking(req2, res2);

      assert.strictEqual(res1.statusCode, 201, `Expected 201, got ${res1.statusCode}: ${JSON.stringify(res1.data)}`);
      assert.strictEqual(res2.statusCode, 201, `Expected 201, got ${res2.statusCode}: ${JSON.stringify(res2.data)}`);
      assert.notStrictEqual(res1.data.booking.ticket_fare, res2.data.booking.ticket_fare, 'Fares for short vs long journeys must be distinct');
      assert.ok(res2.data.booking.ticket_fare > res1.data.booking.ticket_fare, 'Longer journey must cost more');
    });

    // 20. Idempotency Key returns cached response on replay
    await test('20. Idempotency Key returns cached response on replay without duplicating booking', async () => {
      const testKey = `test_idem_${Date.now()}`;
      const payload = {
        source_station_code: 'NDLS',
        destination_station_code: 'CSTM',
        train_number: '12952',
        travel_class: '3A',
        passengers: [{ name: 'Idem Traveler', age: 32 }]
      };
      const headers = { 'idempotency-key': testKey };

      const resA = createMockRes();
      await createBooking({ user: { id: testUser.id, email: testUser.email }, body: payload, headers }, resA);

      const resB = createMockRes();
      await createBooking({ user: { id: testUser.id, email: testUser.email }, body: payload, headers }, resB);

      assert.strictEqual(resA.statusCode, 201, `Expected 201, got ${resA.statusCode}: ${JSON.stringify(resA.data)}`);
      assert.strictEqual(resB.statusCode, 201, `Expected 201, got ${resB.statusCode}: ${JSON.stringify(resB.data)}`);
      assert.strictEqual(resA.data.booking.booking_reference, resB.data.booking.booking_reference, 'Replayed request must return identical booking reference');
    });

    // 21. Per-user pending booking limit (5 max) enforces rate limit with 429
    await test('21. Per-user pending booking limit (5) blocks 6th pending booking with 429', async () => {
      await Booking.destroy({ where: { user_id: testUser.id } });

      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        await createBooking({
          user: { id: testUser.id, email: testUser.email },
          body: {
            source_station_code: 'NDLS',
            destination_station_code: 'CSTM',
            train_number: '12952',
            travel_class: '3A',
            passengers: [{ name: `Traveler ${i + 1}`, age: 25 + i }]
          }
        }, res);
        assert.strictEqual(res.statusCode, 201, `Booking ${i + 1} must succeed`);
      }

      // 6th booking attempt must be blocked with 429
      const resBlocked = createMockRes();
      await createBooking({
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A',
          passengers: [{ name: 'Traveler Over Limit', age: 40 }]
        }
      }, resBlocked);

      assert.strictEqual(resBlocked.statusCode, 429, '6th pending booking must return 429 Too Many Requests');
      assert.ok(resBlocked.data.message.includes('Pending booking limit reached'));
    });

    // ─── Test 22: Missing source station code is rejected (Zero Hallucination / No NDLS Fallback) ───
    await test('22. Missing source_station_code is strictly rejected with 400 without falling back to NDLS', async () => {
      const res = createMockRes();
      await createBooking({
        user: { id: testUser.id, email: testUser.email },
        body: {
          destination_station_code: 'CSTM',
          train_number: '12952',
          travel_class: '3A',
          passengers: [{ name: 'Test Traveler', age: 30 }]
        }
      }, res);

      assert.strictEqual(res.statusCode, 400, 'Must return 400 when source_station_code is missing');
      assert.ok(res.data.message.includes('source_station_code') || res.data.message.includes('Origin station code'), 'Must cite missing origin station');
    });

    // ─── Test 23: Missing destination station code is rejected (Zero Hallucination / No CSTM Fallback) ───
    await test('23. Missing destination_station_code is strictly rejected with 400 without falling back to CSTM', async () => {
      const res = createMockRes();
      await createBooking({
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          train_number: '12952',
          travel_class: '3A',
          passengers: [{ name: 'Test Traveler', age: 30 }]
        }
      }, res);

      assert.strictEqual(res.statusCode, 400, 'Must return 400 when destination_station_code is missing');
      assert.ok(res.data.message.includes('destination_station_code') || res.data.message.includes('Destination station code'), 'Must cite missing destination station');
    });

    // ─── Test 24: Missing train number is rejected (Zero Hallucination / No 12951 Fallback) ───
    await test('24. Missing train_number is strictly rejected with 400 without falling back to 12951', async () => {
      const res = createMockRes();
      await createBooking({
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          travel_class: '3A',
          passengers: [{ name: 'Test Traveler', age: 30 }]
        }
      }, res);

      assert.strictEqual(res.statusCode, 400, 'Must return 400 when train_number is missing');
      assert.ok(res.data.message.includes('train_number') || res.data.message.includes('Train number'), 'Must cite missing train number');
    });

    // ─── Test 25: Missing travel class is rejected (Zero Hallucination / No 3A Fallback) ───
    await test('25. Missing travel_class is strictly rejected with 400 without falling back to 3A', async () => {
      const res = createMockRes();
      await createBooking({
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12952',
          passengers: [{ name: 'Test Traveler', age: 30 }]
        }
      }, res);

      assert.strictEqual(res.statusCode, 400, 'Must return 400 when travel_class is missing');
      assert.ok(res.data.message.includes('travel_class') || res.data.message.includes('Travel class'), 'Must cite missing travel class');
    });

  } finally {
    // Clean up test user's data
    if (testUser) {
      await Booking.destroy({ where: { user_id: testUser.id } });
      await Trip.destroy({ where: { user_id: testUser.id } });
      await User.destroy({ where: { id: testUser.id } });
    }
  }

  console.log('\n================================================================');
  console.log(`Booking Creation Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBookingCreationRegressionTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
