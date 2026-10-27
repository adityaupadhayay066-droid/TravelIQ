'use strict';
const assert = require('assert');
const jwt = require('jsonwebtoken');
const { protect, adminProtect } = require('../middleware/authMiddleware');
const { User, Session } = require('../models');

async function runAuthIsolationRegressionTests() {
  console.log('================================================================');
  console.log('🔒 Priority 0: Cross-Request Authentication Isolation Regression');
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

  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_isolation_testing_32chars!';

  // Prepare stubbed users and sessions
  const users = {
    101: { id: 101, email: 'alice@traveliq.com', role: 'user', account_status: 'active' },
    202: { id: 202, email: 'bob@traveliq.com', role: 'user', account_status: 'active' },
    999: { id: 999, email: 'admin@traveliq.com', role: 'admin', admin_role: 'super_admin', account_status: 'active' }
  };

  const sessions = {
    'sess-101': {
      session_id: 'sess-101',
      user_id: 101,
      expires_at: new Date(Date.now() + 3600000),
      save: async () => {},
      destroy: async () => {}
    },
    'sess-202': {
      session_id: 'sess-202',
      user_id: 202,
      expires_at: new Date(Date.now() + 3600000),
      save: async () => {},
      destroy: async () => {}
    },
    'sess-999': {
      session_id: 'sess-999',
      user_id: 999,
      expires_at: new Date(Date.now() + 3600000),
      save: async () => {},
      destroy: async () => {}
    }
  };

  // Mock Session.findOne and User.findByPk safely
  const originalFindOne = Session.findOne;
  const originalFindByPk = User.findByPk;

  Session.findOne = async ({ where }) => {
    const s = sessions[where.session_id];
    if (s && s.user_id === where.user_id) return s;
    return null;
  };

  User.findByPk = async (id) => {
    return users[id] || null;
  };

  function createMockRes() {
    return {
      statusCode: null,
      data: null,
      headersSent: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.data = obj;
        this.headersSent = true;
        return this;
      }
    };
  }

  const tokenA = jwt.sign({ id: 101, sessionId: 'sess-101' }, process.env.JWT_SECRET);
  const tokenC = jwt.sign({ id: 202, sessionId: 'sess-202' }, process.env.JWT_SECRET);
  const tokenAdmin = jwt.sign({ id: 999, sessionId: 'sess-999' }, process.env.JWT_SECRET);

  try {
    // ─── Test 1: Sequential Sequence Required by Audit ───
    await test('Request A (User 1) succeeds and authenticates User 1', async () => {
      const reqA = { cookies: {}, headers: { authorization: `Bearer ${tokenA}` } };
      const resA = createMockRes();
      let nextCalled = false;

      await protect(reqA, resA, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Request A must call next()');
      assert.strictEqual(resA.headersSent, false, 'No error response sent');
      assert.ok(reqA.user, 'reqA.user must be set');
      assert.strictEqual(reqA.user.id, 101, 'Request A must be user 101');
    });

    await test('Request B (Anonymous) must return 401 and NOT inherit User 1 credentials', async () => {
      // Ensure global.token does not leak
      assert.strictEqual(typeof global.token, 'undefined', 'global.token must NEVER exist!');

      const reqB = { cookies: {}, headers: {} };
      const resB = createMockRes();
      let nextCalled = false;

      await protect(reqB, resB, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, 'Anonymous Request B must NOT call next()');
      assert.strictEqual(resB.statusCode, 401, 'Request B must return 401');
      assert.strictEqual(reqB.user, null, 'reqB.user must be null');
    });

    await test('Request C (User 2) succeeds and authenticates ONLY User 2', async () => {
      const reqC = { cookies: { accessToken: tokenC }, headers: {} };
      const resC = createMockRes();
      let nextCalled = false;

      await protect(reqC, resC, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Request C must call next()');
      assert.strictEqual(resC.headersSent, false);
      assert.ok(reqC.user, 'reqC.user must be set');
      assert.strictEqual(reqC.user.id, 202, 'Request C must be user 202 (not 101)');
    });

    await test('Request D (Anonymous) must return 401 and NOT inherit User 2 credentials', async () => {
      const reqD = { cookies: {}, headers: {} };
      const resD = createMockRes();
      let nextCalled = false;

      await protect(reqD, resD, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, 'Anonymous Request D must NOT call next()');
      assert.strictEqual(resD.statusCode, 401, 'Request D must return 401');
      assert.strictEqual(reqD.user, null, 'reqD.user must be null');
    });

    await test('Anonymous request to adminProtect must NEVER inherit admin privileges from previous request', async () => {
      // Step 1: Admin request executes
      const reqAdmin = { cookies: {}, headers: { authorization: `Bearer ${tokenAdmin}` } };
      const resAdmin = createMockRes();
      let adminNext = false;
      await adminProtect(reqAdmin, resAdmin, () => { adminNext = true; });
      assert.strictEqual(adminNext, true, 'Admin request must succeed');
      assert.strictEqual(reqAdmin.user.role, 'admin');

      // Step 2: Anonymous request immediately follows
      const reqAnon = { cookies: {}, headers: {} };
      const resAnon = createMockRes();
      let anonNext = false;
      await adminProtect(reqAnon, resAnon, () => { anonNext = true; });

      assert.strictEqual(anonNext, false, 'Anonymous request must NOT succeed on admin route');
      assert.strictEqual(resAnon.statusCode, 401, 'Anonymous request must return 401');
      assert.strictEqual(reqAnon.user, null, 'reqAnon.user must be null');
    });

    // ─── Test 2: Concurrent Interleaved Execution ───
    await test('Concurrent interleaved requests maintain strict user isolation without leakage', async () => {
      const tasks = [];

      for (let i = 0; i < 50; i++) {
        const type = i % 4;
        if (type === 0) {
          // User A
          tasks.push(async () => {
            const req = { cookies: {}, headers: { authorization: `Bearer ${tokenA}` } };
            const res = createMockRes();
            let next = false;
            await protect(req, res, () => { next = true; });
            assert.strictEqual(next, true);
            assert.strictEqual(req.user.id, 101);
          });
        } else if (type === 1) {
          // Anonymous
          tasks.push(async () => {
            const req = { cookies: {}, headers: {} };
            const res = createMockRes();
            let next = false;
            await protect(req, res, () => { next = true; });
            assert.strictEqual(next, false);
            assert.strictEqual(res.statusCode, 401);
            assert.strictEqual(req.user, null);
          });
        } else if (type === 2) {
          // User B
          tasks.push(async () => {
            const req = { cookies: { accessToken: tokenC }, headers: {} };
            const res = createMockRes();
            let next = false;
            await protect(req, res, () => { next = true; });
            assert.strictEqual(next, true);
            assert.strictEqual(req.user.id, 202);
          });
        } else {
          // Anonymous to AdminProtect
          tasks.push(async () => {
            const req = { cookies: {}, headers: {} };
            const res = createMockRes();
            let next = false;
            await adminProtect(req, res, () => { next = true; });
            assert.strictEqual(next, false);
            assert.strictEqual(res.statusCode, 401);
            assert.strictEqual(req.user, null);
          });
        }
      }

      await Promise.all(tasks.map(t => t()));
      assert.strictEqual(typeof global.token, 'undefined', 'global.token must NEVER be set concurrently');
    });

  } finally {
    // Restore originals
    Session.findOne = originalFindOne;
    User.findByPk = originalFindByPk;
  }

  console.log(`\n================================================================`);
  console.log(`Auth Isolation Regression Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthIsolationRegressionTests().catch(err => {
  console.error('Fatal test error in auth isolation regression suite:', err);
  process.exit(1);
});
