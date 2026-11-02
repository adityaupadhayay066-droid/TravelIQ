'use strict';
const assert = require('assert');
const { createBooking } = require('../controllers/profileController');
const { searchRoutes } = require('../controllers/travelController');
const { sendMessage } = require('../controllers/chatbotController');
const { MultiModalRoutingEngine } = require('../services/multiModalRoutingEngine');
const { User, Trip, Booking, Station, Train, TrainSchedule, TrainFare, sequelize } = require('../models');

async function runIntegrityTests() {
  console.log('================================================================');
  console.log('🚆 Train Discovery & Booking Integrity Regression Suite');
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
      json(payload) {
        this.data = payload;
        if (!this.statusCode) this.statusCode = 200;
        return this;
      }
    };
  }

  // Setup test user
  let testUser = await User.findOne({ where: { email: 'integrity_tester@traveliq.com' } });
  if (!testUser) {
    testUser = await User.create({
      name: 'Integrity Tester',
      email: 'integrity_tester@traveliq.com',
      password: 'HashedPasswordTest123!',
      role: 'User'
    });
  }

  try {
    // 1. Direct verified train booking succeeds with exact database fare
    await test('1. Booking train 12802 for NDLS -> TATA succeeds with exact 3A database fare', async () => {
      const fareRow = await TrainFare.findOne({ where: { train_number: '12802', class_code: '3A' } });
      assert.ok(fareRow, 'Fare record for 12802 3A must exist');

      const req = {
        user: { id: testUser.id, email: testUser.email, name: testUser.name },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'TATA',
          train_number: '12802',
          travel_class: '3A',
          booking_date: '2026-11-02',
          passengers: [{ name: 'Aditya' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 201, `Expected 201, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.booking.ticket_fare, fareRow.fare);
      assert.strictEqual(res.data.booking.train_number, '12802');
      assert.strictEqual(res.data.booking.source_station_code, 'NDLS');
      assert.strictEqual(res.data.booking.destination_station_code, 'TATA');
    });

    // 2. Reject train that does not serve the requested route
    await test('2. Booking train 12301 (Howrah Rajdhani) between NDLS and TATA is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'TATA',
          train_number: '12301',
          travel_class: '3A',
          passengers: [{ name: 'Aditya' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('does not serve'), `Expected error message indicating train does not serve station, got: ${res.data.message}`);
    });

    // 3. Reject completely unknown / fabricated train number
    await test('3. Booking fabricated train #88888 is rejected with 400', async () => {
      const req = {
        user: { id: testUser.id, email: testUser.email },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'TATA',
          train_number: '88888',
          travel_class: '3A',
          passengers: [{ name: 'Aditya' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('not recognized or does not exist'));
    });

    // 4. Search routes NDLS -> TATA returns verified 12802 with authentic fares and zero hallucinated flights
    await test('4. Route search NDLS -> TATA returns verified train #12802 and 0 direct flights', async () => {
      const req = {
        body: {
          source: 'NEW DELHI',
          destination: 'TATANAGAR JN',
          departureDate: '2026-11-02',
          passengers: 1
        },
        ip: '127.0.0.1'
      };
      const res = createMockRes();
      await searchRoutes(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.trains && res.data.trains.length >= 1, 'Must find at least 1 verified train');
      const tataTrain = res.data.trains.find(t => t.number === '12802' || t.train_number === '12802');
      assert.ok(tataTrain, 'Must find train #12802');
      assert.strictEqual(tataTrain.direct, true);
      assert.ok(tataTrain.fares['3A'] > 0);
      assert.strictEqual(res.data.flights.length, 0, 'Must have 0 fabricated direct flights between Delhi and Tatanagar');
    });

    // 5. MultiModalRoutingEngine never proposes flights starting in Delhi for passengers departing Pune
    await test('5. MultiModalRoutingEngine does NOT hallucinate Delhi flights for Pune -> Ballia route', async () => {
      const engine = new MultiModalRoutingEngine({ sequelize });
      const flightFallback = engine.findFlightMultiModalFallback('PUNE', 'BUI', '2026-11-02');
      // Must be null because there is no direct PNQ -> PAT flight
      assert.strictEqual(flightFallback, null, 'Flight fallback must be null when origin airport lacks matching flight');
    });

    // 6. Chatbot handles direct train query deterministically without Gemini hallucination
    await test('6. Chatbot query "Tell me about train 12801" returns verified database timetable details', async () => {
      const req = {
        body: { message: 'Tell me about train 12801' },
        user: { id: testUser.id }
      };
      const res = createMockRes();
      await sendMessage(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.response.includes('Train #12801 — Purushottam Express'));
      assert.ok(res.data.response.includes('Verified Fares'));
      const slFare = (await TrainFare.findOne({ where: { train_number: '12801', class_code: 'SL' } }))?.fare;
      assert.ok(res.data.response.includes(`SL: ₹${slFare}`));
    });

    // 7. Chatbot query for corridor with no direct trains returns clean grounded message
    await test('7. Chatbot query for route without direct trains returns grounded notice without fake trains', async () => {
      const req = {
        body: { message: 'Which train runs from Pune to Ballia?' },
        user: { id: testUser.id }
      };
      const res = createMockRes();
      await sendMessage(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(
        res.data.response.includes('No direct trains are available on this route.') || 
        res.data.response.includes('No verified routes found for this date.')
      );
      assert.ok(!res.data.response.includes('DEL to PAT'), 'Must not hallucinate Delhi to Patna flight for Pune');
    });

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n================================================================');
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrityTests().then(() => process.exit(0)).catch(err => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
