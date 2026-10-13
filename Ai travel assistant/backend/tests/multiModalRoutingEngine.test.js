const assert = require('assert');
const {
  MultiModalRoutingEngine,
  UNIVERSAL_HUB_INDEX,
  CITY_CLUSTERS,
  calculateGeodesicDistance,
  getCandidateHubsInCorridor,
  resolveClusterTransfer,
  buildIsoUtcTimestamp,
  evaluateConnectionWindow,
  validateDirectStopSequence
} = require('../services/multiModalRoutingEngine');

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 TravelIQ MultiModalRoutingEngine Comprehensive Test Suite');
  console.log('================================================================\n');

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
      if (err.stack) console.error(`     Stack: ${err.stack.split('\n').slice(1, 3).join('\n')}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) console.error(`     Stack: ${err.stack.split('\n').slice(1, 3).join('\n')}`);
      failed++;
    }
  }

  const engine = new MultiModalRoutingEngine();

  // ─── SUITE 1: UNIVERSAL HUB ARCHITECTURE & SPATIAL CORRIDOR PRUNING ─────
  console.log('--- Test Suite 1: Universal Hub Architecture & Corridor Pruning ---');

  test('Universal Hub Index contains ranked junctions from all 4 national quadrants', () => {
    const north = UNIVERSAL_HUB_INDEX.filter(h => h.region === 'North');
    const east = UNIVERSAL_HUB_INDEX.filter(h => h.region === 'Central/East');
    const west = UNIVERSAL_HUB_INDEX.filter(h => h.region === 'West');
    const south = UNIVERSAL_HUB_INDEX.filter(h => h.region === 'South');

    assert.ok(north.some(h => h.code === 'NDLS' && h.tier === 1));
    assert.ok(north.some(h => h.code === 'CNB' && h.tier === 1));
    assert.ok(east.some(h => h.code === 'DDU' && h.tier === 1));
    assert.ok(east.some(h => h.code === 'HWH' && h.tier === 1));
    assert.ok(west.some(h => h.code === 'CSMT' && h.tier === 1));
    assert.ok(west.some(h => h.code === 'ADI' && h.tier === 1));
    assert.ok(south.some(h => h.code === 'MAS' && h.tier === 1));
    assert.ok(south.some(h => h.code === 'SBC' && h.tier === 1));
  });

  test('Spatial Bounding Corridor prunes counter-intuitive backward detours', () => {
    // TATA (Jamshedpur) -> BUI (Ballia)
    const hubs = getCandidateHubsInCorridor('TATA', 'BUI');
    const hubCodes = hubs.map(h => h.code);

    // DDU and BSB lie strictly within the 1.45 corridor
    assert.ok(hubCodes.includes('DDU'), 'DDU must be in TATA -> BUI corridor');
    assert.ok(hubCodes.includes('BSB'), 'BSB must be in TATA -> BUI corridor');

    // Backward hubs (e.g. MAS, CSMT, SBC) must be PRUNED
    assert.strictEqual(hubCodes.includes('MAS'), false, 'Chennai (MAS) must be pruned from TATA -> BUI');
    assert.strictEqual(hubCodes.includes('CSMT'), false, 'Mumbai (CSMT) must be pruned from TATA -> BUI');
    assert.strictEqual(hubCodes.includes('SBC'), false, 'Bangalore (SBC) must be pruned from TATA -> BUI');
  });

  // ─── SUITE 2: SPEC REQUIRED TEST CASE 1 (EAST CORRIDOR: TATA -> BUI) ─────
  console.log('\n--- Test Suite 2: Test Case 1 (East Corridor: TATA -> BUI) ---');

  await testAsync('Test Case 1: TATA -> BUI connects via DDU or BSB with zero direct hallucination', async () => {
    // 1. Verify that direct rail does NOT exist
    const directTrains = await engine.findVerifiedDirectTrains('TATA', 'BUI', '2026-10-15');
    assert.strictEqual(directTrains.length, 0, 'Must NOT hallucinate direct train between TATA and BUI');

    // 2. Discover connecting routes
    const result = await engine.findConnectingRoutes('TATA', 'BUI', '2026-10-15');
    assert.strictEqual(result.hasDirectRoute, false, 'hasDirectRoute must be false');
    assert.ok(result.routes.length > 0, 'Must generate valid connecting routes');

    // 3. Must connect via DDU or BSB
    const connectsViaDduOrBsb = result.routes.some(r => r.hub === 'DDU' || r.hub === 'BSB' || r.hub === 'MGS');
    assert.ok(connectsViaDduOrBsb, 'Connecting route must connect via DDU or BSB');

    // 4. Verify Leg 1, Leg 2, and layover window
    const sampleRoute = result.routes.find(r => r.hub === 'DDU' || r.hub === 'BSB');
    assert.ok(sampleRoute, 'Found sample connecting route');
    assert.strictEqual(sampleRoute.direct, false);
    assert.strictEqual(sampleRoute.route_type, 'Connecting');
    assert.ok(sampleRoute.layover_minutes >= 60 && sampleRoute.layover_minutes <= 360, `Layover must be in 60-360m: got ${sampleRoute.layover_minutes}`);
    assert.ok(sampleRoute.departure_time_utc.endsWith('Z'), 'Timestamp must be ISO-8601 UTC');
    assert.ok(sampleRoute.arrival_time_utc.endsWith('Z'), 'Timestamp must be ISO-8601 UTC');
    assert.strictEqual(sampleRoute.legs.length, 2, 'Must have 2 train legs');
    assert.strictEqual(sampleRoute.legs[0].from_station, 'TATA');
    assert.strictEqual(sampleRoute.legs[1].to_station, 'BUI');
  });

  // ─── SUITE 3: SPEC REQUIRED TEST CASE 2 (WEST-NORTH CORRIDOR: PUNE -> UDAIPUR) ──
  console.log('\n--- Test Suite 3: Test Case 2 (West-North Corridor: PUNE -> UDAIPUR) ---');

  await testAsync('Test Case 2: PUNE -> UDAIPUR connects via BSR, ADI, or RTM', async () => {
    // 1. Verify direct rail is omitted
    const directTrains = await engine.findVerifiedDirectTrains('PUNE', 'UDZ', '2026-10-15');
    assert.strictEqual(directTrains.length, 0, 'Must NOT hallucinate direct train between PUNE and UDZ');

    // 2. Discover connecting routes
    const result = await engine.findConnectingRoutes('PUNE', 'UDZ', '2026-10-15');
    assert.strictEqual(result.hasDirectRoute, false);
    assert.ok(result.routes.length > 0, 'Must find connecting routes');

    // 3. Must connect via BSR, ADI, or RTM
    const validHubs = ['BSR', 'ADI', 'RTM'];
    const connectsViaValidHub = result.routes.some(r => validHubs.includes(r.hub));
    assert.ok(connectsViaValidHub, 'Must connect via BSR, ADI, or RTM');

    // 4. Verify leg chain and layovers
    const bsrOrAdiRoute = result.routes.find(r => validHubs.includes(r.hub));
    assert.ok(bsrOrAdiRoute);
    assert.ok(bsrOrAdiRoute.layover_minutes >= 60 && bsrOrAdiRoute.layover_minutes <= 360);
    assert.strictEqual(bsrOrAdiRoute.origin_station, 'PUNE');
    assert.strictEqual(bsrOrAdiRoute.destination_station, 'UDZ');
  });

  // ─── SUITE 4: SPEC REQUIRED TEST CASE 3 (CLUSTER TRANSFER: LKO -> GOI) ──
  console.log('\n--- Test Suite 4: Test Case 3 (Cluster Transfer: LKO -> GOI) ---');

  await testAsync('Test Case 3: LKO -> GOI involves inter-terminal transfer with >= 120 min buffer', async () => {
    // Discover route from Lucknow (rail) to Goa Airport (GOI)
    const result = await engine.findConnectingRoutes('LKO', 'GOI', '2026-10-15');
    assert.ok(result.routes.length > 0, 'Must find multimodal connecting route for LKO -> GOI');

    // Find the cluster transfer route connecting through Mumbai Metro Cluster
    const clusterRoute = result.routes.find(r => r.is_cluster_transfer || r.legs.some(l => l.is_cluster_transfer || l.mode === 'CAB / METRO'));
    assert.ok(clusterRoute, 'Must contain inter-terminal transfer leg in city cluster');

    // Check that cluster transfer leg was added
    const transferLeg = clusterRoute.legs.find(l => l.is_cluster_transfer || l.service_number === 'INTER-TERMINAL');
    assert.ok(transferLeg, 'Inter-terminal transfer leg must be present');
    assert.strictEqual(transferLeg.mode, 'CAB / METRO');
    assert.ok(transferLeg.cluster.includes('Mumbai') || transferLeg.cluster.includes('Delhi'));

    // Check minimum buffer enforcement: layover must be >= 120 minutes (increased from 60 mins)
    assert.ok(clusterRoute.layover_minutes >= 120, `Cluster transfer buffer must be >= 120 mins: got ${clusterRoute.layover_minutes}`);
    assert.ok(clusterRoute.layover_minutes <= 360, `Cluster transfer buffer must be <= 360 mins: got ${clusterRoute.layover_minutes}`);
  });

  // ─── SUITE 5: SPEC REQUIRED TEST CASE 4 (BUFFER REJECTION) ───────────────
  console.log('\n--- Test Suite 5: Test Case 4 (Buffer Rejection Rules) ---');

  test('Test Case 4a: Discards transfers with layover <= 45 minutes', () => {
    // 30 min layover: 14:00:00 to 14:30:00
    const arrIso = '2026-10-15T14:00:00Z';
    const depIso30m = '2026-10-15T14:30:00Z';
    const eval30m = evaluateConnectionWindow(arrIso, depIso30m, false);
    assert.strictEqual(eval30m.isValid, false, '30 min layover must be discarded');
    assert.ok(eval30m.reason.includes('45 mins minimum safety threshold'));

    // 45 min layover: 14:00:00 to 14:45:00
    const depIso45m = '2026-10-15T14:45:00Z';
    const eval45m = evaluateConnectionWindow(arrIso, depIso45m, false);
    assert.strictEqual(eval45m.isValid, false, '45 min layover must be discarded');
    assert.ok(eval45m.reason.includes('45 mins minimum safety threshold'));

    // 55 min layover: under standard 60m minRequired
    const depIso55m = '2026-10-15T14:55:00Z';
    const eval55m = evaluateConnectionWindow(arrIso, depIso55m, false);
    assert.strictEqual(eval55m.isValid, false, '55 min layover must be discarded');
  });

  test('Test Case 4b: Discards transfers with layover > 6 hours (360 minutes)', () => {
    const arrIso = '2026-10-15T10:00:00Z';
    // 6.5 hours (390 mins): 10:00 to 16:30
    const depIso390m = '2026-10-15T16:30:00Z';
    const eval390m = evaluateConnectionWindow(arrIso, depIso390m, false);
    assert.strictEqual(eval390m.isValid, false, '390 min layover must be discarded');
    assert.ok(eval390m.reason.includes('360 mins'));

    // 8 hours (480 mins): 10:00 to 18:00
    const depIso480m = '2026-10-15T18:00:00Z';
    const eval480m = evaluateConnectionWindow(arrIso, depIso480m, false);
    assert.strictEqual(eval480m.isValid, false, '480 min layover must be discarded');
    assert.ok(eval480m.reason.includes('360 mins'));
  });

  test('Test Case 4c: Discards cluster transfers with layover < 120 minutes', () => {
    const arrIso = '2026-10-15T10:00:00Z';
    // 90 min layover: enough for same-station (>=60m), but NOT for cluster transfer (requires >= 120m)
    const depIso90m = '2026-10-15T11:30:00Z';
    const evalCluster90m = evaluateConnectionWindow(arrIso, depIso90m, true);
    assert.strictEqual(evalCluster90m.isValid, false, 'Cluster transfer with 90m buffer must be rejected');
    assert.ok(evalCluster90m.reason.includes('120 mins'));

    // 150 min layover: valid for cluster transfer (>= 120m and <= 360m)
    const depIso150m = '2026-10-15T12:30:00Z';
    const evalCluster150m = evaluateConnectionWindow(arrIso, depIso150m, true);
    assert.strictEqual(evalCluster150m.isValid, true, 'Cluster transfer with 150m buffer must be accepted');
  });

  test('Test Case 4d: Accepts valid transfers within 60 min to 360 min window', () => {
    const arrIso = '2026-10-15T10:00:00Z';
    // 75 min layover
    const depIso75m = '2026-10-15T11:15:00Z';
    const eval75m = evaluateConnectionWindow(arrIso, depIso75m, false);
    assert.strictEqual(eval75m.isValid, true);
    assert.strictEqual(eval75m.layoverMinutes, 75);

    // 180 min layover (3 hours)
    const depIso180m = '2026-10-15T13:00:00Z';
    const eval180m = evaluateConnectionWindow(arrIso, depIso180m, false);
    assert.strictEqual(eval180m.isValid, true);
    assert.strictEqual(eval180m.layoverMinutes, 180);
  });

  // ─── SUITE 6: STRICT UPSTREAM DIRECT ROUTE VALIDATION ─────────────────────
  console.log('\n--- Test Suite 6: Stop Sequence & Direct Hallucination Elimination ---');

  test('validateDirectStopSequence strictly enforces stop_index(A) < stop_index(B)', () => {
    const sampleSchedule = [
      { station_code: 'PURI', stop_sequence: 1 },
      { station_code: 'TATA', stop_sequence: 9 },
      { station_code: 'DDU',  stop_sequence: 19 },
      { station_code: 'NDLS', stop_sequence: 26 }
    ];

    // Forward direction: Valid
    assert.strictEqual(validateDirectStopSequence(sampleSchedule, 'TATA', 'DDU'), true);
    assert.strictEqual(validateDirectStopSequence(sampleSchedule, 'TATA', 'NDLS'), true);

    // Reverse direction (NDLS -> TATA on upstream train): Invalid
    assert.strictEqual(validateDirectStopSequence(sampleSchedule, 'NDLS', 'TATA'), false);

    // Missing station: Invalid
    assert.strictEqual(validateDirectStopSequence(sampleSchedule, 'TATA', 'BUI'), false);
    assert.strictEqual(validateDirectStopSequence(sampleSchedule, 'PUNE', 'UDZ'), false);
  });

  // ─── SUITE 7: DATE ROLL-OVERS & EPOCH-BASED ISO UTC TIMESTAMPS ────────────
  console.log('\n--- Test Suite 7: Epoch Timestamps & +1/+2 Day Roll-Overs ---');

  test('buildIsoUtcTimestamp correctly handles +1 and +2 day offsets', () => {
    // Day 1
    const tsDay1 = buildIsoUtcTimestamp('2026-10-15', '06:30:00', 0);
    assert.strictEqual(tsDay1, '2026-10-15T06:30:00Z');

    // Day 2 (+1 day)
    const tsDay2 = buildIsoUtcTimestamp('2026-10-15', '16:50:00', 1);
    assert.strictEqual(tsDay2, '2026-10-16T16:50:00Z');

    // Day 3 (+2 days)
    const tsDay3 = buildIsoUtcTimestamp('2026-10-15', '04:00:00', 2);
    assert.strictEqual(tsDay3, '2026-10-17T04:00:00Z');
  });

  // ─── SUITE 8: MULTI-MODAL FALLBACKS ───────────────────────────────────────
  console.log('\n--- Test Suite 8: Multi-Modal Fallbacks (Rail+Bus, Flight+Rail/Road) ---');

  test('Rail + Bus fallback discovers intercity bus from Hub when needed', () => {
    const candidateHubs = [{ code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Jn' }];
    const fallback = engine.findRailBusFallback('TATA', 'BUI', candidateHubs, '2026-10-15');
    assert.ok(fallback.length > 0, 'Must produce Rail + Bus fallback');
    assert.strictEqual(fallback[0].route_type, 'Multimodal');
    assert.strictEqual(fallback[0].legs[0].mode, 'Train');
    assert.strictEqual(fallback[0].legs[1].mode, 'Bus');
    assert.ok(fallback[0].legs[1].service_name.includes('UPSRTC'));
  });

  test('Flight + Road fallback discovers flight and last-mile transit', () => {
    const flightFallback = engine.findFlightMultiModalFallback('LKO', 'GOI', '2026-10-15');
    assert.ok(flightFallback !== null, 'Must produce Flight + Transit fallback');
    assert.strictEqual(flightFallback.route_type, 'Multimodal');
    assert.ok(flightFallback.legs.some(l => l.mode === 'Flight'));
  });

  console.log('\n================================================================');
  console.log(`Test Execution Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
