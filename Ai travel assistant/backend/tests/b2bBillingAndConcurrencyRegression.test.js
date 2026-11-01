'use strict';
const assert = require('assert');
const crypto = require('crypto');
const apiKeyController = require('../controllers/apiKeyController');
const { requireApiKey } = require('../middleware/apiKeyMiddleware');
const { authenticateApiKey, generateKeySecret, hashApiKey, PLAN_CONFIGS } = require('../services/apiKeyService');
const securityController = require('../controllers/securityController');
const { User, Organization, ApiKey, Session, LoginHistory, sequelize } = require('../models');

async function runB2BBillingAndConcurrencyRegressionTests() {
  console.log('================================================================');
  console.log('⚡ P0/P1 — B2B Billing, Concurrency & Security Regression Suite');
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

  function createMockRes() {
    return {
      statusCode: null,
      data: null,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.data = obj;
        return this;
      },
      setHeader(k, v) {
        this.headers[k.toLowerCase()] = v;
      },
      on(event, handler) {
        this._finishHandler = handler;
      }
    };
  }

  let devUser, devOrg, testKeyRecord;

  try {
    const ts = Date.now();
    devUser = await User.create({
      name: 'Developer Test User',
      email: `dev_${ts}@example.com`,
      password: 'StrongDevPassword123!',
      role: 'user',
      account_status: 'active'
    });

    devOrg = await Organization.create({
      owner_id: devUser.id,
      name: 'Developer Workspace',
      plan_tier: 'free',
      monthly_quota: 100,
      used_quota: 0
    });

    // ─── Test 1: Direct enterprise upgrade is blocked ───
    await test('1. Free account cannot self-upgrade to enterprise without verified payment', async () => {
      const req = {
        user: devUser,
        body: { plan_tier: 'enterprise' }
      };
      const res = createMockRes();

      await apiKeyController.upgradeSubscription(req, res);
      assert.strictEqual(res.statusCode, 400, 'Must reject direct upgrade to paid tier');
      assert.ok(res.data.error.includes('require verified payment checkout'));

      const currentOrg = await Organization.findByPk(devOrg.id);
      assert.strictEqual(currentOrg.plan_tier, 'free', 'Organization plan tier must remain free');
    });

    // ─── Test 2: Client cannot supply arbitrary top_up_quota ───
    await test('2. Client cannot self-grant arbitrary top_up_quota (e.g. 1,000,000,000)', async () => {
      const req = {
        user: devUser,
        body: {
          top_up_quota: 1000000000,
          top_up_name: 'hacked_infinite_calls',
          payment_method: 'CARD'
        }
      };
      const res = createMockRes();

      await apiKeyController.initiateDeveloperPayment(req, res);
      assert.strictEqual(res.statusCode, 400, 'Must reject unsupported top-up pack');
      assert.ok(res.data.error.includes('Invalid top-up pack requested'));
    });

    // ─── Test 3: test_otp_hint is NOT returned to clients ───
    await test('3. initiateDeveloperPayment NEVER returns test_otp_hint or hardcoded OTPs in response', async () => {
      const req = {
        user: devUser,
        body: {
          plan_tier: 'pro',
          payment_method: 'CARD'
        }
      };
      const res = createMockRes();

      await apiKeyController.initiateDeveloperPayment(req, res);
      assert.strictEqual(res.statusCode, 200, 'Payment initiation must succeed');
      assert.strictEqual(res.data.test_otp_hint, undefined, 'test_otp_hint MUST NOT be returned in response');
      assert.strictEqual(res.data.otp, undefined, 'otp must not be exposed');
      assert.ok(res.data.order_id, 'order_id must be generated');
      assert.strictEqual(res.data.amount, PLAN_CONFIGS.pro.price_usd, 'Authoritative price derived from server catalog');
    });

    // ─── Test 4: verifyDeveloperPayment executes cleanly with crypto ───
    await test('4. verifyDeveloperPayment executes cleanly without ReferenceError: crypto is not defined', async () => {
      // Initiate a legitimate intent
      const initReq = {
        user: devUser,
        body: { plan_tier: 'starter', payment_method: 'CARD' }
      };
      const initRes = createMockRes();
      await apiKeyController.initiateDeveloperPayment(initReq, initRes);
      const orderId = initRes.data.order_id;

      // Attempt verification with an invalid code
      const verifyReq = {
        user: devUser,
        body: {
          order_id: orderId,
          verification_code: '000000'
        }
      };
      const verifyRes = createMockRes();

      await apiKeyController.verifyDeveloperPayment(verifyReq, verifyRes);
      assert.strictEqual(verifyRes.statusCode, 400, 'Invalid OTP must be rejected with 400');
      assert.ok(verifyRes.data.error.includes('Invalid Verification Code'), 'Must return verification code failure');
    });

    // ─── Test 5: Hardcoded OTP 849201 is rejected ───
    await test('5. Hardcoded OTP 849201 is rejected when not matching the server-issued challenge', async () => {
      const initReq = {
        user: devUser,
        body: { plan_tier: 'starter', payment_method: 'CARD' }
      };
      const initRes = createMockRes();
      await apiKeyController.initiateDeveloperPayment(initReq, initRes);
      const orderId = initRes.data.order_id;

      const verifyReq = {
        user: devUser,
        body: {
          order_id: orderId,
          verification_code: '849201' // previous hardcoded bypass code
        }
      };
      const verifyRes = createMockRes();

      await apiKeyController.verifyDeveloperPayment(verifyReq, verifyRes);
      assert.strictEqual(verifyRes.statusCode, 400, 'Hardcoded OTP 849201 must be rejected');
    });

    // ─── Test 6: Concurrency burst: exactly remaining quota succeeds, 0 overshoot ───
    await test('6. Concurrency burst: atomic quota deduction prevents overshoot when requests arrive simultaneously', async () => {
      // Set quota to 100 and used_quota to 98 (exactly 2 calls remain)
      await devOrg.update({
        monthly_quota: 100,
        used_quota: 98,
        billing_cycle_start: new Date()
      });

      const { rawKey, keyPrefix, keyHint, keyHash } = generateKeySecret('tiq_live_');
      testKeyRecord = await ApiKey.create({
        org_id: devOrg.id,
        name: 'Concurrency Test Key',
        key_prefix: keyPrefix,
        key_hint: keyHint,
        key_hash: keyHash,
        rate_limit_per_minute: 600 // high rate limit so rate limiter does not trigger
      });

      // Fire 20 concurrent requests simultaneously
      const burstSize = 20;
      const results = await Promise.all(
        Array.from({ length: burstSize }, () => authenticateApiKey(rawKey))
      );

      const succeeded = results.filter(r => r.valid === true).length;
      const rejectedQuota = results.filter(r => r.quotaExceeded === true).length;

      assert.strictEqual(succeeded, 2, `Exactly 2 requests must succeed (got ${succeeded})`);
      assert.strictEqual(rejectedQuota, 18, `Exactly 18 requests must be rejected with quotaExceeded (got ${rejectedQuota})`);

      // Verify DB state
      const finalOrg = await Organization.findByPk(devOrg.id);
      assert.strictEqual(finalOrg.used_quota, 100, 'used_quota must be exactly 100 and never overshoot');
    });

    // ─── Test 7: Per-minute rate limiting under burst ───
    await test('7. Per-minute rate limit rejects requests exceeding rate_limit_per_minute with Retry-After', async () => {
      // Create key with strict limit of 3 requests per minute
      const { rawKey, keyPrefix, keyHint, keyHash } = generateKeySecret('tiq_live_');
      const tightKey = await ApiKey.create({
        org_id: devOrg.id,
        name: 'Tight Rate Limit Key',
        key_prefix: keyPrefix,
        key_hint: keyHint,
        key_hash: keyHash,
        rate_limit_per_minute: 3
      });

      // Grant plenty of monthly quota
      await devOrg.update({ monthly_quota: 10000, used_quota: 0 });

      // Request 1: OK
      const r1 = await authenticateApiKey(rawKey);
      assert.strictEqual(r1.valid, true);

      // Request 2: OK
      const r2 = await authenticateApiKey(rawKey);
      assert.strictEqual(r2.valid, true);

      // Request 3: OK
      const r3 = await authenticateApiKey(rawKey);
      assert.strictEqual(r3.valid, true);

      // Request 4: Rate limited!
      const r4 = await authenticateApiKey(rawKey);
      assert.strictEqual(r4.valid, false);
      assert.strictEqual(r4.rateLimited, true);
      assert.ok(r4.retryAfterSeconds > 0, 'Must provide retryAfterSeconds');
    });

    // ─── Test 8: OPTIONS preflight to public API passes without API key ───
    await test('8. requireApiKey middleware allows browser OPTIONS preflight requests without X-API-Key', async () => {
      let nextCalled = false;
      const req = {
        method: 'OPTIONS',
        headers: {} // No X-API-Key
      };
      const res = createMockRes();
      const next = () => { nextCalled = true; };

      await requireApiKey(req, res, next);
      assert.strictEqual(nextCalled, true, 'OPTIONS request must pass to next() without requiring API key');
      assert.strictEqual(res.statusCode, null, 'Must not return 401 error on OPTIONS');
    });

    // ─── Test 9: Input validation on createApiKey & updateApiKey ───
    await test('9. createApiKey and updateApiKey reject invalid, non-string, or oversized names', async () => {
      const badReq1 = {
        user: devUser,
        body: { name: 12345 } // non-string
      };
      const res1 = createMockRes();
      await apiKeyController.createApiKey(badReq1, res1);
      assert.strictEqual(res1.statusCode, 400, 'Must reject non-string name');

      const badReq2 = {
        user: devUser,
        body: { name: 'A'.repeat(150) } // > 100 chars
      };
      const res2 = createMockRes();
      await apiKeyController.createApiKey(badReq2, res2);
      assert.strictEqual(res2.statusCode, 400, 'Must reject name > 100 chars');
    });

    // ─── Test 10: Nonexistent session revocation returns 404 ───
    await test('10. Revoking a nonexistent session returns 404 instead of claiming success', async () => {
      const req = {
        user: devUser,
        params: { sessionId: 'nonexistent-session-id-12345' }
      };
      const res = createMockRes();

      await securityController.revokeSession(req, res);
      assert.strictEqual(res.statusCode, 404, 'Must return 404 when session not found');
      assert.ok(res.data.message.includes('not found') || res.data.message.includes('already revoked'));
    });

  } finally {
    try {
      if (testKeyRecord) await ApiKey.destroy({ where: { org_id: devOrg?.id } });
      if (devOrg) await Organization.destroy({ where: { id: devOrg.id } });
      if (devUser) await User.destroy({ where: { id: devUser.id } });
    } catch (e) {
      // ignore cleanup
    }
  }

  console.log(`\n================================================================`);
  console.log(`B2B Billing & Concurrency Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runB2BBillingAndConcurrencyRegressionTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test runner fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runB2BBillingAndConcurrencyRegressionTests };

