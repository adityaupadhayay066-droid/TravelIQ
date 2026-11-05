'use strict';
const path = require('path');
const { fork } = require('child_process');

const TEST_SUITES = [
  'authIsolationRegression.test.js',
  'paymentVerification.test.js',
  'bookingCreationRegression.test.js',
  'paymentIntegrityRegression.test.js',
  'shieldRegression.test.js',
  'sessionRevocationRegression.test.js',
  'checkoutContractRegression.test.js',
  'roleHierarchy.test.js',
  'mfaPasskeyHardening.test.js',
  'privateAttachments.test.js',
  'massAssignmentAndErrors.test.js',
  'hotelReservationIntegrity.test.js',
  'n8nPromptInjection.test.js',
  'securityHardening.test.js',
  'securityAndFareRegression.test.js',
  'routeValidation.test.js',
  'antiHallucinationRegression.test.js',
  'zeroGenerativeRouting.test.js',
  'multiModalRoutingEngine.test.js',
  'integration.test.js',
  'cybersecurityExpertHardening.test.js',
  'e2eVerification.test.js',
  'paymentOrderBindingRegression.test.js',
  'b2bBillingAndConcurrencyRegression.test.js',
  'trainDiscoveryAndBookingIntegrity.test.js',
  'bookingLifecycleIntegrityMatrix.test.js',
  'trainMultiplicityAndFerryRegression.test.js'
];

async function runSingleSuite(suiteFile) {
  const suitePath = path.resolve(__dirname, suiteFile);
  const startTime = Date.now();

  return new Promise((resolve) => {
    const child = fork(suitePath, [], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    child.on('exit', (code) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      resolve({
        suite: suiteFile,
        passed: code === 0,
        code,
        elapsed
      });
    });

    child.on('error', (err) => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      resolve({
        suite: suiteFile,
        passed: false,
        code: 1,
        elapsed,
        error: err.message
      });
    });
  });
}

async function runAll() {
  console.log('\n================================================================');
  console.log('🚀 TravelIQ Unified Test Runner — 27 Regression Test Suites');
  console.log('================================================================\n');

  const results = [];
  const overallStart = Date.now();

  for (let i = 0; i < TEST_SUITES.length; i++) {
    const suite = TEST_SUITES[i];
    console.log(`\n▶ [${i + 1}/${TEST_SUITES.length}] Executing suite: ${suite}...`);
    const res = await runSingleSuite(suite);
    results.push(res);
  }

  const overallElapsed = ((Date.now() - overallStart) / 1000).toFixed(2);

  console.log('\n\n================================================================');
  console.log('📊 TEST RUN SUMMARY REPORT');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (const r of results) {
    const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${statusIcon} [${r.elapsed}s] ${r.suite}`);
    if (r.passed) passedCount++;
    else failedCount++;
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Total Suites: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount} | Total Duration: ${overallElapsed}s`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});

