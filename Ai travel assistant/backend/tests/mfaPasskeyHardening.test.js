'use strict';
const assert = require('assert');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { verifyPasskeyRegister } = require('../controllers/securityController');
const { User, UserSecurity, OtpVerification, Session } = require('../models');

async function runMfaPasskeyHardeningTests() {
  console.log('================================================================');
  console.log('🔒 Priority 5: MFA, OTP, Backup Codes, and Passkey Regression Suite');
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
  const authController = require('../controllers/authController');
  const { RefreshToken, LoginHistory, SecurityAlert, UserActivityLog } = require('../models');

  // Stub DB writes for session/audit logs so unit tests run cleanly without foreign key constraints
  Session.create = async (data) => data;
  RefreshToken.create = async (data) => data;
  LoginHistory.create = async (data) => data;
  SecurityAlert.create = async (data) => data;
  UserActivityLog.create = async (data) => data;

  // Helper mocks
  function createMockRes() {
    const res = {
      statusCode: 200,
      headers: {},
      cookies: {},
      body: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      cookie: function(name, val, opts) {
        this.cookies[name] = { val, opts };
        return this;
      }
    };
    return res;
  }

  // ─── Test 1: verify2FA requires valid challengeToken ───
  await test('verify2FA rejects requests missing challengeToken (User ID alone cannot authorize)', async () => {
    const req = {
      body: { userId: 1, otpCode: '123456' },
      headers: {},
      ip: '127.0.0.1'
    };
    const res = createMockRes();
    await authController.verify2FA(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert(res.body.message.includes('challenge token are required'));
  });

  // ─── Test 2: verify2FA rejects invalid/forged challengeToken ───
  await test('verify2FA rejects invalid or mismatched challengeToken', async () => {
    const forgedToken = jwt.sign(
      { userId: 999, email: 'attacker@evil.com', purpose: '2fa_challenge' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    const req = {
      body: { userId: 1, otpCode: '123456', challengeToken: forgedToken },
      headers: {},
      ip: '127.0.0.1'
    };
    const res = createMockRes();
    await authController.verify2FA(req, res);

    assert.strictEqual(res.statusCode, 401);
    assert(res.body.message.includes('Unauthorized login challenge'));
  });

  // ─── Test 3: Backup codes stored securely as SHA-256 hashes ───
  await test('generateBackupCodes stores SHA-256 hashes and never plaintext in DB', async () => {
    const securityController = require('../controllers/securityController');
    const mockUser = { id: 888, email: 'test@traveliq.com', role: 'user' };
    
    // Stub UserSecurity
    let savedSec = null;
    const origFindOne = UserSecurity.findOne;
    const origCreate = UserSecurity.create;

    UserSecurity.findOne = async () => ({
      user_id: 888,
      backup_codes: [],
      save: async function() { savedSec = this; }
    });

    const req = { user: mockUser, ip: '127.0.0.1' };
    const res = createMockRes();
    await securityController.generateBackupCodes(req, res);

    UserSecurity.findOne = origFindOne;
    UserSecurity.create = origCreate;

    assert.strictEqual(res.statusCode, 200);
    assert(Array.isArray(res.body.codes));
    assert.strictEqual(res.body.codes.length, 10);

    // Verify plaintext codes returned to user are 16 hex chars
    assert.strictEqual(res.body.codes[0].length, 16);

    // Verify saved representation in DB contains 64-char SHA-256 hashes, not plaintext
    assert(savedSec);
    assert.strictEqual(savedSec.backup_codes.length, 10);
    assert.strictEqual(savedSec.backup_codes[0].length, 64);
    assert.notStrictEqual(savedSec.backup_codes[0], res.body.codes[0]);

    // Verify hash matches
    const expectedHash = crypto.createHash('sha256').update(res.body.codes[0]).digest('hex');
    assert.strictEqual(savedSec.backup_codes[0], expectedHash);
  });

  // ─── Test 4: Single-use consumption of backup code ───
  await test('Single-use backup code: used code is removed from UserSecurity and cannot be reused', async () => {
    const rawCode = 'A1B2C3D4E5F67890';
    const hashCode = crypto.createHash('sha256').update(rawCode).digest('hex');

    const fakeUser = {
      id: 777,
      email: 'user777@traveliq.com',
      role: 'user',
      trusted_devices: [],
      save: async () => {}
    };

    let userSecRecord = {
      user_id: 777,
      backup_codes: [hashCode, 'other_code_hash'],
      save: async function() {}
    };

    const origUserFind = User.findByPk;
    const origSecFind = UserSecurity.findOne;
    const origCreateSession = authController.createSessionAndLog;

    User.findByPk = async (id) => (id === 777 ? fakeUser : null);
    UserSecurity.findOne = async () => userSecRecord;

    const validChallenge = jwt.sign(
      { userId: 777, email: 'user777@traveliq.com', purpose: '2fa_challenge' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    // First use: should succeed and remove code
    const req1 = {
      body: { userId: 777, otpCode: rawCode, challengeToken: validChallenge },
      headers: {},
      ip: '127.0.0.1'
    };
    const res1 = createMockRes();
    await authController.verify2FA(req1, res1);

    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(userSecRecord.backup_codes.includes(hashCode), false);

    // Second use: must fail because code was consumed
    const req2 = {
      body: { userId: 777, otpCode: rawCode, challengeToken: validChallenge },
      headers: {},
      ip: '127.0.0.1'
    };
    const res2 = createMockRes();
    await authController.verify2FA(req2, res2);

    assert.strictEqual(res2.statusCode, 400);

    User.findByPk = origUserFind;
    UserSecurity.findOne = origSecFind;
  });

  // ─── Test 5: Client-supplied device_id alone cannot bypass 2FA ───
  await test('Client-supplied device_id cannot skip 2FA without valid signed trusted_device_token cookie', async () => {
    const fakeUser = {
      id: 555,
      email: 'device_test@traveliq.com',
      role: 'user',
      trusted_devices: ['stolen-trusted-device-uuid-999'],
      account_status: 'active',
      matchPassword: async () => true,
      save: async () => {}
    };

    const origUserFind = User.findOne;
    const origSecFind = UserSecurity.findOne;
    const origOtpCreate = OtpVerification.create;
    User.findOne = async () => fakeUser;
    UserSecurity.findOne = async () => ({ two_factor_enabled: true });
    OtpVerification.create = async (data) => data;

    // Request with spoofed device_id but NO trusted_device_token cookie
    const req = {
      body: { email: 'device_test@traveliq.com', password: 'ValidPassword123!', device_id: 'stolen-trusted-device-uuid-999' },
      headers: {},
      cookies: {},
      ip: '127.0.0.1'
    };
    const res = createMockRes();
    await authController.loginUser(req, res);

    // 2FA MUST still be required!
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.two_factor_required, true);
    assert(res.body.challengeToken);

    User.findOne = origUserFind;
    UserSecurity.findOne = origSecFind;
    OtpVerification.create = origOtpCreate;
  });

  // ─── Test 6: Cryptographically signed trusted_device_token cookie allows recognized device ───
  await test('Valid signed trusted_device_token cookie matching user record successfully recognizes device', async () => {
    const trustedDeviceId = 'legit-device-uuid-123';
    const fakeUser = {
      id: 555,
      email: 'device_test@traveliq.com',
      role: 'user',
      trusted_devices: [trustedDeviceId],
      account_status: 'active',
      matchPassword: async () => true,
      save: async () => {}
    };

    const origUserFind = User.findOne;
    const origSecFind = UserSecurity.findOne;
    User.findOne = async () => fakeUser;
    UserSecurity.findOne = async () => ({ two_factor_enabled: true });

    const validDeviceToken = jwt.sign(
      { userId: 555, deviceId: trustedDeviceId, purpose: 'trusted_device' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const req = {
      body: { email: 'device_test@traveliq.com', password: 'ValidPassword123!' },
      headers: {},
      cookies: { trusted_device_token: validDeviceToken },
      ip: '127.0.0.1'
    };
    const res = createMockRes();
    await authController.loginUser(req, res);

    // Direct login: 2FA NOT required because device token is cryptographically verified
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.two_factor_required, undefined);
    assert.strictEqual(res.body.id, 555);

    User.findOne = origUserFind;
    UserSecurity.findOne = origSecFind;
  });

  // ─── Test 7: Legacy unverified passkey registration rejected ───
  await test('verifyPasskeyRegister rejects raw credentialId/publicKey bypass attempt without WebAuthn verification', async () => {
    const { storeChallenge } = require('../utils/webauthn');
    const challengeToken = storeChallenge({
      challenge: 'test-challenge',
      userId: 123,
      type: 'register'
    });

    const req = {
      user: { id: 123, email: 'user@traveliq.com' },
      body: {
        challengeToken,
        credentialId: 'fake-planted-cred-id',
        publicKey: 'fake-planted-public-key'
      }
    };
    const res = createMockRes();
    await verifyPasskeyRegister(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert(res.body.message.includes('Valid WebAuthn registration response is required'));
  });

  // ─── Test 8: passkeyLoginChallenge uniform response structure without userId enumeration ───
  await test('passkeyLoginChallenge response structure is uniform and does not leak userId', async () => {
    const origUserFind = User.findOne;
    User.findOne = async ({ where: { email } }) => {
      if (email === 'exists@traveliq.com') {
        return { id: 999, email: 'exists@traveliq.com' };
      }
      return null;
    };

    const req1 = { body: { email: 'exists@traveliq.com' }, headers: { host: 'localhost:5000' } };
    const res1 = createMockRes();
    await authController.passkeyLoginChallenge(req1, res1);

    const req2 = { body: { email: 'nonexistent@traveliq.com' }, headers: { host: 'localhost:5000' } };
    const res2 = createMockRes();
    await authController.passkeyLoginChallenge(req2, res2);

    assert.strictEqual(res1.statusCode, 200);
    assert.strictEqual(res2.statusCode, 200);

    // Neither response should leak userId
    assert.strictEqual(res1.body.userId, undefined);
    assert.strictEqual(res2.body.userId, undefined);

    // Both must supply challengeToken
    assert(res1.body.challengeToken);
    assert(res2.body.challengeToken);

    User.findOne = origUserFind;
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runMfaPasskeyHardeningTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
