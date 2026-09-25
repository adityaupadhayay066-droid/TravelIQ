const assert = require('assert');
const { 
  getDayOfWeek, 
  normalizeRunsOn, 
  trainRunsOnDate, 
  getTrainFrequencyLabel, 
  formatRunningDays,
  validateFlightInfrastructure
} = require('../services/routeValidationEngine');
const { 
  resolveAirport, 
  hasCommercialAirport, 
  areBothAirportCities, 
  getNearestAirport 
} = require('../utils/airportRegistry');
const { discoverMultiModalRoutes } = require('../services/multiModalDiscoveryService');

async function runTests() {
  console.log('🧪 Starting TravelIQ Route Validation Engine Tests...\n');
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

  // --- Scenario 1: Airport Resolution & Direct Flight Restriction ---
  console.log('--- Test Suite 1: Airport Validation & Non-Airport Infrastructure ---');
  
  test('Non-airport cities (Ballia, Buxar, Alwar) do NOT have commercial airports', () => {
    assert.strictEqual(hasCommercialAirport('Ballia'), false);
    assert.strictEqual(hasCommercialAirport('BUI'), false);
    assert.strictEqual(hasCommercialAirport('Buxar'), false);
    assert.strictEqual(hasCommercialAirport('Alwar'), false);
  });

  test('Major metro hubs (Delhi, Mumbai, Bengaluru) HAVE commercial airports', () => {
    assert.strictEqual(hasCommercialAirport('Delhi'), true);
    assert.strictEqual(hasCommercialAirport('NDLS'), true);
    assert.strictEqual(hasCommercialAirport('Mumbai'), true);
    assert.strictEqual(hasCommercialAirport('BOM'), true);
    assert.strictEqual(hasCommercialAirport('BLR'), true);
  });

  test('areBothAirportCities is true for Delhi-Mumbai and false for Delhi-Ballia', () => {
    assert.strictEqual(areBothAirportCities('Delhi', 'Mumbai'), true);
    assert.strictEqual(areBothAirportCities('NDLS', 'BUI'), false);
    assert.strictEqual(areBothAirportCities('Delhi', 'Ballia'), false);
  });

  test('getNearestAirport finds Patna (PAT) for Ballia within 150km', () => {
    const nearest = getNearestAirport('Ballia', 200);
    assert.ok(nearest !== null);
    assert.strictEqual(nearest.airport.iata, 'PAT');
    assert.ok(nearest.distanceKm > 0 && nearest.distanceKm <= 150);
  });

  test('validateFlightInfrastructure suggests Multimodal (Flight + Ground Transfer) for Delhi -> Ballia', () => {
    const flightInfo = validateFlightInfrastructure('Delhi', 'Ballia');
    assert.strictEqual(flightInfo.canFlyDirect, false);
    assert.ok(flightInfo.multimodalAlternative !== null);
    assert.strictEqual(flightInfo.multimodalAlternative.destAirport.iata, 'PAT');
    assert.ok(flightInfo.multimodalAlternative.destGroundTransfer !== null);
  });

  test('discoverMultiModalRoutes for Delhi -> Ballia contains NO direct flights, only multimodal or trains/buses', () => {
    const results = discoverMultiModalRoutes(
      { station_code: 'NDLS', station_name: 'New Delhi' },
      { station_code: 'BUI', station_name: 'Ballia' },
      'NDLS',
      'BUI'
    );
    // Direct flights must be empty
    const directFlights = results.flights.filter(f => f.route_type === 'Direct');
    assert.strictEqual(directFlights.length, 0);

    // Multimodal option (if present) must be marked 'Multimodal' and NOT 'Direct'
    results.flights.forEach(f => {
      assert.strictEqual(f.route_type, 'Multimodal');
      assert.strictEqual(f.direct, false);
    });

    // Valid trains and buses exist
    assert.ok(results.trains.length > 0);
    assert.ok(results.buses.length > 0);
  });

  // --- Scenario 2: Train Operating Days (runs_on) & Date Filtering ---
  console.log('\n--- Test Suite 2: Train Operating Days & Date Filtering ---');

  test('getDayOfWeek correctly returns 3-letter weekday', () => {
    // 2026-09-24 is Thursday
    assert.strictEqual(getDayOfWeek('2026-09-24'), 'THU');
    // 2026-09-25 is Friday
    assert.strictEqual(getDayOfWeek('2026-09-25'), 'FRI');
    // 2026-09-28 is Monday
    assert.strictEqual(getDayOfWeek('2026-09-28'), 'MON');
  });

  test('trainRunsOnDate returns true for Daily trains on any day', () => {
    const dailyTrain = { runs_on: ['Daily'] };
    assert.strictEqual(trainRunsOnDate(dailyTrain, '2026-09-24'), true);
    assert.strictEqual(trainRunsOnDate(dailyTrain, '2026-09-25'), true);
  });

  test('trainRunsOnDate respects specific operating days (e.g. MON, WED, FRI)', () => {
    const triWeeklyTrain = { runs_on: ['MON', 'WED', 'FRI'] };
    // Friday: Should run
    assert.strictEqual(trainRunsOnDate(triWeeklyTrain, '2026-09-25'), true);
    // Thursday: Should NOT run
    assert.strictEqual(trainRunsOnDate(triWeeklyTrain, '2026-09-24'), false);
    // Monday: Should run
    assert.strictEqual(trainRunsOnDate(triWeeklyTrain, '2026-09-28'), true);
  });

  test('discoverMultiModalRoutes filters out trains that do not run on the selected date', () => {
    // Thursday (2026-09-24): Train 104 (MON, WED, FRI) and Train 102 (Vande Bharat - no THU) should NOT be returned
    const thuResults = discoverMultiModalRoutes(
      { station_code: 'NDLS', station_name: 'New Delhi' },
      { station_code: 'BUI', station_name: 'Ballia' },
      'NDLS',
      'BUI',
      '2026-09-24'
    );
    const thuNumbers = thuResults.trains.map(t => t.number);
    assert.strictEqual(thuNumbers.includes('22428'), false, 'Bhrigu Express should not run on Thursday');
    assert.strictEqual(thuNumbers.includes('22436'), false, 'Vande Bharat should not run on Thursday');

    // Friday (2026-09-25): Train 104 (Bhrigu SF Express) SHOULD be returned
    const friResults = discoverMultiModalRoutes(
      { station_code: 'NDLS', station_name: 'New Delhi' },
      { station_code: 'BUI', station_name: 'Ballia' },
      'NDLS',
      'BUI',
      '2026-09-25'
    );
    const friNumbers = friResults.trains.map(t => t.number);
    assert.strictEqual(friNumbers.includes('22428'), true, 'Bhrigu Express should run on Friday');
  });

  // --- Scenario 3: Train Frequency Labels & Running Days Formatting ---
  console.log('\n--- Test Suite 3: Train Frequency & Formatting Labels ---');

  test('getTrainFrequencyLabel formats Daily and weekly frequencies correctly', () => {
    assert.strictEqual(getTrainFrequencyLabel(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']), 'Daily (7 days/week)');
    assert.strictEqual(getTrainFrequencyLabel(['Daily']), 'Daily (7 days/week)');
    assert.strictEqual(getTrainFrequencyLabel(['MON', 'WED', 'FRI']), '3 days/week (MON, WED, FRI)');
    assert.strictEqual(getTrainFrequencyLabel(['SUN']), '1 days/week (SUN)');
  });

  test('formatRunningDays formats display string properly', () => {
    assert.strictEqual(formatRunningDays(['Daily']), 'Daily');
    assert.strictEqual(formatRunningDays(['MON', 'WED', 'FRI']), 'MON, WED, FRI');
  });

  // --- Scenario 4: Direct vs Connecting vs Multimodal Route Type Integrity ---
  console.log('\n--- Test Suite 4: Route Type Integrity ---');

  test('All generated trains have validated, route_type, and frequency fields', () => {
    const results = discoverMultiModalRoutes(
      { station_code: 'NDLS', station_name: 'New Delhi' },
      { station_code: 'CNB', station_name: 'Kanpur' },
      'NDLS',
      'CNB',
      '2026-09-25'
    );

    results.trains.forEach(t => {
      assert.ok(t.route_type !== undefined, `Train ${t.number} missing route_type`);
      assert.ok(t.frequency !== undefined, `Train ${t.number} missing frequency`);
      assert.ok(t.running_days !== undefined, `Train ${t.number} missing running_days`);
      assert.strictEqual(t.validated, true);
    });
  });

  console.log(`\n================================`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
