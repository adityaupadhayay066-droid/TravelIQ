'use strict';
const assert = require('assert');
const crypto = require('crypto');
const { 
  antiScrapingShield, 
  honeypotTrapHandler, 
  blacklistIP, 
  isIPBlacklisted, 
  getClientIP, 
  clearBlacklistForTest 
} = require('../middleware/antiScrapingMiddleware');

async function runShieldRegressionTests() {
  console.log('================================================================');
  console.log('🛡️  Phase 5: Anti-Scraping Shield & Network Integrity Suite');
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

  function createMockReq({ url = '/api/health', originalUrl, path, baseUrl = '/api', method = 'GET', headers = {}, remoteAddress = '203.0.113.10' } = {}) {
    return {
      url: url,
      originalUrl: originalUrl || url,
      baseUrl: baseUrl,
      path: path !== undefined ? path : (url.startsWith(baseUrl) ? url.slice(baseUrl.length) : url),
      method,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ...headers
      },
      socket: { remoteAddress },
      connection: { remoteAddress },
      ip: remoteAddress
    };
  }

  function createMockRes() {
    return {
      statusCode: 200,
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

  try {
    clearBlacklistForTest();

    // 1. /api/health using browser-like and non-browser clients
    await test('1. /api/health succeeds for browser and non-browser clients (exempted from shield)', async () => {
      const uas = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'curl/7.88.1',
        'python-requests/2.31.0',
        'node-fetch/3.3.0',
        'axios/1.6.0',
        'Go-http-client/1.1',
        'Java/17.0.1'
      ];

      for (const ua of uas) {
        const req = createMockReq({ url: '/api/health', originalUrl: '/api/health', headers: { 'user-agent': ua } });
        const res = createMockRes();
        let nextCalled = false;
        await antiScrapingShield(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true, `/api/health must allow User-Agent: ${ua}`);
        assert.strictEqual(res.statusCode, 200);
      }
    });

    // 2. Valid payment webhook path exemption
    await test('2. Payment webhook path (/api/payment/webhook) is exempted from shield checks', async () => {
      const req = createMockReq({
        url: '/api/payment/webhook',
        originalUrl: '/api/payment/webhook',
        method: 'POST',
        headers: { 'user-agent': 'Razorpay/v1 Webhook Notifier' }
      });
      const res = createMockRes();
      let nextCalled = false;
      await antiScrapingShield(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Payment webhook must pass shield to reach signature handler');
    });

    // 3. n8n webhook callback path exemption
    await test('3. n8n webhook callback path (/api/n8n/webhook) is exempted from shield checks', async () => {
      const req = createMockReq({
        url: '/api/n8n/webhook/traveliq-booking',
        originalUrl: '/api/n8n/webhook/traveliq-booking',
        method: 'POST',
        headers: { 'user-agent': 'n8n-workflow-executor/1.0' }
      });
      const res = createMockRes();
      let nextCalled = false;
      await antiScrapingShield(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'n8n webhook callback must pass shield to reach handler');
    });

    // 4. curl User-Agent on standard API endpoints
    await test('4. curl User-Agent is NOT blocked by shield on standard API endpoints', async () => {
      const req = createMockReq({
        url: '/api/travel/stations',
        originalUrl: '/api/travel/stations',
        headers: { 'user-agent': 'curl/8.4.0' }
      });
      const res = createMockRes();
      let nextCalled = false;
      await antiScrapingShield(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'curl must not be blanket-blocked');
    });

    // 5. Python requests User-Agent on standard API endpoints
    await test('5. Python requests User-Agent is NOT blocked by shield on standard API endpoints', async () => {
      const req = createMockReq({
        url: '/api/travel/stations',
        originalUrl: '/api/travel/stations',
        headers: { 'user-agent': 'python-requests/2.28.1' }
      });
      const res = createMockRes();
      let nextCalled = false;
      await antiScrapingShield(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'python-requests must not be blanket-blocked');
    });

    // 6. Node fetch and axios clients
    await test('6. Node fetch and axios clients are NOT blocked by shield', async () => {
      for (const ua of ['node-fetch/1.0', 'axios/1.4.0']) {
        const req = createMockReq({
          url: '/api/travel/stations',
          originalUrl: '/api/travel/stations',
          headers: { 'user-agent': ua }
        });
        const res = createMockRes();
        let nextCalled = false;
        await antiScrapingShield(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true, `${ua} must not be blanket-blocked`);
      }
    });

    // 7. Go and Java User-Agents
    await test('7. Go and Java User-Agents are NOT blocked by shield', async () => {
      for (const ua of ['Go-http-client/1.1', 'Java/11.0.18']) {
        const req = createMockReq({
          url: '/api/travel/stations',
          originalUrl: '/api/travel/stations',
          headers: { 'user-agent': ua }
        });
        const res = createMockRes();
        let nextCalled = false;
        await antiScrapingShield(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, true, `${ua} must not be blanket-blocked`);
      }
    });

    // 8. Known malicious scraper bot detection (e.g., sqlmap, nikto, scrapy)
    await test('8. Malicious automated scanners and scrapers (sqlmap, scrapy) ARE blocked with 403', async () => {
      const maliciousUAs = ['sqlmap/1.7#stable', 'Scrapy/2.11.0 (+https://scrapy.org)'];

      for (const ua of maliciousUAs) {
        const req = createMockReq({
          url: '/api/travel/search',
          originalUrl: '/api/travel/search',
          headers: { 'user-agent': ua },
          remoteAddress: `198.51.100.${Math.floor(Math.random() * 200) + 1}`
        });
        const res = createMockRes();
        let nextCalled = false;
        await antiScrapingShield(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false, `Scraper ${ua} must be blocked`);
        assert.strictEqual(res.statusCode, 403);
      }
    });

    // 9. Spoofed X-Forwarded-For cannot poison or blacklist a victim IP
    await test('9. Direct caller sending spoofed X-Forwarded-For cannot blacklist victim IP', async () => {
      const victimIP = '198.51.100.99';
      const attackerIP = '203.0.113.50';

      // Attacker directly connects from attackerIP, but sends X-Forwarded-For: victimIP into honeypot
      const req = {
        url: '/api/scrapers/crawler-trap',
        originalUrl: '/api/scrapers/crawler-trap',
        headers: {
          'x-forwarded-for': victimIP,
          'user-agent': 'Scrapy/2.8'
        },
        socket: { remoteAddress: attackerIP },
        connection: { remoteAddress: attackerIP },
        ip: attackerIP
      };
      const res = createMockRes();
      await honeypotTrapHandler(req, res);

      assert.strictEqual(res.statusCode, 403);

      // Victim IP must NOT be blacklisted!
      const victimStatus = isIPBlacklisted(victimIP);
      assert.strictEqual(victimStatus, false, 'Victim IP must NOT be blacklisted due to spoofed header');

      // Attacker's real IP MUST be blacklisted
      const attackerStatus = isIPBlacklisted(attackerIP);
      assert.ok(attackerStatus, 'Attacker socket IP must be blacklisted');
    });

    // 10. Trusted proxy hops evaluate properly
    await test('10. Configured trusted proxy hops resolve client IP correctly', async () => {
      const trustedProxyIP = '10.0.0.1';
      process.env.TRUSTED_PROXY_IPS = trustedProxyIP;

      const req = {
        headers: { 'x-forwarded-for': '203.0.113.88' },
        socket: { remoteAddress: trustedProxyIP },
        ip: '203.0.113.88'
      };

      const resolvedIP = getClientIP(req);
      assert.strictEqual(resolvedIP, '203.0.113.88', 'Should trust client IP behind trusted proxy');
      delete process.env.TRUSTED_PROXY_IPS;
    });

    // 11. Legitimate requests from victim IP succeed after spoofing attempt
    await test('11. Legitimate requests from victim IP succeed normally after spoofing attempt', async () => {
      const victimIP = '198.51.100.99';
      const req = createMockReq({
        url: '/api/travel/stations',
        originalUrl: '/api/travel/stations',
        remoteAddress: victimIP,
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const res = createMockRes();
      let nextCalled = false;
      await antiScrapingShield(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Legitimate victim requests must proceed unimpeded');
    });

    // 12. Catalog velocity throttling evaluates accurately on real route paths
    await test('12. Catalog velocity throttling triggers 429 when threshold exceeded', async () => {
      const crawlerIP = '198.51.100.44';
      let triggered429 = false;

      for (let i = 0; i < 22; i++) {
        const req = createMockReq({
          url: '/api/travel/search',
          originalUrl: '/api/travel/search',
          baseUrl: '/api',
          path: '/travel/search',
          remoteAddress: crawlerIP,
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const res = createMockRes();
        let nextCalled = false;
        await antiScrapingShield(req, res, () => { nextCalled = true; });

        if (res.statusCode === 429) {
          triggered429 = true;
          break;
        }
      }

      assert.strictEqual(triggered429, true, 'Catalog velocity throttle must return 429 for burst scraping');
    });

    // 13. Blacklisted IP is rejected immediately on subsequent requests
    await test('13. Blacklisted IP is rejected immediately on subsequent requests with 403', async () => {
      const blockedIP = '198.51.100.44'; // Blacklisted by test 12
      const req = createMockReq({
        url: '/api/travel/stations',
        originalUrl: '/api/travel/stations',
        remoteAddress: blockedIP
      });
      const res = createMockRes();
      let nextCalled = false;
      await antiScrapingShield(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.data.error.includes('Access Denied'));
    });

    // 14. Blacklist expiry automatically unblocks IP after duration
    await test('14. Blacklist entry automatically unblocks after duration expires', async () => {
      const expiringIP = '198.51.100.77';
      // Blacklist for 10ms
      await blacklistIP(expiringIP, 'Short duration test', 10);
      assert.ok(isIPBlacklisted(expiringIP), 'Should be blacklisted initially');

      // Wait 25ms for expiry
      await new Promise(r => setTimeout(r, 25));

      const statusAfterExpiry = isIPBlacklisted(expiringIP);
      assert.strictEqual(statusAfterExpiry, false, 'IP must be unblocked after expiry');
    });

  } finally {
    clearBlacklistForTest();
  }

  console.log('\n================================================================');
  console.log(`Shield Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runShieldRegressionTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

