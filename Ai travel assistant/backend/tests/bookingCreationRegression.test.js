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

    // Ensure 12951 fares
    await TrainFare.findOrCreate({
      where: { train_number: '12951', class_code: 'SL' },
      defaults: { fare: 650, distance: 1384 }
    });
    await TrainFare.findOrCreate({
      where: { train_number: '12951', class_code: '3A' },
      defaults: { fare: 1720, distance: 1384 }
    });

  } catch (setupErr) {
    console.error('Test setup error:', setupErr);
  }

  try {
    // 1. Valid booking with a matching fare record
    await test('1. A valid booking with a matching fare record creates booking and trip atomically', async () => {
      const expectedFareRow = await TrainFare.findOne({ where: { train_number: '12951', class_code: '3A' } });
      const expectedFare = expectedFareRow ? expectedFareRow.fare : 2156;

      const req = {
        user: { id: testUser.id, email: testUser.email, name: testUser.name },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12951',
          travel_class: '3A',
          passengers: [{ name: 'Traveler 1' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.booking, 'Booking object must be returned');
      assert.strictEqual(res.data.booking.ticket_fare, expectedFare, `Expected fare ${expectedFare} matching database TrainFare row`);
      assert.strictEqual(res.data.booking.payment_status, 'Unpaid', 'New booking must be Unpaid');
      assert.strictEqual(res.data.booking.booking_status, 'Pending', 'New booking must be Pending');

      // Verify trip was created in DB
      const trip = await Trip.findByPk(res.data.booking.trip_id);
      assert.ok(trip, 'Trip record must exist in DB');
      assert.strictEqual(Number(trip.predicted_price), expectedFare);
    });

    // 2. Train 12951 in SL with valid fare record
    await test('2. Train 12951 in SL with a valid fare record (correct class pricing)', async () => {
      const expectedFareRow = await TrainFare.findOne({ where: { train_number: '12951', class_code: 'SL' } });
      const expectedFarePerPax = expectedFareRow ? expectedFareRow.fare : 980;

      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12951',
          travel_class: 'SL',
          passengers: [{ name: 'P1' }, { name: 'P2' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.booking.travel_class, 'SL');
      assert.strictEqual(res.data.booking.ticket_fare, expectedFarePerPax * 2, `Expected ${expectedFarePerPax * 2} for 2 SL passengers`);
    });

    // 3. Train 12951 in 3A with matching fare record
    await test('3. Train 12951 in 3A with matching fare record', async () => {
      const expectedFareRow = await TrainFare.findOne({ where: { train_number: '12951', class_code: '3A' } });
      const expectedFare = expectedFareRow ? expectedFareRow.fare : 2156;

      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CSTM',
          train_number: '12951',
          travel_class: '3A',
          total_passengers: 1
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.booking.travel_class, '3A');
      assert.strictEqual(res.data.booking.ticket_fare, expectedFare);
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
            train_number: '12951',
            travel_class: '3A'
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
