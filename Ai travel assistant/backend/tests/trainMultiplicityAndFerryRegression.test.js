
const assert = require('assert');
const { Train, TrainSchedule, TrainFare, Station, sequelize } = require('../models');
const { searchFerriesFromProvider } = require('../services/adapters/ferryProviderAdapter');
const { MultiModalRoutingEngine } = require('../services/multiModalRoutingEngine');

async function runTests() {
  console.log('================================================================');
  console.log('🚆 Train Multiplicity, Authentic Fares & Ferry Regression Suite');
  console.log('================================================================');

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

  // 1. High-demand corridor multiplicity (BBS -> NDLS)
  await test('1. Bhubaneswar (BBS) to New Delhi (NDLS) returns multiple verified direct trains', async () => {
    const sql = `
      SELECT DISTINCT t.train_number, t.train_name
      FROM train_schedules s1
      JOIN train_schedules s2 ON s1.train_number = s2.train_number
      JOIN trains t ON s1.train_number = t.train_number
      WHERE s1.station_code = 'BBS'
        AND s2.station_code = 'NDLS'
        AND s1.stop_sequence < s2.stop_sequence
    `;
    const directTrains = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
    assert.ok(directTrains.length >= 3, `Expected at least 3 direct trains for BBS->NDLS, found ${directTrains.length}`);

    const trainNumbers = directTrains.map(t => t.train_number);
    assert.ok(trainNumbers.includes('12801'), 'Must include 12801 Purushottam Express');
    assert.ok(trainNumbers.includes('20817'), 'Must include 20817 Bhubaneswar Tejas Rajdhani Express');
    assert.ok(trainNumbers.includes('12815') || trainNumbers.includes('12875'), 'Must include Nandan Kanan or Neelachal Express');
  });

  // 2. Class-specific fare variation (no identical fares across coach classes)
  await test('2. Fares are class-specific and reflect authentic railway fare tiers (1A > 2A > 3A > SL)', async () => {
    const fares12801 = await TrainFare.findAll({
      where: { train_number: '12801' },
      order: [['fare', 'ASC']]
    });
    assert.ok(fares12801.length >= 3, 'Purushottam Express must have at least SL, 3A, 2A fares');

    const fareMap = {};
    for (const f of fares12801) {
      fareMap[f.class_code] = f.fare;
    }

    assert.ok(fareMap['SL'] > 0, 'SL fare must be positive');
    assert.ok(fareMap['3A'] > fareMap['SL'], `3A fare (${fareMap['3A']}) must be higher than SL (${fareMap['SL']})`);
    assert.ok(fareMap['2A'] > fareMap['3A'], `2A fare (${fareMap['2A']}) must be higher than 3A (${fareMap['3A']})`);
  });

  // 3. Class isolation (Rajdhani cannot have Sleeper or Second Sitting)
  await test('3. Rajdhani express trains only support AC classes (no SL or 2S)', async () => {
    const rajdhaniFares = await TrainFare.findAll({
      where: { train_number: '20817' } // BBS Tejas Rajdhani
    });
    assert.ok(rajdhaniFares.length > 0, 'Rajdhani must have authentic fares');

    const classCodes = rajdhaniFares.map(f => f.class_code);
    assert.strictEqual(classCodes.includes('SL'), false, 'Rajdhani must NOT have Sleeper (SL) class');
    assert.strictEqual(classCodes.includes('2S'), false, 'Rajdhani must NOT have Second Sitting (2S) class');
    assert.ok(classCodes.includes('3A') || classCodes.includes('2A') || classCodes.includes('1A'), 'Rajdhani must support premium AC classes');
  });

  // 4. Vande Bharat class isolation (only EC and CC)
  await test('4. Vande Bharat express trains only support Chair Car classes (EC and CC)', async () => {
    const vbFares = await TrainFare.findAll({
      where: { train_number: '20834' } // TATA - PNBE Vande Bharat
    });
    assert.ok(vbFares.length > 0, 'Vande Bharat must have authentic fares');

    const classCodes = vbFares.map(f => f.class_code);
    assert.strictEqual(classCodes.includes('SL'), false, 'Vande Bharat must NOT have Sleeper (SL) class');
    assert.strictEqual(classCodes.includes('3A'), false, 'Vande Bharat must NOT have 3A class');
    assert.ok(classCodes.includes('CC'), 'Vande Bharat must support AC Chair Car (CC)');
    assert.ok(classCodes.includes('EC'), 'Vande Bharat must support Executive Chair Car (EC)');

    const ccFare = vbFares.find(f => f.class_code === 'CC')?.fare;
    const ecFare = vbFares.find(f => f.class_code === 'EC')?.fare;
    assert.ok(ecFare > ccFare, `Executive Class fare (${ecFare}) must exceed Chair Car (${ccFare})`);
  });

  // 5. Maritime Ferry Search Integration (Mumbai -> Mandwa Ro-Pax)
  await test('5. Ferry provider adapter discovers verified Ro-Pax services between Mumbai and Mandwa', async () => {
    const result = await searchFerriesFromProvider({
      originInput: 'Mumbai',
      destInput: 'Mandwa',
      departureDate: '2026-11-10'
    });

    assert.strictEqual(result.status, 'SUCCESS');
    assert.ok(result.ferries.length >= 2, `Expected at least 2 ferry services, found ${result.ferries.length}`);

    const first = result.ferries[0];
    assert.strictEqual(first.type, 'Ferry');
    assert.ok(first.service_name.includes('M2M') || first.service_number.includes('M2M'), 'Must be M2M Ro-Pax ferry');
    assert.ok(first.price > 0, 'Ferry price must be positive');
    assert.ok(first.available_classes.length > 0, 'Ferry must provide passenger and vehicle classes');
  });

  // 6. Kochi Water Metro Ferry Search Integration
  await test('6. Ferry provider discovers Kochi Water Metro between Ernakulam and Fort Kochi', async () => {
    const result = await searchFerriesFromProvider({
      originInput: 'Ernakulam',
      destInput: 'Fort Kochi',
      departureDate: '2026-11-10'
    });

    assert.strictEqual(result.status, 'SUCCESS');
    assert.ok(result.ferries.length >= 1, 'Expected at least 1 Kochi Water Metro service');
    const first = result.ferries[0];
    assert.ok(first.service_name.includes('Kochi Water Metro'), 'Must identify as Kochi Water Metro');
  });

  // 7. Universal Hub Routing Engine handles forceConnecting properly
  await test('7. MultiModalRoutingEngine discovers connecting routes without returning single direct trains', async () => {
    const routingEngine = new MultiModalRoutingEngine({ sequelize });
    const connectingDiscovery = await routingEngine.findConnectingRoutes('BBS', 'NDLS', '2026-11-10', { forceConnecting: true });

    assert.ok(connectingDiscovery !== null, 'Discovery result must be non-null');
    // If candidate hubs are evaluated, routes should be connecting chains with legs
    for (const r of (connectingDiscovery.routes || [])) {
      if (r.route_type === 'Connecting') {
        assert.ok(Array.isArray(r.legs) && r.legs.length >= 2, 'Connecting route must have at least 2 legs');
      }
    }
  });

  // 8. Delhi (NDLS/ANVT) to Ballia (BUI) returns authentic verified direct trains
  await test('8. Delhi (NDLS/ANVT) to Ballia (BUI) returns authentic verified direct trains', async () => {
    const sql = `
      SELECT DISTINCT t.train_number, t.train_name, t.runs_on
      FROM train_schedules s1
      JOIN train_schedules s2 ON s1.train_number = s2.train_number
      JOIN trains t ON s1.train_number = t.train_number
      WHERE s1.station_code IN ('NDLS', 'ANVT')
        AND s2.station_code = 'BUI'
        AND s1.stop_sequence < s2.stop_sequence
    `;
    const directTrains = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
    assert.ok(directTrains.length >= 4, `Expected at least 4 direct trains for Delhi -> BUI, found ${directTrains.length}`);
    const nos = directTrains.map(t => t.train_number);
    assert.ok(nos.includes('04096'), 'Must include 04096 PPTA FESTIVL SPL');
    assert.ok(nos.includes('04058'), 'Must include 04058 ANVT CPR SPL');
    assert.ok(nos.includes('20504'), 'Must include 20504 DBRG RAJDHANI');
    assert.ok(nos.includes('12562'), 'Must include 12562 Swatantrata Senani Exp');
  });

  // 9. Connecting route legs are fully normalized with non-blank service details
  await test('9. Connecting route legs are fully normalized with non-blank service details', async () => {
    const routingEngine = new MultiModalRoutingEngine({ sequelize });
    const connDiscovery = await routingEngine.findConnectingRoutes('NDLS', 'TATA', '2026-11-03', { forceConnecting: true });
    assert.ok(connDiscovery.routes && connDiscovery.routes.length > 0, 'Must find connecting routes');
    const firstRoute = connDiscovery.routes[0];
    assert.ok(Array.isArray(firstRoute.legs) && firstRoute.legs.length >= 2, 'Must have at least 2 legs');
    for (const leg of firstRoute.legs) {
      assert.ok(leg.service_name && leg.service_name.trim().length > 0, 'Leg must have valid service_name');
      assert.ok(leg.from_station && leg.from_station.trim().length > 0, 'Leg must have valid from_station');
      assert.ok(leg.to_station && leg.to_station.trim().length > 0, 'Leg must have valid to_station');
      assert.ok(leg.departure_time_clock, 'Leg must have valid departure_time_clock');
      assert.ok(leg.arrival_time_clock, 'Leg must have valid arrival_time_clock');
    }
  });

  console.log('================================================================');
  console.log(`Regression Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
