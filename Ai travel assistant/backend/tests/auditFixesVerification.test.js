'use strict';

require('dotenv').config();
const assert = require('assert');
const crypto = require('crypto');
const {
  sequelize, User, Trip, Train, TrainSchedule, TrainFare, Station, Booking, Transaction, ProcessedWebhookEvent
} = require('../models');
const { seedAdmin } = require('../seeders/adminSeeder');
const { registerUser, adminLogin } = require('../controllers/authController');
const { createBooking } = require('../controllers/profileController');
const { handlePaymentWebhook, processRefund, computeCancellationRefund } = require('../controllers/paymentController');
const { calculateJourneyRailwayFare } = require('../utils/railwayFareCalculator');
const { generateBookingReference } = require('../services/bookingLifecycleService');

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    cookies: {},
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.data = payload; return this; },
    cookie(name, val) { this.cookies[name] = val; return this; },
    clearCookie() { return this; }
  };
  return res;
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🛡️ Audit Fixes Verification Suite (8 Fixes)');
  console.log('================================================================\n');

  await sequelize.authenticate();
  await sequelize.sync();
  try {
    await sequelize.query('ALTER TABLE train_schedules ADD COLUMN distance_from_source INT NULL');
  } catch (_) {}

  const createdUserIds = [];
  const createdBookingIds = [];
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}\n     -> ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Admin seeder: no promote-existing, no hardcoded Gmail, >=10 char min, public register stays user
    await test('1. Admin seeder refuses to promote existing user & public register never creates admin', async () => {
      const testSeedEmail = `seed_attack_${Date.now()}@example.com`;
      const prevEmail = process.env.ADMIN_SEED_EMAIL;
      const prevPass = process.env.ADMIN_SEED_PASSWORD;
      process.env.ADMIN_SEED_EMAIL = testSeedEmail;
      process.env.ADMIN_SEED_PASSWORD = 'ValidLongPassword123!';

      try {
        const regRes = createMockRes();
        await registerUser({
          body: { name: 'Attacker User', email: testSeedEmail, password: 'Password123!' },
          headers: {},
          ip: '127.0.0.1'
        }, regRes);
        assert.strictEqual(regRes.statusCode, 201);
        assert.strictEqual(regRes.data.role, 'user', 'Public register must NEVER create admin');
        assert.strictEqual(regRes.data.admin_role, null);
        createdUserIds.push(regRes.data.id);

        // Run seedAdmin — must NOT promote existing user
        await seedAdmin();
        const reloaded = await User.findByPk(regRes.data.id);
        assert.strictEqual(reloaded.role, 'user', 'seedAdmin must NOT promote existing user');
        assert.strictEqual(reloaded.admin_role, null);

        // Admin login must reject
        const loginRes = createMockRes();
        await adminLogin({ body: { email: testSeedEmail, password: 'Password123!' }, headers: {}, ip: '127.0.0.1' }, loginRes);
        assert.strictEqual(loginRes.statusCode, 403);
      } finally {
        if (prevEmail === undefined) delete process.env.ADMIN_SEED_EMAIL;
        else process.env.ADMIN_SEED_EMAIL = prevEmail;
        if (prevPass === undefined) delete process.env.ADMIN_SEED_PASSWORD;
        else process.env.ADMIN_SEED_PASSWORD = prevPass;
      }
    });

    await test('1b. Admin seeder rejects < 10 char password and unverified admin cannot login', async () => {
      const shortSeedEmail = `short_seed_${Date.now()}@example.com`;
      const prevEmail = process.env.ADMIN_SEED_EMAIL;
      const prevPass = process.env.ADMIN_SEED_PASSWORD;
      process.env.ADMIN_SEED_EMAIL = shortSeedEmail;
      process.env.ADMIN_SEED_PASSWORD = 'short6';

      try {
        await seedAdmin();
        const u = await User.findOne({ where: { email: shortSeedEmail } });
        assert.strictEqual(u, null, 'seedAdmin must reject < 10 char password');

        // Unverified admin user cannot login
        const unverifiedAdmin = await User.create({
          name: 'Unverified Admin',
          email: shortSeedEmail,
          password: 'ValidLongPassword123!',
          role: 'admin',
          admin_role: 'admin',
          account_status: 'active',
          email_verified: false
        });
        createdUserIds.push(unverifiedAdmin.id);

        const loginRes = createMockRes();
        await adminLogin({ body: { email: shortSeedEmail, password: 'ValidLongPassword123!' }, headers: {}, ip: '127.0.0.1' }, loginRes);
        assert.strictEqual(loginRes.statusCode, 403);
        assert.ok(loginRes.data.message.toLowerCase().includes('verification'));
      } finally {
        if (prevEmail === undefined) delete process.env.ADMIN_SEED_EMAIL;
        else process.env.ADMIN_SEED_EMAIL = prevEmail;
        if (prevPass === undefined) delete process.env.ADMIN_SEED_PASSWORD;
        else process.env.ADMIN_SEED_PASSWORD = prevPass;
      }
    });

    // Create a test user for booking tests
    const testUser = await User.create({
      name: 'Audit Test User',
      email: `audit_user_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'user',
      account_status: 'active',
      email_verified: true
    });
    createdUserIds.push(testUser.id);

    // 2. Reject bookings after train departure time in IST
    await test('2. Rejects booking for today when train has already departed in IST', async () => {
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowIst = new Date(Date.now() + IST_OFFSET_MS);
      const todayIst = nowIst.toISOString().slice(0, 10);
      // Use a departure time 1 hour ago in IST (or 00:01:00 if after 00:02 IST)
      const pastIst = new Date(Date.now() + IST_OFFSET_MS - 3600000);
      const pastTimeStr = pastIst.toISOString().slice(11, 19);
      const depTime = pastIst.toISOString().slice(0, 10) === todayIst ? pastTimeStr : '00:01:00';

      const trainNo = '98001';
      await Train.upsert({ train_number: trainNo, train_name: 'Past Departure Test Exp', runs_on: ['Daily'] });
      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await TrainSchedule.bulkCreate([
        { train_number: trainNo, station_code: 'NDLS', arrival_time: null, departure_time: depTime, day_count: 1, stop_sequence: 1, distance_from_source: 0 },
        { train_number: trainNo, station_code: 'CNB', arrival_time: '23:55:00', departure_time: null, day_count: 1, stop_sequence: 2, distance_from_source: 440 }
      ]);

      const req = {
        user: { id: testUser.id, email: testUser.email, name: testUser.name },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: trainNo,
          travel_class: '3A',
          journey_date: todayIst,
          passengers: [{ name: 'Test Traveler', age: 28, gender: 'Male' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400, `Expected 400, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.ok(res.data.message.includes('already departed'));

      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await Train.destroy({ where: { train_number: trainNo } });
    });

    // 3. Reject class missing from train_fares
    await test('3. Rejects travel class not offered by train in train_fares', async () => {
      const trainNo = '98002';
      await Train.upsert({ train_number: trainNo, train_name: 'No CC Test Exp', runs_on: ['Daily'] });
      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await TrainSchedule.bulkCreate([
        { train_number: trainNo, station_code: 'NDLS', arrival_time: null, departure_time: '22:00:00', day_count: 1, stop_sequence: 1, distance_from_source: 0 },
        { train_number: trainNo, station_code: 'CNB', arrival_time: '04:00:00', departure_time: null, day_count: 2, stop_sequence: 2, distance_from_source: 440 }
      ]);
      await TrainFare.destroy({ where: { train_number: trainNo } });
      await TrainFare.bulkCreate([
        { train_number: trainNo, class_code: '3A', fare: 800 },
        { train_number: trainNo, class_code: 'SL', fare: 300 }
      ]);

      const futureDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      const req = {
        user: { id: testUser.id, email: testUser.email, name: testUser.name },
        body: {
          source_station_code: 'NDLS',
          destination_station_code: 'CNB',
          train_number: trainNo,
          travel_class: 'CC',
          journey_date: futureDate,
          passengers: [{ name: 'Test Traveler', age: 28, gender: 'Male' }]
        }
      };
      const res = createMockRes();
      await createBooking(req, res);
      assert.strictEqual(res.statusCode, 400, `Expected 400, got ${res.statusCode}`);
      assert.ok(res.data.message.includes("not offered"));

      await TrainFare.destroy({ where: { train_number: trainNo } });
      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await Train.destroy({ where: { train_number: trainNo } });
    });

    // 4. Reject missing or null age
    await test('4. Rejects missing or null passenger age with 400', async () => {
      const futureDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      for (const badAge of [null, undefined, '']) {
        const req = {
          user: { id: testUser.id, email: testUser.email, name: testUser.name },
          body: {
            source_station_code: 'NDLS',
            destination_station_code: 'CNB',
            train_number: '12952',
            travel_class: '3A',
            journey_date: futureDate,
            passengers: [{ name: 'Test Traveler', age: badAge, gender: 'Male' }]
          }
        };
        const res = createMockRes();
        await createBooking(req, res);
        assert.strictEqual(res.statusCode, 400, `Expected 400 for age=${String(badAge)}, got ${res.statusCode}`);
      }
    });

    // 5. Station coordinates & schedule distance calculation
    await test('5. Station dataset has accurate coordinates (JAT, CBE) and schedule distance overrides coordinates', async () => {
      const stations = require('../data/unique_stations.json');
      const jat = stations.find(s => s.station_code === 'JAT');
      const cbe = stations.find(s => s.station_code === 'CBE');
      assert.ok(jat && jat.latitude > 32 && jat.longitude < 76, `JAT coords wrong: ${JSON.stringify(jat)}`);
      assert.ok(cbe && cbe.latitude < 12 && cbe.longitude > 76, `CBE coords wrong: ${JSON.stringify(cbe)}`);

      const trainNo = '98003';
      await Train.upsert({ train_number: trainNo, train_name: 'Schedule Distance Exp', runs_on: ['Daily'] });
      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await TrainSchedule.bulkCreate([
        { train_number: trainNo, station_code: 'NDLS', arrival_time: null, departure_time: '10:00:00', day_count: 1, stop_sequence: 1, distance_from_source: 0 },
        { train_number: trainNo, station_code: 'CNB', arrival_time: '16:00:00', departure_time: null, day_count: 1, stop_sequence: 2, distance_from_source: 440 }
      ]);

      const fareRes = await calculateJourneyRailwayFare({
        trainNumber: trainNo,
        sourceStationCode: 'NDLS',
        destStationCode: 'CNB',
        travelClass: '3A',
        passengers: 1
      });
      assert.strictEqual(fareRes.distanceKm, 440);
      assert.strictEqual(fareRes.distanceSource, 'schedule');

      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await Train.destroy({ where: { train_number: trainNo } });
    });

    // 6. Expired booking webhook reconciliation returns 200 and records transaction + event + refund pending
    await test('6. Expired booking payment webhook reconciles (records txn, webhook event, Refund Pending, returns 200)', async () => {
      const futureDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
      const expTrip = await Trip.create({
        user_id: testUser.id,
        source: 'NDLS',
        destination: 'CNB',
        departure_date: futureDate,
        travel_mode: 'Train',
        predicted_price: 1200,
        predicted_time: 6
      });
      const expBooking = await Booking.create({
        trip_id: expTrip.id,
        user_id: testUser.id,
        booking_reference: generateBookingReference(),
        source_station_code: 'NDLS',
        destination_station_code: 'CNB',
        train_number: '12952',
        travel_class: '3A',
        ticket_fare: 1200,
        journey_date: futureDate,
        transport_type: 'Train',
        booking_status: 'Expired',
        payment_status: 'Unpaid',
        expires_at: new Date(Date.now() - 60000)
      });
      createdBookingIds.push(expBooking.id);

      const eventId = `evt_exp_${Date.now()}`;
      const payId = `pay_exp_${Date.now()}`;
      const webhookPayload = {
        event: 'payment.captured',
        event_id: eventId,
        booking_id: expBooking.id,
        payment_id: payId,
        amount: 1200,
        currency: 'INR'
      };
      const rawBody = Buffer.from(JSON.stringify(webhookPayload));
      if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        process.env.RAZORPAY_WEBHOOK_SECRET = 'traveliq_test_webhook_secret_2026';
      }
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const sig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const res = createMockRes();
      await handlePaymentWebhook({
        headers: { 'x-razorpay-signature': sig },
        body: webhookPayload,
        rawBody
      }, res);

      assert.strictEqual(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      assert.strictEqual(res.data.refund_initiated, true);
      assert.strictEqual(res.data.payment_status, 'Refund Pending');

      const reloaded = await Booking.findByPk(expBooking.id);
      assert.strictEqual(reloaded.payment_status, 'Refund Pending');

      const txn = await Transaction.findOne({ where: { booking_id: expBooking.id, payment_id: payId } });
      assert.ok(txn, 'Transaction record must be created for expired booking reconciliation');
      assert.strictEqual(txn.status, 'Refund Pending');

      const evt = await ProcessedWebhookEvent.findOne({ where: { event_id: eventId } });
      assert.ok(evt, 'ProcessedWebhookEvent must be recorded');
    });

    // 7. Cancellation charge policy
    await test('7. Cancellation-charge policy deducts fee on same-day cancellation instead of 100% refund', async () => {
      const todayDate = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
      // Departure 6 hours from now -> 4h to 12h tier (50% cancellation charge)
      const dep6h = new Date(Date.now() + 5.5 * 3600000 + 6 * 3600000);
      const depDateStr = dep6h.toISOString().slice(0, 10);
      const depTimeStr = dep6h.toISOString().slice(11, 19);

      const trainNo = '98004';
      await Train.upsert({ train_number: trainNo, train_name: 'Refund Policy Exp', runs_on: ['Daily'] });
      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await TrainSchedule.bulkCreate([
        { train_number: trainNo, station_code: 'NDLS', arrival_time: null, departure_time: depTimeStr, day_count: 1, stop_sequence: 1, distance_from_source: 0 },
        { train_number: trainNo, station_code: 'CNB', arrival_time: '23:59:00', departure_time: null, day_count: 1, stop_sequence: 2, distance_from_source: 440 }
      ]);

      const calc = await computeCancellationRefund({
        booking_status: 'Confirmed',
        travel_class: '3A',
        total_passengers: 1,
        journey_date: depDateStr,
        train_number: trainNo,
        source_station_code: 'NDLS'
      }, 5100);

      assert.strictEqual(calc.policyTier, '4H_TO_12H_50_PCT');
      assert.strictEqual(calc.cancellationCharge, 2550);
      assert.strictEqual(calc.refundAmount, 2550);

      await TrainSchedule.destroy({ where: { train_number: trainNo } });
      await Train.destroy({ where: { train_number: trainNo } });
    });

    // 8. Atomic pending booking cap under concurrency
    await test('8. Atomic pending booking cap prevents exceeding 5 under 12 concurrent requests', async () => {
      const capUser = await User.create({
        name: 'Cap Race User',
        email: `cap_race_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'user',
        account_status: 'active',
        email_verified: true
      });
      createdUserIds.push(capUser.id);

      const futureDate = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
      const requests = Array.from({ length: 12 }, (_, idx) => {
        const res = createMockRes();
        return createBooking({
          user: { id: capUser.id, email: capUser.email, name: capUser.name },
          body: {
            source_station_code: 'NDLS',
            destination_station_code: 'BCT',
            train_number: '12952',
            travel_class: '3A',
            journey_date: futureDate,
            passengers: [{ name: `Traveler ${idx + 1}`, age: 25 + idx, gender: 'Male' }]
          }
        }, res).then(() => res);
      });

      const results = await Promise.all(requests);
      const createdCount = results.filter(r => r.statusCode === 201).length;
      const rejectedCount = results.filter(r => r.statusCode === 429).length;
      const dbPendingCount = await Booking.count({ where: { user_id: capUser.id, booking_status: 'Pending' } });

      assert.strictEqual(dbPendingCount, 5, `Expected 5 pending bookings in DB, got ${dbPendingCount}`);
      assert.strictEqual(createdCount, 5, `Expected 5 201 responses, got ${createdCount}`);
      assert.strictEqual(rejectedCount, 7, `Expected 7 429 responses, got ${rejectedCount}`);
    });
  } finally {
    // Cleanup test data
    if (createdBookingIds.length) {
      await Transaction.destroy({ where: { booking_id: createdBookingIds } });
      await Booking.destroy({ where: { id: createdBookingIds } });
    }
    if (createdUserIds.length) {
      await Transaction.destroy({ where: { user_id: createdUserIds } });
      await Booking.destroy({ where: { user_id: createdUserIds } });
      await User.destroy({ where: { id: createdUserIds } });
    }
    await sequelize.close();
  }

  console.log(`\n================================================================`);
  console.log(`Audit Fixes Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
