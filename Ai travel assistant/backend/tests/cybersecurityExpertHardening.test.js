'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Ensure env is loaded
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'tiq_super_secret_test_jwt_key_2026_xyz123!';
if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'tiq_super_secret_test_refresh_key_2026_xyz123!';

const { User, Session, Organization, ApiKey } = require('../models');
const { protect, adminProtect } = require('../middleware/authMiddleware');
const apiKeyController = require('../controllers/apiKeyController');
const adminController = require('../controllers/adminController');
const profileController = require('../controllers/profileController');

async function runCybersecurityTests() {
  console.log('================================================================');
  console.log('🛡️ Cybersecurity Expert: Deep Security Hardening Verification');
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

  // ─── Test 1: n8n Endpoints Require Administrator Authentication ───
  await test('1. n8n diagnostic endpoints (/status, /test) reject unauthenticated requests', async () => {
    const req = {
      headers: {},
      cookies: {}
    };
    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; },
      headersSent: false
    };

    await adminProtect(req, res, () => {
      throw new Error('Should not have reached next() without admin credentials');
    });

    assert.strictEqual(statusCode, 401, 'Anonymous request must be rejected with 401');
  });

  // ─── Test 2: Developer Platform Quota & Rate Limit Protection ───
  await test('2. createApiKey caps rate_limit_per_minute to organization plan tier maximum', async () => {
    // Create real test user to satisfy foreign key
    const [testUser] = await User.findOrCreate({
      where: { email: 'cyber_test@example.com' },
      defaults: {
        name: 'Cyber Tester',
        password: 'StrongPassword123!',
        role: 'user',
        account_status: 'active'
      }
    });

    const req = {
      user: testUser,
      body: {
        name: 'Hacked Key',
        rate_limit: 9999999 // Attempting to bypass free tier limit (60)
      }
    };

    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };

    await apiKeyController.createApiKey(req, res);
    assert.strictEqual(statusCode, 201);
    assert.ok(jsonBody.apiKey.rate_limit_per_minute <= 60, `Rate limit must be clamped to free tier max (60), got ${jsonBody.apiKey.rate_limit_per_minute}`);

    // Clean up
    await ApiKey.destroy({ where: { id: jsonBody.apiKey.id } }).catch(() => {});
  });

  await test('3. updateApiKey prevents privilege escalation via arbitrary rate limit increase', async () => {
    const [testUser] = await User.findOrCreate({
      where: { email: 'cyber_test@example.com' },
      defaults: {
        name: 'Cyber Tester',
        password: 'StrongPassword123!',
        role: 'user',
        account_status: 'active'
      }
    });
    const org = await Organization.findOne({ where: { owner_id: testUser.id } });
    
    // Create a key first
    const key = await ApiKey.create({
      org_id: org.id,
      name: 'Safe Key',
      key_prefix: 'tiq_test_',
      key_hint: '••••test',
      key_hash: 'dummyhash123',
      rate_limit_per_minute: 60
    });

    const req = {
      user: testUser,
      params: { keyId: key.id },
      body: {
        rate_limit_per_minute: 500000 // Attempting privilege escalation
      }
    };

    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };

    await apiKeyController.updateApiKey(req, res);
    assert.strictEqual(statusCode, 200);
    assert.ok(jsonBody.apiKey.rate_limit_per_minute <= 60, `Updated rate limit must remain capped to plan limit (60), got ${jsonBody.apiKey.rate_limit_per_minute}`);

    // Clean up
    await key.destroy().catch(() => {});
  });

  await test('4. upgradeSubscription blocks direct paid tier escalation without verified payment', async () => {
    const [testUser] = await User.findOrCreate({
      where: { email: 'cyber_test@example.com' },
      defaults: {
        name: 'Cyber Tester',
        password: 'StrongPassword123!',
        role: 'user',
        account_status: 'active'
      }
    });
    const req = {
      user: testUser,
      body: {
        plan_tier: 'enterprise', // Attempting free upgrade to enterprise
        top_up_quota: 500000
      }
    };

    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };

    await apiKeyController.upgradeSubscription(req, res);
    assert.strictEqual(statusCode, 400, 'Direct upgrade to enterprise must be rejected');
    assert.ok(jsonBody.error.includes('require verified payment checkout'));
  });

  await test('5. verifyDeveloperPayment strictly rejects order ID belonging to another user or org (IDOR)', async () => {
    const [attackerUser] = await User.findOrCreate({
      where: { email: 'attacker@example.com' },
      defaults: {
        name: 'Attacker User',
        password: 'StrongPassword123!',
        role: 'user',
        account_status: 'active'
      }
    });
    const req = {
      user: attackerUser,
      body: {
        order_id: 'TIQ_NON_EXISTENT_OR_OTHER_USER_ORDER',
        verification_code: '849201'
      }
    };

    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };

    await apiKeyController.verifyDeveloperPayment(req, res);
    assert.strictEqual(statusCode, 404, 'Must reject nonexistent or cross-user payment intent');
  });

  // ─── Test 3: SQL Injection Whitelisting in Dynamic ORDER BY ───
  await test('6. adminController.getUsers safely handles malicious sortBy and order parameters', async () => {
    const req = {
      query: {
        sortBy: 'SLEEP(5)--', // SQL Injection probe
        order: 'DESC; DROP TABLE users;'
      }
    };

    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };

    // Should NOT throw SQL syntax error; safeSortBy should fall back to created_at
    await adminController.getUsers(req, res);
    assert.ok(jsonBody && jsonBody.users, 'Must safely return users without executing injected SQL');
  });

  // ─── Test 4: CSV Formula Injection (CWE-1236) Protection ───
  await test('7. adminController.exportReport neutralizes CSV Formula Injection (=, +, -, @)', async () => {
    // Create temporary user with formula injection payload
    const exploitUser = await User.create({
      name: '=cmd|\'/C calc\'!\'A0\'',
      email: '+malicious_formula@example.com',
      password: 'StrongPassword123!',
      role: 'user',
      account_status: 'active'
    });

    const req = {
      params: { type: 'users' }
    };

    let responseHeaders = {};
    let responseBody = '';
    const res = {
      setHeader(k, v) { responseHeaders[k] = v; },
      status(c) { return this; },
      send(data) { responseBody = data; return this; }
    };

    await adminController.exportReport(req, res);

    assert.ok(responseBody.includes("'=cmd|"), 'Formula starting with = must be escaped with leading quote');
    assert.ok(responseBody.includes("'+malicious_formula"), 'Formula starting with + must be escaped with leading quote');

    // Clean up
    await exploitUser.destroy().catch(() => {});
  });

  await test('8. adminController.exportReport rejects invalid or malicious export types', async () => {
    const req = {
      params: { type: '../../../etc/passwd' }
    };

    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };

    await adminController.exportReport(req, res);
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonBody.message, 'Invalid export report type.');
  });

  // ─── Test 5: Safe Avatar Path Resolution ───
  await test('9. profileController safely prevents path traversal during avatar removal', async () => {
    // Create test user with malicious profile_image traversal string
    const testUser = await User.create({
      name: 'Traversal Tester',
      email: 'traversal@example.com',
      password: 'StrongPassword123!',
      profile_image: '../../../../package.json', // Attempting to delete package.json
      role: 'user',
      account_status: 'active'
    });

    const req = { user: { id: testUser.id } };
    let jsonBody = null;
    const res = {
      status(c) { return this; },
      json(b) { jsonBody = b; return this; }
    };

    await profileController.removeAvatar(req, res);
    assert.strictEqual(jsonBody.message, 'Avatar removed');

    // Verify package.json still exists and was NOT deleted!
    assert.ok(fs.existsSync(path.resolve(__dirname, '../package.json')), 'package.json must NOT be deleted by path traversal');

    // Clean up
    await testUser.destroy().catch(() => {});
  });

  // ─── Test 6: JWT Algorithm Pinning (HS256) ───
  await test('10. authMiddleware strictly rejects tokens with none algorithm or unsupported algorithms', async () => {
    const req = {
      headers: {
        authorization: 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6OTk5OSwic2Vzc2lvbklkIjoiYWJjIiwicm9sZSI6ImFkbWluIn0.'
      },
      cookies: {}
    };

    let statusCode = null;
    let jsonBody = null;
    const res = {
      status(c) { statusCode = c; return this; },
      json(b) { jsonBody = b; return this; }
    };

    await protect(req, res, () => {
      throw new Error('None algorithm token should never reach next()');
    });

    assert.strictEqual(statusCode, 401, 'None algorithm token must return 401');
  });

  console.log('\n================================================================');
  console.log(`Cybersecurity Hardening Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCybersecurityTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
