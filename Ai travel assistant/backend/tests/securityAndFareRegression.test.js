'use strict';
const assert = require('assert');
const { getTripCarbonEmission } = require('../controllers/carbonController');
const { calculateRailwayFare, estimateRailDistance, calculateRouteFareMatrix, CLASS_CONFIG } = require('../utils/railwayFareCalculator');
const { Trip, CarbonEmission } = require('../models');

async function runSecurityAndFareRegressionTests() {
  console.log('================================================================');
  console.log('🛡️  TravelIQ Carbon IDOR, Route RBAC & RailwayFareCalculator Suite');
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

  // ─── 1. Carbon Controller IDOR Protection ───
  console.log('--- Test Suite 1: Carbon Controller IDOR & User Ownership Enforcement ---');

  const originalFindByPk = Trip.findByPk;
  const originalFindOne = CarbonEmission.findOne;
  const originalCreate = CarbonEmission.create;

  Trip.findByPk = async (id) => {
    if (id === 'trip-user1') {
      return {
        id: 'trip-user1',
        user_id: 101,
        source: 'NDLS',
        destination: 'CNB',
        travel_mode: 'Train'
      };
    }
    return null;
  };

  CarbonEmission.findOne = async () => null;
  CarbonEmission.create = async (data) => ({ ...data, id: 99 });

  try {
    await test('getTripCarbonEmission rejects another user with 403 Forbidden (IDOR Protection)', async () => {
      const req = {
        params: { tripId: 'trip-user1' },
        user: { id: 202, role: 'user' } // User 202 trying to view User 101's trip
      };
      const res = createMockRes();

      await getTripCarbonEmission(req, res);

      assert.strictEqual(res.statusCode, 403, 'Must return 403 Forbidden for unauthorized user');
      assert.ok(res.data.message.includes('Forbidden'), 'Error message must state Forbidden');
    });

    await test('getTripCarbonEmission permits the authentic trip owner (User 101)', async () => {
      const req = {
        params: { tripId: 'trip-user1' },
        user: { id: 101, role: 'user' } // Authentic owner
      };
      const res = createMockRes();

      await getTripCarbonEmission(req, res);

      assert.strictEqual(res.statusCode, null, 'Must not return error code');
      assert.strictEqual(res.data.trip_id, 'trip-user1', 'Must return trip carbon emissions for owner');
      assert.strictEqual(res.data.chosen_mode, 'Train');
    });

    await test('getTripCarbonEmission permits administrators to inspect any trip', async () => {
      const req = {
        params: { tripId: 'trip-user1' },
        user: { id: 999, role: 'admin', admin_role: 'super_admin' } // Administrator
      };
      const res = createMockRes();

      await getTripCarbonEmission(req, res);

      assert.strictEqual(res.statusCode, null, 'Administrator must have access');
      assert.strictEqual(res.data.trip_id, 'trip-user1');
    });

    await test('getTripCarbonEmission returns 404 for non-existent trip', async () => {
      const req = {
        params: { tripId: 'trip-nonexistent' },
        user: { id: 101, role: 'user' }
      };
      const res = createMockRes();

      await getTripCarbonEmission(req, res);

      assert.strictEqual(res.statusCode, 404);
      assert.ok(res.data.message.includes('Trip not found'));
    });
  } finally {
    Trip.findByPk = originalFindByPk;
    CarbonEmission.findOne = originalFindOne;
    CarbonEmission.create = originalCreate;
  }

  // ─── 2. RailwayFareCalculator IRCTC Telescopic Rules ───
  console.log('\n--- Test Suite 2: IRCTC Telescopic Railway Fare Calculations ---');

  await test('Sleeper (SL) fare applies telescopic slabs, reservation fee & zero GST', async () => {
    // 600 km distance
    const fare = calculateRailwayFare({ distanceKm: 600, travelClass: 'SL', isSuperfast: true, passengers: 1 });
    assert.strictEqual(fare.classCode, 'SL');
    assert.strictEqual(fare.isAC, false);
    assert.strictEqual(fare.gst, 0, 'Non-AC class must have 0 GST');
    assert.strictEqual(fare.reservationFee, 20);
    assert.strictEqual(fare.superfastFee, 30);
    assert.ok(fare.grandTotal > 300 && fare.grandTotal < 500, `Expected SL fare between ₹300-500 for 600km, got ₹${fare.grandTotal}`);
    assert.strictEqual(fare.grandTotal % 5, 0, 'Grand total must be rounded to nearest multiple of ₹5');
  });

  await test('AC 3 Tier (3A) applies 5% GST and standard superfast charges', async () => {
    const fare = calculateRailwayFare({ distanceKm: 1400, travelClass: '3A', isSuperfast: true, passengers: 2 });
    assert.strictEqual(fare.classCode, '3A');
    assert.strictEqual(fare.isAC, true);
    assert.ok(fare.gst > 0, 'AC class must incur 5% GST');
    assert.strictEqual(fare.reservationFee, 40);
    assert.strictEqual(fare.superfastFee, 45);
    assert.strictEqual(fare.passengers, 2);
    assert.strictEqual(fare.grandTotal, fare.farePerPassenger * 2);
    assert.strictEqual(fare.farePerPassenger % 5, 0);
  });

  await test('AC First Class (1A) enforces high-tier telescopic rate and minimum fare', async () => {
    const shortTripFare = calculateRailwayFare({ distanceKm: 50, travelClass: '1A', isSuperfast: true });
    assert.ok(shortTripFare.farePerPassenger >= CLASS_CONFIG['1A'].minFare, 'Must enforce minimum 1A fare threshold');
  });

  await test('calculateRouteFareMatrix generates monotonic class hierarchy (2S < SL < 3A < 2A < 1A)', async () => {
    const matrix = calculateRouteFareMatrix(850);
    assert.ok(matrix['2S'] < matrix['SL'], '2S must be cheaper than SL');
    assert.ok(matrix['SL'] < matrix['CC'], 'SL must be cheaper than CC');
    assert.ok(matrix['CC'] < matrix['3A'], 'CC must be cheaper than 3A');
    assert.ok(matrix['3A'] < matrix['2A'], '3A must be cheaper than 2A');
    assert.ok(matrix['2A'] < matrix['1A'], '2A must be cheaper than 1A');
  });

  await test('estimateRailDistance applies 1.25 track curvature factor correctly', async () => {
    // Delhi (28.64, 77.21) to Kanpur (26.45, 80.35) ~ 390 km crow flies, ~ 440 km rail
    const railDist = estimateRailDistance(28.64, 77.21, 26.45, 80.35);
    assert.ok(railDist >= 400 && railDist <= 550, `Rail distance should be around 450-500 km, got ${railDist}`);
  });

  console.log('\n================================================================');
  console.log(`Security & Fare Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAndFareRegressionTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
