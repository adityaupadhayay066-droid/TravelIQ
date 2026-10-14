const assert = require('assert');
const { 
  validateTransportRecord, 
  deduplicateOptions, 
  VERIFICATION_STATUSES 
} = require('../services/transportValidationEngine');
const { searchFlightsFromProvider } = require('../services/adapters/flightProviderAdapter');
const { searchBusesFromProvider } = require('../services/adapters/busProviderAdapter');
const { searchTrainsFromProvider } = require('../services/adapters/trainProviderAdapter');
const { discoverMultiModalRoutes } = require('../services/multiModalDiscoveryService');
const { validateDirectStopSequence, evaluateConnectionWindow, buildIsoUtcTimestamp } = require('../services/multiModalRoutingEngine');

async function runRegressionTestSuite() {
  console.log('🧪 Starting TravelIQ Anti-Hallucination & Accuracy Regression Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
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

  // --- Suite 1: Transport Validation Engine & Malformed Record Rejection ---
  console.log('--- Test Suite 1: Validation Engine & Hallucination Filter ---');

  test('Rejects fabricated dummy service identifiers (XXXXX, TR1, DUMMY, TEMP)', () => {
    const fakeRecords = ['XXXXX', 'YYYYY', 'TR1', 'TR2', 'DUMMY', 'TEMP'];
    for (const num of fakeRecords) {
      const res = validateTransportRecord({
        mode: 'train',
        provider_id: num,
        service_number: num,
        service_name: 'Fabricated Express',
        origin_code: 'NDLS',
        destination_code: 'CNB',
        departure_time: '08:00',
        arrival_time: '13:00',
        journey_date: '2026-10-20',
        source: 'test_audit'
      });
      assert.strictEqual(res.isValid, false, `Should reject fake number: ${num}`);
      assert.ok(res.errors.some(e => e.includes('dummy service identifier')), `Expected dummy error for ${num}`);
    }
  });

  test('Rejects negative fares and non-INR unverified currencies', () => {
    const negFareRes = validateTransportRecord({
      mode: 'train',
      service_number: '12004',
      service_name: 'Lucknow Shatabdi',
      origin_code: 'NDLS',
      destination_code: 'CNB',
      departure_time: '06:10',
      arrival_time: '11:20',
      fare: -450,
      journey_date: '2026-10-20',
      source: 'test_audit'
    });
    assert.strictEqual(negFareRes.isValid, false);
    assert.ok(negFareRes.errors.some(e => e.includes('non-negative')));

    const negDictRes = validateTransportRecord({
      mode: 'train',
      service_number: '12004',
      service_name: 'Lucknow Shatabdi',
      origin_code: 'NDLS',
      destination_code: 'CNB',
      departure_time: '06:10',
      arrival_time: '11:20',
      fares: { 'SL': -100, '3A': 1200 },
      journey_date: '2026-10-20',
      source: 'test_audit'
    });
    assert.strictEqual(negDictRes.isValid, false);
    assert.ok(negDictRes.errors.some(e => e.includes('positive number')));
  });

  test('Rejects impossible arrival/departure times on same-day journey', () => {
    // Departure at 15:00 and Arrival at 11:00 on day 1 is impossible
    const impossibleRes = validateTransportRecord({
      mode: 'train',
      service_number: '12004',
      service_name: 'Lucknow Shatabdi',
      origin_code: 'NDLS',
      destination_code: 'CNB',
      departure_time: '15:00',
      arrival_time: '11:00',
      source_day: 1,
      dest_day: 1,
      journey_date: '2026-10-20',
      source: 'test_audit'
    });
    assert.strictEqual(impossibleRes.isValid, false);
    assert.ok(impossibleRes.errors.some(e => e.includes('cannot precede departure time')));
  });

  test('Correctly computes duration and validates overnight journeys', () => {
    // Departure at 21:15 on Day 1, Arrival at 03:15 on Day 2 -> 6 hours duration
    const overnightRes = validateTransportRecord({
      mode: 'train',
      service_number: '12562',
      service_name: 'Swatantrata Senani Superfast Express',
      origin_code: 'NDLS',
      destination_code: 'CNB',
      departure_time: '21:15',
      arrival_time: '03:15',
      source_day: 1,
      dest_day: 2,
      journey_date: '2026-10-20',
      source: 'irctc_sql_database'
    });
    assert.strictEqual(overnightRes.isValid, true);
    assert.strictEqual(overnightRes.record.duration_hours, 6);
    assert.strictEqual(overnightRes.record.duration, '6h 0m');
    assert.ok(overnightRes.record.arrival_utc > overnightRes.record.departure_utc);
  });

  test('Attaches data provenance metadata (source, verification_status, retrieved_at)', () => {
    const valid = validateTransportRecord({
      mode: 'flight',
      service_number: '6E-205',
      service_name: 'IndiGo 6E-205',
      origin_code: 'DEL',
      destination_code: 'BOM',
      departure_time: '07:15',
      arrival_time: '09:30',
      fare: 4200,
      currency: 'INR',
      fare_type: 'actual',
      source: 'verified_commercial_flight_registry',
      verification_status: VERIFICATION_STATUSES.PROVIDER_VERIFIED,
      journey_date: '2026-10-20'
    });
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.record.source, 'verified_commercial_flight_registry');
    assert.strictEqual(valid.record.verification_status, 'provider_verified');
    assert.ok(valid.record.retrieved_at !== undefined);
  });

  test('Deterministically deduplicates duplicate records by provider key and itinerary', () => {
    const duplicateList = [
      {
        id: '12301',
        mode: 'train',
        service_number: '12301',
        origin_code: 'NDLS',
        destination_code: 'HWH',
        departure_time: '16:55',
        journey_date: '2026-10-20',
        fare: 2900
      },
      {
        id: '12301',
        mode: 'train',
        service_number: '12301',
        origin_code: 'NDLS',
        destination_code: 'HWH',
        departure_time: '16:55',
        journey_date: '2026-10-20',
        fare: 2900
      },
      {
        id: '12302',
        mode: 'train',
        service_number: '12302',
        origin_code: 'HWH',
        destination_code: 'NDLS',
        departure_time: '16:55',
        journey_date: '2026-10-20',
        fare: 2900
      }
    ];
    const deduped = deduplicateOptions(duplicateList);
    assert.strictEqual(deduped.length, 2);
  });

  // --- Suite 2: Flight Provider Adapter Accuracy ---
  console.log('\n--- Test Suite 2: Flight Provider Adapter Accuracy ---');

  await asyncTest('Returns NO_AIRPORT_AT_ENDPOINT when querying non-airport city (e.g. Ballia)', async () => {
    const res = await searchFlightsFromProvider({
      originInput: 'DEL',
      destInput: 'Ballia',
      departureDate: '2026-10-20'
    });
    assert.strictEqual(res.status, 'NO_AIRPORT_AT_ENDPOINT');
    assert.strictEqual(res.flights.length, 0);
    assert.ok(res.error.includes('commercial airport'));
  });

  await asyncTest('Returns NO_DIRECT_FLIGHTS_FOUND for airport cities with no verified commercial direct routes', async () => {
    // Both Jaipur and Ballia or Leh to Varanasi
    const res = await searchFlightsFromProvider({
      originInput: 'JAI',
      destInput: 'GOI',
      departureDate: '2026-10-20'
    });
    assert.strictEqual(res.status, 'NO_DIRECT_FLIGHTS_FOUND');
    assert.strictEqual(res.flights.length, 0);
  });

  await asyncTest('Returns authentic IndiGo/Air India flight records for verified DEL -> BOM route', async () => {
    const res = await searchFlightsFromProvider({
      originInput: 'DEL',
      destInput: 'BOM',
      departureDate: '2026-10-20'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.ok(res.flights.length > 0);
    const flightNumbers = res.flights.map(f => f.service_number);
    assert.ok(flightNumbers.includes('6E-205'));
    res.flights.forEach(f => {
      assert.strictEqual(f.origin_code, 'DEL');
      assert.strictEqual(f.destination_code, 'BOM');
      assert.strictEqual(f.verification_status, 'provider_verified');
    });
  });

  // --- Suite 3: Bus Provider Adapter Accuracy ---
  console.log('\n--- Test Suite 3: Bus Provider Adapter Accuracy ---');

  await asyncTest('Returns verified state transport buses for known corridor (DDU -> BUI)', async () => {
    const res = await searchBusesFromProvider({
      originCodes: ['DDU'],
      destCodes: ['BUI'],
      departureDate: '2026-10-20'
    });
    assert.strictEqual(res.status, 'SUCCESS');
    assert.ok(res.buses.length > 0);
    const bus = res.buses[0];
    assert.strictEqual(bus.service_number, 'UPSRTC-88');
    assert.strictEqual(bus.destination_code, 'BUI');
  });

  await asyncTest('Returns NO_BUSES_FOUND for non-existent bus corridor (e.g. Guwahati to Mumbai)', async () => {
    const res = await searchBusesFromProvider({
      originCodes: ['GHY'],
      destCodes: ['BOM'],
      departureDate: '2026-10-20'
    });
    assert.strictEqual(res.status, 'NO_BUSES_FOUND');
    assert.strictEqual(res.buses.length, 0);
  });

  // --- Suite 4: MultiModal Discovery Service Anti-Hallucination ---
  console.log('\n--- Test Suite 4: MultiModal Discovery Service Anti-Hallucination ---');

  test('Delhi -> Ballia discovery never invents direct flights', () => {
    const results = discoverMultiModalRoutes(
      { station_code: 'NDLS', station_name: 'New Delhi' },
      { station_code: 'BUI', station_name: 'Ballia' },
      'NDLS',
      'BUI',
      '2026-10-20'
    );
    const directFlights = results.flights.filter(f => f.route_type === 'Direct');
    assert.strictEqual(directFlights.length, 0, 'No direct flight should exist to Ballia');
  });

  test('Multimodal flight for Delhi -> Ballia uses authentic DEL->PAT flight leg (not fake Connecting Flight)', () => {
    const results = discoverMultiModalRoutes(
      { station_code: 'NDLS', station_name: 'New Delhi' },
      { station_code: 'BUI', station_name: 'Ballia' },
      'NDLS',
      'BUI',
      '2026-10-20'
    );
    if (results.flights.length > 0) {
      const mmFlight = results.flights[0];
      assert.strictEqual(mmFlight.route_type, 'Multimodal');
      assert.strictEqual(mmFlight.direct, false);
      assert.strictEqual(mmFlight.verification_status, 'multimodal_reference');
      // Flight leg inside must be authentic 6E-2074
      const flightLeg = mmFlight.legs.find(l => l.type === 'Flight');
      assert.ok(flightLeg !== undefined);
      assert.strictEqual(flightLeg.flight_number, '6E-2074');
    }
  });

  // --- Suite 5: Connection Window & Stop Sequence Integrity ---
  console.log('\n--- Test Suite 5: Connection Window & Stop Sequence Integrity ---');

  test('Direct stop sequence enforces A before B and rejects reverse direction', () => {
    const schedule = [
      { station_code: 'NDLS', stop_sequence: 1 },
      { station_code: 'CNB', stop_sequence: 5 },
      { station_code: 'BSB', stop_sequence: 9 }
    ];
    // Forward: NDLS -> BSB is valid
    assert.strictEqual(validateDirectStopSequence(schedule, 'NDLS', 'BSB'), true);
    // Reverse: BSB -> NDLS is invalid for this train direction
    assert.strictEqual(validateDirectStopSequence(schedule, 'BSB', 'NDLS'), false);
    // Unlisted station: TATA is invalid
    assert.strictEqual(validateDirectStopSequence(schedule, 'NDLS', 'TATA'), false);
  });

  test('evaluateConnectionWindow strictly rejects unsafe layovers (<=45 min) and excessive layovers (>360 min)', () => {
    const baseArr = '2026-10-20T12:00:00Z';
    // 30 mins layover -> Rejection
    const dep30 = '2026-10-20T12:30:00Z';
    const eval30 = evaluateConnectionWindow(baseArr, dep30, false);
    assert.strictEqual(eval30.isValid, false);

    // 400 mins layover -> Rejection
    const dep400 = '2026-10-20T18:40:00Z';
    const eval400 = evaluateConnectionWindow(baseArr, dep400, false);
    assert.strictEqual(eval400.isValid, false);

    // 90 mins layover -> Accepted
    const dep90 = '2026-10-20T13:30:00Z';
    const eval90 = evaluateConnectionWindow(baseArr, dep90, false);
    assert.strictEqual(eval90.isValid, true);
    assert.strictEqual(eval90.layoverMinutes, 90);
  });

  console.log(`\n========================================`);
  console.log(`Regression Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionTestSuite().catch(err => {
  console.error('Test Suite Failed with Exception:', err);
  process.exit(1);
});
