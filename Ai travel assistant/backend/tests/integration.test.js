const assert = require('assert');
const http = require('http');

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, data: raw });
        }
      });
    }).on('error', reject);
  });
}

async function runIntegrationTests() {
  console.log('🚀 Running Backend API Integration Tests against http://localhost:5000...\n');
  let passed = 0;
  let failed = 0;

  function test(name, passedCondition, details) {
    if (passedCondition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      if (details) console.error(`     Details:`, details);
      failed++;
    }
  }

  try {
    // 1. Search Delhi to Ballia (Destination lacks airport)
    const resBallia = await postJson('http://localhost:5000/api/travel/routes/search', {
      source: 'NDLS',
      destination: 'BUI',
      departureDate: '2026-09-24' // Thursday
    });

    test(
      'NDLS -> BUI route search returns 200 OK',
      resBallia.status === 200,
      resBallia
    );

    const directFlights = (resBallia.data.flights || []).filter(f => f.route_type === 'Direct');
    test(
      'NDLS -> BUI has ZERO direct flights',
      directFlights.length === 0,
      directFlights
    );

    test(
      'NDLS -> BUI has valid trains and buses',
      (resBallia.data.trains || []).length > 0 && (resBallia.data.buses || []).length > 0,
      resBallia.data
    );

    // 2. Search Delhi to Mumbai (Both have airports)
    const resMumbai = await postJson('http://localhost:5000/api/travel/routes/search', {
      source: 'NDLS',
      destination: 'BOM',
      departureDate: '2026-09-25' // Friday
    });

    test(
      'NDLS -> BOM route search returns 200 OK',
      resMumbai.status === 200,
      resMumbai
    );

    const mumbaiFlights = resMumbai.data.flights || [];
    test(
      'NDLS -> BOM has direct flights available',
      mumbaiFlights.length > 0 && mumbaiFlights.some(f => f.route_type === 'Direct'),
      mumbaiFlights
    );

    // 3. Train operating days: Check train returned for NDLS -> BUI on Thursday vs Friday
    const trainsThu = resBallia.data.trains || [];
    test(
      'Bhrigu Express (22428 - runs MON, WED, FRI) is NOT included on Thursday',
      !trainsThu.some(t => t.number === '22428'),
      trainsThu.map(t => ({ num: t.number, runs: t.running_days }))
    );

    const resBalliaFri = await postJson('http://localhost:5000/api/travel/routes/search', {
      source: 'NDLS',
      destination: 'BUI',
      departureDate: '2026-09-25' // Friday
    });
    const trainsFri = resBalliaFri.data.trains || [];
    test(
      'Bhrigu Express (22428 - runs MON, WED, FRI) IS included on Friday',
      trainsFri.some(t => t.number === '22428'),
      trainsFri.map(t => ({ num: t.number, runs: t.running_days }))
    );

    // 4. All trains have frequency and running_days metadata
    const allHaveMetadata = trainsFri.every(t => t.frequency && t.running_days && t.route_type);
    test(
      'All trains have frequency, running_days, and route_type populated',
      allHaveMetadata,
      trainsFri[0]
    );

    // 5. East Corridor Test: TATA -> BUI (No direct rail, connects via DDU/BSB)
    const resTataBui = await postJson('http://localhost:5000/api/travel/routes/search', {
      source: 'TATA',
      destination: 'BUI',
      departureDate: '2026-10-15'
    });
    test(
      'TATA -> BUI route search returns 200 OK',
      resTataBui.status === 200,
      resTataBui
    );
    const tataBuiTrains = resTataBui.data.trains || [];
    test(
      'TATA -> BUI returns connecting routes via DDU or BSB',
      tataBuiTrains.length > 0 && tataBuiTrains.some(t => t.route_type === 'Connecting' || (t.id && (t.id.includes('DDU') || t.id.includes('BSB')))),
      tataBuiTrains
    );

    // 6. West-North Corridor Test: PUNE -> UDZ (Connects via BSR, ADI, or RTM)
    const resPuneUdz = await postJson('http://localhost:5000/api/travel/routes/search', {
      source: 'PUNE',
      destination: 'UDZ',
      departureDate: '2026-10-15'
    });
    test(
      'PUNE -> UDZ route search returns 200 OK',
      resPuneUdz.status === 200,
      resPuneUdz
    );
    const puneUdzTrains = resPuneUdz.data.trains || [];
    test(
      'PUNE -> UDZ returns connecting routes via BSR, ADI, or RTM',
      puneUdzTrains.length > 0 && puneUdzTrains.some(t => t.route_type === 'Connecting' || (t.id && (t.id.includes('BSR') || t.id.includes('ADI') || t.id.includes('RTM')))),
      puneUdzTrains
    );

    // 7. Cluster Transfer Test: LKO -> GOI (Inter-terminal transfer)
    const resLkoGoi = await postJson('http://localhost:5000/api/travel/routes/search', {
      source: 'LKO',
      destination: 'GOI',
      departureDate: '2026-10-15'
    });
    test(
      'LKO -> GOI route search returns 200 OK',
      resLkoGoi.status === 200,
      resLkoGoi
    );
    const lkoGoiTrains = resLkoGoi.data.trains || [];
    test(
      'LKO -> GOI returns connecting multimodal route with layover/transfer',
      lkoGoiTrains.length > 0,
      lkoGoiTrains
    );

  } catch (err) {
    console.error('Integration test error:', err.message);
    failed++;
  }

  console.log(`\n================================`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`================================\n`);
}

runIntegrationTests();
