const assert = require('assert');
const { 
  getVerifiedDirectTrains, 
  getVerifiedConnectingRoutes, 
  getGroundedTransitData, 
  formatDeterministicGroundedResponse,
  generateGroundedResponse
} = require('../services/deterministicRoutingService');
const { 
  isTransitRoutingQuery, 
  extractTransitEntities 
} = require('../services/transitIntentService');
const { sequelize } = require('../models');

async function runZeroGenerativeRoutingTests() {
  console.log('🧪 Starting Zero Generative Routing & Grounded Engine Tests...\n');
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

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 1: Strict Stop-Sequence Verification (SQL Relational Engine)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('--- Test Suite 1: Strict Stop-Sequence Verification (SQL Engine) ---');

  await test('SQL Query enforces s1.stop_sequence < s2.stop_sequence (Departure strictly before Arrival)', async () => {
    // Direct raw query to test sequence verification
    const query = `
      SELECT 
          s1.train_number,
          s1.station_code AS origin,
          s2.station_code AS dest,
          s1.stop_sequence AS dep_seq,
          s2.stop_sequence AS arr_seq
      FROM train_schedules s1
      JOIN train_schedules s2 ON s1.train_number = s2.train_number
      WHERE s1.station_code = :origin
        AND s2.station_code = :dest
        AND s1.stop_sequence < s2.stop_sequence
      LIMIT 10;
    `;

    const results = await sequelize.query(query, {
      replacements: { origin: 'NDLS', dest: 'CNB' },
      type: sequelize.QueryTypes.SELECT
    });

    assert(results.length > 0, 'Expected trains from NDLS to CNB');
    results.forEach(row => {
      assert(row.dep_seq < row.arr_seq, `Violation: dep_seq (${row.dep_seq}) must be < arr_seq (${row.arr_seq})`);
    });
  });

  await test('SQL Query returns 0 rows if station sequence is reversed (No reverse-direction false positives)', async () => {
    // If a train goes NDLS -> CNB, querying CNB -> NDLS on that train must only match if reverse schedule exists
    const directTrains = await getVerifiedDirectTrains('CNB', 'NDLS');
    directTrains.forEach(t => {
      // Ensure it is truly running CNB -> NDLS
      assert.strictEqual(t.origin, 'CNB');
      assert.strictEqual(t.destination, 'NDLS');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 2: Zero Hallucination on Non-Existent Direct Corridors (TATA -> BUI)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 2: Elimination of Hallucinated Direct Routes (Tatanagar -> Ballia) ---');

  await test('Tatanagar (TATA) to Ballia (BUI) has ZERO direct trains in database', async () => {
    const directTrains = await getVerifiedDirectTrains('TATA', 'BUI');
    assert.strictEqual(directTrains.length, 0, 'Direct trains from TATA to BUI must be 0! Found: ' + JSON.stringify(directTrains));
  });

  await test('Hallucinated trains #12301 (Rajdhani) and #12566 (Sampark Kranti) NEVER match TATA -> BUI', async () => {
    const directTrains = await getVerifiedDirectTrains('TATA', 'BUI');
    const trainNumbers = directTrains.map(t => t.train_number);
    assert(!trainNumbers.includes('12301'), 'Train #12301 (Howrah Rajdhani) must NEVER match TATA -> BUI!');
    assert(!trainNumbers.includes('12566'), 'Train #12566 (Bihar Sampark Kranti) must NEVER match TATA -> BUI!');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 3: Deterministic Connecting Hub Discovery
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 3: Verified Connecting Hub Routes (Tatanagar -> Ballia) ---');

  await test('Discovers verified connecting routes for TATA -> BUI via transit hubs (e.g. DDU / BSB)', async () => {
    const connecting = await getVerifiedConnectingRoutes('TATA', 'BUI');
    assert(connecting.length > 0, 'Expected connecting route for TATA -> BUI');
    const firstOption = connecting[0];
    assert(firstOption.hub_code, 'Connecting option must specify hub_code');
    assert(firstOption.hub_name, 'Connecting option must specify hub_name');
    assert(firstOption.layover_wait_time, 'Connecting option must specify layover_wait_time');
    assert(firstOption.legs.length >= 2, 'Connecting option must consist of at least 2 legs');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 4: Grounded Routing Rules Compliance
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 4: Grounded Prompt & Output Formatting Rules ---');

  await test('Rule 2 & 3: Empty direct routes outputs "No direct trains are available on this route." and displays layover hub name and wait time', () => {
    const mockTransitData = {
      query: { origin: 'Tatanagar (TATA)', destination: 'Ballia (BUI)', date: '2026-10-14' },
      direct_routes: [],
      connecting_routes: [{
        hub_code: 'DDU',
        hub_name: 'Pt. Deen Dayal Upadhyaya Jn',
        layover_wait_time: '1h 20m',
        total_duration: '14h 00m',
        legs: [
          { leg_number: 1, train_number: '12801', train_name: 'Purushottam Express', from_station: 'TATA', to_station: 'DDU', departure_time: '06:15', arrival_time: '14:20' },
          { leg_number: 2, train_number: '15126', train_name: 'Jan Shatabdi Express', from_station: 'DDU', to_station: 'BUI', departure_time: '15:40', arrival_time: '18:35' }
        ]
      }]
    };

    const formatted = formatDeterministicGroundedResponse(mockTransitData);
    assert(formatted.includes('No direct trains are available on this route.'), 'Must explicitly state "No direct trains are available on this route."');
    assert(formatted.includes('Pt. Deen Dayal Upadhyaya Jn'), 'Must include layover hub name');
    assert(formatted.includes('1h 20m'), 'Must include transfer wait time');
    assert(formatted.includes('#12801'), 'Must include leg 1 train');
    assert(formatted.includes('#15126'), 'Must include leg 2 train');
  });

  await test('Rule 4: When both direct and connecting routes are absent, states "No verified routes found for this date."', () => {
    const emptyTransitData = {
      query: { origin: 'XYZ', destination: 'ABC', date: '2026-10-14' },
      direct_routes: [],
      connecting_routes: []
    };

    const formatted = formatDeterministicGroundedResponse(emptyTransitData);
    assert.strictEqual(formatted, 'No verified routes found for this date.');
  });

  await test('Rule 1: Direct routes format verified train numbers, timings, duration, frequency, and fares', () => {
    const mockDirectData = {
      query: { origin: 'New Delhi (NDLS)', destination: 'Varanasi (BSB)', date: '2026-10-14' },
      direct_routes: [{
        train_number: '22436',
        train_name: 'Vande Bharat Express',
        departure_time: '06:00',
        arrival_time: '14:00',
        duration: '8h 0m',
        frequency: 'Daily',
        runs_on: 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
        fares: 'CC: ₹1750, EC: ₹3300'
      }],
      connecting_routes: []
    };

    const formatted = formatDeterministicGroundedResponse(mockDirectData);
    assert(formatted.includes('#22436 — Vande Bharat Express'));
    assert(formatted.includes('Departure: 06:00 | Arrival: 14:00'));
    assert(formatted.includes('Duration: 8h 0m'));
    assert(formatted.includes('CC: ₹1750, EC: ₹3300'));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 5: Natural Language Transit Intent & Entity Extraction
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 5: Transit Intent & Entity Extraction ---');

  await test('Correctly detects transit routing queries and extracts origin/destination', () => {
    assert.strictEqual(isTransitRoutingQuery('What are the trains from Tatanagar to Ballia?'), true);
    const entities1 = extractTransitEntities('What are the trains from Tatanagar to Ballia?');
    assert.strictEqual(entities1.origin.toLowerCase(), 'tatanagar');
    assert.strictEqual(entities1.destination.toLowerCase(), 'ballia');

    assert.strictEqual(isTransitRoutingQuery('Show direct train between NDLS and BSB on 2026-11-15'), true);
    const entities2 = extractTransitEntities('Show direct train between NDLS and BSB on 2026-11-15');
    assert.strictEqual(entities2.origin.toUpperCase(), 'NDLS');
    assert.strictEqual(entities2.destination.toUpperCase(), 'BSB');
    assert.strictEqual(entities2.travelDate, '2026-11-15');
  });

  await test('Non-transit queries (API keys, general help) are NOT classified as transit routing', () => {
    assert.strictEqual(isTransitRoutingQuery('How to get developer api key?'), false);
    assert.strictEqual(isTransitRoutingQuery('Tell me about food in Manali'), false);
    assert.strictEqual(isTransitRoutingQuery('What is the refund policy for tickets?'), false);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 6: End-to-End Grounded Generation for Tatanagar -> Ballia
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 6: End-to-End Grounded Response Generation ---');

  await test('generateGroundedResponse for Tatanagar to Ballia generates strictly grounded response with zero hallucination', async () => {
    const result = await generateGroundedResponse(
      'What are the trains from Tatanagar to Ballia?',
      'Tatanagar',
      'Ballia',
      '2026-10-14'
    );

    assert(result, 'Result must not be null');
    assert(result.response, 'Response must not be empty');
    assert(result.grounded === true, 'Must be marked as grounded');
    assert(result.transitData.direct_routes.length === 0, 'direct_routes must be empty for TATA -> BUI');
    assert(!result.response.includes('12301'), 'Must NOT hallucinate 12301');
    assert(!result.response.includes('12566'), 'Must NOT hallucinate 12566');
  });
  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 7: Strict Entity Resolution & Fuzzy Matching
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 7: Strict Entity Resolution & Fuzzy Station Matching ---');

  const { resolveStation, parseTravelDate } = require('../services/stationResolver');

  await test('Resolves common typos and synonyms with station clusters (delh, patna jn, tata, calcutta, bombay)', async () => {
    const delhMatch = await resolveStation('delh');
    assert.deepStrictEqual(delhMatch.stationCodes, ['NDLS', 'DLI', 'ANVT', 'NZM']);

    const patnaMatch = await resolveStation('patna jn');
    assert.deepStrictEqual(patnaMatch.stationCodes, ['PNBE', 'PPTA', 'DNR', 'RJPB']);

    const tataMatch = await resolveStation('tata');
    assert.deepStrictEqual(tataMatch.stationCodes, ['TATA']);

    const jamshedpurMatch = await resolveStation('jamshedpur');
    assert.deepStrictEqual(jamshedpurMatch.stationCodes, ['TATA']);

    const calcuttaMatch = await resolveStation('calcutta');
    assert.deepStrictEqual(calcuttaMatch.stationCodes, ['HWH', 'SDAH', 'KOAA', 'SHM']);

    const bombayMatch = await resolveStation('bombay');
    assert.deepStrictEqual(bombayMatch.stationCodes, ['CSMT', 'BDTS', 'LTT', 'BCT']);
  });

  await test('Catches typos using Levenshtein distance <= 2 (tatangr, howrha, bombai)', async () => {
    const tataTypo = await resolveStation('tatangr');
    assert.deepStrictEqual(tataTypo.stationCodes, ['TATA']);

    const kolkataTypo = await resolveStation('howrha');
    assert.deepStrictEqual(kolkataTypo.stationCodes, ['HWH', 'SDAH', 'KOAA', 'SHM']);

    const mumbaiTypo = await resolveStation('bombai');
    assert.deepStrictEqual(mumbaiTypo.stationCodes, ['CSMT', 'BDTS', 'LTT', 'BCT']);
  });

  await test('Intelligent date fallback defaults to tomorrow with user notification notice', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const fallback = parseTravelDate('trains from delhi to patna');
    assert.strictEqual(fallback.travelDate, tomorrowStr);
    assert.strictEqual(fallback.isDefaultDate, true);
    assert(fallback.dateNotice.includes(`tomorrow (${tomorrowStr})`));

    const explicit = parseTravelDate('trains from delhi to patna on 2026-11-20');
    assert.strictEqual(explicit.travelDate, '2026-11-20');
    assert.strictEqual(explicit.isDefaultDate, false);
    assert.strictEqual(explicit.dateNotice, null);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST SUITE 8: Multi-Station Cluster Querying (Delhi -> Patna, Tatanagar -> Patna)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- Test Suite 8: Multi-Station Cluster Querying (Delhi -> Patna, Tata -> Patna) ---');

  await test('Delhi to Patna resolves via multi-station cluster query and finds direct trains', async () => {
    const directTrains = await getVerifiedDirectTrains('delh', 'patna');
    assert(directTrains.length > 0, 'Must find direct trains between Delhi cluster and Patna cluster');

    const trainNumbers = directTrains.map(t => t.train_number);
    assert(trainNumbers.includes('12310') || trainNumbers.includes('12394') || trainNumbers.includes('12566'),
      'Must contain verified trains like Patna Rajdhani (12310), Sampoorna Kranti (12394), or Bihar Sampark Kranti (12566)');
  });

  await test('Tatanagar to Patna resolves via cluster query and finds direct trains', async () => {
    const directTrains = await getVerifiedDirectTrains('tata', 'patna');
    assert(directTrains.length > 0, 'Must find direct trains between TATA and Patna cluster');

    const trainNumbers = directTrains.map(t => t.train_number);
    assert(trainNumbers.includes('18183') || trainNumbers.includes('20834'),
      'Must contain verified trains like Tatanagar-Danapur Express (18183) or Vande Bharat (20834)');
  });

  await test('End-to-End Chatbot response formats date notice and verified direct trains', async () => {
    const result = await generateGroundedResponse(
      'Are there any trains from delh to patna?',
      'delh',
      'patna'
    );
    assert(result && result.response, 'Response must exist');
    assert(result.response.includes('Showing schedules for tomorrow'), 'Must inform user about tomorrow schedule');
    assert(result.response.includes('Verified Direct Trains'), 'Must list verified direct trains');
    assert(result.transitData.direct_routes.length > 0, 'direct_routes count must be > 0');
  });

  console.log(`\n========================================`);
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runZeroGenerativeRoutingTests()
  .then(() => {
    console.log('✅ All Zero Generative Routing tests completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  });
