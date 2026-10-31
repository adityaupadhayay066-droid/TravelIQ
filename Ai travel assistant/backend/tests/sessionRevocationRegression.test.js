'use strict';
const assert = require('assert');
const jwt = require('jsonwebtoken');
const { refreshSession } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { User, Session, RefreshToken, sequelize } = require('../models');

async function runSessionRevocationRegressionTests() {
  console.log('================================================================');
  console.log('🔒 Phase 7: Session Reuse Detection & Token Revocation Suite');
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
      statusCode: 200,
      data: null,
      cookiesSet: {},
      cookiesCleared: [],
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.data = obj;
        return this;
      },
      cookie(name, val, opts) {
        this.cookiesSet[name] = val;
      },
      clearCookie(name) {
        this.cookiesCleared.push(name);
      }
    };
  }

  const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_traveliq_2026';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_super_secret_2026';

  let testUser, sessionId, accessToken, oldRefreshToken;

  try {
    testUser = await User.create({
      name: 'Session Test User',
      email: `session_test_${Date.now()}@example.com`,
      password: 'StrongPassword123!@#',
      role: 'user',
      account_status: 'active'
    });

    sessionId = `sess_${Date.now()}`;

    // Create active session in DB
    await Session.create({
      session_id: sessionId,
      user_id: testUser.id,
      device_id: 'test_device_1',
      device_type: 'desktop',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Generate JWT access token
    accessToken = jwt.sign(
      { id: testUser.id, role: 'user', sessionId },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Generate refresh token
    const rawRefreshToken = jwt.sign(
      { id: testUser.id, sessionId },
      refreshSecret,
      { expiresIn: '7d' }
    );

    oldRefreshToken = await RefreshToken.create({
      user_id: testUser.id,
      token: rawRefreshToken,
      device_id: 'test_device_1',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false
    });

  } catch (err) {
    console.error('Test setup error:', err);
  }

  try {
    // 1. Initial valid access token works on protected endpoint
    await test('1. Active access token successfully authenticates via protect middleware', async () => {
      const req = {
        cookies: { accessToken },
        headers: {}
      };
      const res = createMockRes();
      let nextCalled = false;
      await protect(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, 'Protect middleware must permit valid token');
      assert.strictEqual(req.user.id, testUser.id);
      assert.strictEqual(req.sessionId, sessionId);
    });

    // 2. Normal token rotation: first refresh invalidates old token
    let newRefreshTokenStr;
    await test('2. Normal token refresh rotates refresh token and marks previous token as revoked', async () => {
      const req = {
        cookies: { refreshToken: oldRefreshToken.token },
        headers: {},
        ip: '127.0.0.1'
      };
      const res = createMockRes();
      await refreshSession(req, res);
      if (res.statusCode !== 200) {
        console.log('Test 2 401 response:', res.data);
      }

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.accessToken, 'Must issue new access token');
      assert.ok(res.data.refreshToken, 'Must issue new rotated refresh token');

      newRefreshTokenStr = res.data.refreshToken;

      // Verify old refresh token in DB is now marked revoked
      await oldRefreshToken.reload();
      assert.strictEqual(oldRefreshToken.revoked, true, 'Old refresh token must be revoked');
    });

    // 3. Token reuse detection: Replaying revoked old token terminates ALL sessions
    await test('3. Token reuse detection: Replaying revoked token terminates all sessions and revokes all refresh tokens', async () => {
      const reuseReq = {
        cookies: { refreshToken: oldRefreshToken.token }, // Replaying already-revoked token!
        headers: {},
        ip: '127.0.0.1'
      };
      const reuseRes = createMockRes();
      await refreshSession(reuseReq, reuseRes);

      assert.strictEqual(reuseRes.statusCode, 401);
      assert.ok(
        reuseRes.data.message.includes('Token reuse detected') || reuseRes.data.message.includes('Compromised refresh token'),
        `Expected reuse alert message, got: ${reuseRes.data.message}`
      );

      // Verify all sessions for user in DB are destroyed
      const remainingSessions = await Session.count({ where: { user_id: testUser.id } });
      assert.strictEqual(remainingSessions, 0, 'ALL sessions for user must be destroyed');

      // Verify all refresh tokens for user in DB are marked revoked
      const unrevokedTokens = await RefreshToken.count({ where: { user_id: testUser.id, revoked: false } });
      assert.strictEqual(unrevokedTokens, 0, 'ALL refresh tokens for user must be revoked');
    });

    // 4. Revoked access tokens are rejected by protected endpoints after session termination
    await test('4. Previously valid access token is strictly rejected (401) after session revocation', async () => {
      const req = {
        cookies: { accessToken },
        headers: {}
      };
      const res = createMockRes();
      let nextCalled = false;
      await protect(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, 'Revoked session access token must NOT pass protect middleware');
      assert.strictEqual(res.statusCode, 401);
      assert.ok(
        res.data.message.includes('Session revoked') || res.data.message.includes('expired'),
        `Expected session revoked message, got: ${res.data.message}`
      );
    });

  } finally {
    // Cleanup
    if (testUser) {
      await Session.destroy({ where: { user_id: testUser.id } });
      await RefreshToken.destroy({ where: { user_id: testUser.id } });
      await User.destroy({ where: { id: testUser.id } });
    }
  }

  console.log('\n================================================================');
  console.log(`Session Revocation Regression Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSessionRevocationRegressionTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
