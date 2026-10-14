const assert = require('assert');
const { searchRoutes } = require('../controllers/travelController');
const { getTrainTrackingDetails } = require('../services/trainTrackingService');
const { sequelize } = require('../models');

async function runE2EVerification() {
  console.log('🧪 Starting TravelIQ End-to-End Search & Anti-Hallucination Verification...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database for E2E verification\n');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }

  // Helper to mock req/res for searchRoutes
  const callSearch = async (body) => {
    return new Promise((resolve, reject) => {
      const req = {
        body,
        headers: {},
        ip: '127.0.0.1'
      };
      const res = {
        statusCode: 200,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          resolve({ status: this.statusCode, data });
        }
      };
      searchRoutes(req, res).catch(reject);
    });
  };

  // Test Case 1: Known direct corridor (New Delhi to Kanpur Central)
  console.log('--- Test Case 1: Direct Corridor (NDLS -> CNB) ---');
  const res1 = await callSearch({
    source: 'NDLS',
    destination: 'CNB',
    departureDate: '2026-10-20'
  });
  assert.strictEqual(res1.status, 200);
  assert.ok(res1.data.trains && res1.data.trains.length > 0, 'Should find authentic trains on NDLS-CNB corridor');
  
  for (const t of res1.data.trains) {
    assert.ok(!['XXXXX', 'TR1', 'TR2', 'DUMMY'].includes(t.number), `Train number ${t.number} must not be dummy`);
    assert.ok(t.name && t.name.length > 3, 'Train must have a valid name');
    // Fare must be authentic number or null (NOT the old fabricated 480 fallback)
    if (t.price !== null) {
      assert.ok(typeof t.price === 'number' && t.price > 0, `Price must be positive, got ${t.price}`);
    }
    assert.ok(t.source, 'Must have source provenance');
    assert.ok(t.verification_status, 'Must have verification_status');
  }
  console.log(`  ✅ PASS: NDLS -> CNB returned ${res1.data.trains.length} authentic trains with genuine provenance and no dummy identifiers.`);

  // Test Case 2: Non-Airport Destination (Delhi to Ballia)
  console.log('\n--- Test Case 2: Non-Airport Endpoint (Delhi -> Ballia) ---');
  const res2 = await callSearch({
    source: 'Delhi',
    destination: 'Ballia',
    departureDate: '2026-10-20'
  });
  assert.strictEqual(res2.status, 200);
  // Ballia has NO commercial airport, so direct flights MUST BE ZERO
  const directFlights = res2.data.flights.filter(f => f.direct === true);
  assert.strictEqual(directFlights.length, 0, 'Delhi to Ballia must NOT return fabricated direct flights');
  
  // Any multimodal flight option returned must explicitly disclose ground transfer and nearby airport (PAT)
  for (const f of res2.data.flights) {
    assert.strictEqual(f.direct, false, 'Flight to Ballia must not be marked direct');
    assert.strictEqual(f.route_type, 'Multimodal', 'Route type must be Multimodal');
    assert.ok(f.name.includes('to Patna (PAT)') || (f.note && f.note.includes('Patna')), 'Must route via nearby airport PAT');
  }
  console.log('  ✅ PASS: Delhi -> Ballia returned 0 direct flights; multimodal option requires ground transfer via Patna (PAT).');

  // Test Case 3: Unserved Direct Corridor (Tatanagar to Ballia)
  console.log('\n--- Test Case 3: Unserved Route (TATA -> BUI) ---');
  const res3 = await callSearch({
    source: 'TATA',
    destination: 'BUI',
    departureDate: '2026-10-20'
  });
  assert.strictEqual(res3.status, 200);
  // Must have 0 direct trains
  const directTrains = res3.data.trains.filter(t => t.direct === true);
  assert.strictEqual(directTrains.length, 0, 'TATA -> BUI has no direct trains, must not fabricate any');
  
  // Any connecting routes must NOT use TR1/TR2 dummy labels
  for (const t of res3.data.trains) {
    assert.ok(!String(t.number).includes('TR1'), 'Must not contain TR1 in connecting routes');
    assert.ok(!String(t.number).includes('TR2'), 'Must not contain TR2 in connecting routes');
    assert.ok(!String(t.name).includes('Leg 1 Express'), 'Must not contain Leg 1 Express in connecting routes');
  }
  console.log('  ✅ PASS: TATA -> BUI returned 0 direct trains and all connecting routes use verified train IDs.');

  // Test Case 4: Train Tracking Platform Generation Anti-Hallucination
  console.log('\n--- Test Case 4: Train Tracking Platform & Telemetry Authenticity ---');
  const tracking = await getTrainTrackingDetails('12004');
  assert.ok(tracking && tracking.train_number === '12004', 'Should find train 12004 in database');
  // When live telemetry is absent, platform must be null and disclaimer must be present
  assert.strictEqual(tracking.live_status.is_live_telemetry, false);
  assert.strictEqual(tracking.live_status.telemetry_source, 'scheduled_timetable');
  assert.ok(tracking.live_status.telemetry_disclaimer.includes('timetable'), 'Must disclose scheduled timetable source');
  for (const stn of tracking.timeline) {
    assert.strictEqual(stn.platform, null, 'Must NOT fabricate platform using modulo arithmetic');
  }
  console.log('  ✅ PASS: Train tracking returns null platform without live GPS and explicitly flags timetable reference.');

  console.log('\n======================================================');
  console.log('🎉 ALL END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY');
  console.log('======================================================\n');
  process.exit(0);
}

runE2EVerification().catch(err => {
  console.error('❌ E2E Verification failed:', err);
  process.exit(1);
});
