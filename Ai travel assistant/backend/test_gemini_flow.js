const axios = require('axios');
const { getGroundedTransitData, generateGroundedResponse } = require('./services/deterministicRoutingService');

(async () => {
  console.log('Testing Transit Query with Gemini...');
  const res1 = await generateGroundedResponse('find a train from ndls to tata', 'ndls', 'tata', '2026-11-01');
  console.log('--- RES 1 (NDLS -> TATA) ---:');
  console.log('Source:', res1.source);
  console.log(res1.response);

  process.exit(0);
})();

