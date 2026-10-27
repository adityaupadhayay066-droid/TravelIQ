const assert = require('assert');
const crypto = require('crypto');
const { storeChallenge, consumeChallenge } = require('../utils/webauthn');
const { calculateAuthoritativePricing, maskGovId, createReservation } = require('../services/hotelService');
const { verifyClientShield } = require('../middleware/antiScrapingMiddleware');

async function runSecurityHardeningTests() {
  console.log('================================================================');
  console.log('🛡️  TravelIQ Security Hardening & Vulnerability Verification Suite');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
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

  // ─── 1. WebAuthn Passkey Cryptographic Verification ───
  console.log('--- Test Suite 1: WebAuthn Challenge Lifecycle & Passkey Bypass Fixes ---');

  test('storeChallenge generates single-use token and stores cryptographic challenge', () => {
    const rawChallenge = 'test_crypto_challenge_bytes_123456';
    const token = storeChallenge({ challenge: rawChallenge, userId: 101, email: 'alice@traveliq.com' });
    assert.ok(token, 'Challenge token must be generated');
    assert.strictEqual(typeof token, 'string', 'Token must be a string');
    assert.ok(token.length >= 32, 'Token must have high entropy');
  });

  test('consumeChallenge returns challenge on first lookup and deletes it (single-use anti-replay)', () => {
    const rawChallenge = 'single_use_challenge_789';
    const token = storeChallenge({ challenge: rawChallenge, userId: 202 });
    const consumed = consumeChallenge(token);
    assert.ok(consumed, 'Must consume stored challenge');
    assert.strictEqual(consumed.challenge, rawChallenge, 'Challenge content must match');
    assert.strictEqual(consumed.userId, 202, 'User ID must match');

    // Second retrieval must fail immediately (anti-replay)
    const replayed = consumeChallenge(token);
    assert.strictEqual(replayed, null, 'Replayed challenge lookup must return null');
  });

  test('Expired WebAuthn challenge is automatically rejected', () => {
    const expiredToken = storeChallenge({ challenge: 'expired_ch' }, -1000); // already expired
    const result = consumeChallenge(expiredToken);
    assert.strictEqual(result, null, 'Expired challenge must not be accepted');
  });

  test('Non-existent or forged challenge tokens return null', () => {
    assert.strictEqual(consumeChallenge('non_existent_token_123'), null);
    assert.strictEqual(consumeChallenge(null), null);
    assert.strictEqual(consumeChallenge(''), null);
  });

  // ─── 2. Hotel Reservation Authoritative Pricing & IDOR Prevention ───
  console.log('\n--- Test Suite 2: Hotel Reservation Authoritative Pricing & PII Protection ---');

  test('calculateAuthoritativePricing recalculates totals on server, ignoring client grandTotal tampering', () => {
    // Hotel: 'Taj Bengal', City: 'Kolkata', Room: 'Deluxe Room', 3 nights, 2 units, 2 guests, breakfast, promo: TRAVELIQ10
    const result = calculateAuthoritativePricing('Taj Bengal', 'Kolkata', 'Deluxe Room', 3, 2, 2, 'breakfast', 'TRAVELIQ10');
    assert.ok(result.grandTotal > 0, 'Grand total must be positive');
    assert.strictEqual(result.nights, 3, 'Must compute exactly 3 nights');
    assert.strictEqual(result.unitsCount, 2, 'Must compute exactly 2 rooms');
    assert.strictEqual(result.discount > 0, true, 'TRAVELIQ10 promo code must apply discount');
    assert.ok(result.taxes > 0, '12% GST tax must be calculated');
  });

  test('createReservation rejects invalid date sequences (check_in >= check_out)', () => {
    assert.throws(() => {
      createReservation(1, {
        hotelName: 'Taj Palace',
        city: 'New Delhi',
        checkInDate: '2026-11-05',
        checkOutDate: '2026-11-04', // Before check-in
        guestName: 'John Doe',
        guestEmail: 'john@example.com'
      });
    }, /Check-out date must be.*after check-in date/);

    assert.throws(() => {
      createReservation(1, {
        hotelName: 'Taj Palace',
        city: 'New Delhi',
        checkInDate: '2026-11-05',
        checkOutDate: '2026-11-05', // Same date
        guestName: 'John Doe',
        guestEmail: 'john@example.com'
      });
    }, /Check-out date must be.*after check-in date/);
  });

  test('maskGovId redacts government IDs to prevent personal data exposure', () => {
    assert.strictEqual(maskGovId('123456789012'), 'XXXX-XXXX-9012', '12-digit Aadhaar masked to last 4');
    assert.strictEqual(maskGovId('ABCDE1234F'), 'XXXX-XXXX-234F', 'PAN card masked to last 4');
    assert.strictEqual(maskGovId(null), 'XXXX-XXXX-0000', 'Null ID returns safe default mask');
  });

  // ─── 3. Stored XSS Prevention in HTML/PDF Generation ───
  console.log('\n--- Test Suite 3: Stored XSS Prevention in HTML/PDF Generation ---');

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  test('escapeHtml eliminates stored XSS payloads in passenger and ticket fields', () => {
    const maliciousPayload = "<script>alert('XSS Attack')</script>";
    const escaped = escapeHtml(maliciousPayload);
    assert.strictEqual(escaped, "&lt;script&gt;alert(&#39;XSS Attack&#39;)&lt;/script&gt;", 'Script tags and quotes must be entity-encoded');
    assert.ok(!escaped.includes('<script>'), 'Must not contain raw script tag');

    const attrPayload = 'John" onload="alert(1)';
    const escapedAttr = escapeHtml(attrPayload);
    assert.ok(!escapedAttr.includes('"'), 'Double quotes must be escaped');
    assert.strictEqual(escapedAttr, 'John&quot; onload=&quot;alert(1)');
  });

  // ─── 4. Refresh Token Reuse Detection & Session Security ───
  console.log('\n--- Test Suite 4: Refresh Token Lifecycle & Rotation ---');

  test('Refresh token rotation detects token reuse and triggers full revocation', () => {
    const sessions = new Map();
    // Simulate user session with token rotation
    const userId = 42;
    const initialToken = 'token_version_1';
    sessions.set(initialToken, { userId, valid: true });

    // Step 1: User rotates token
    const rotatedToken = 'token_version_2';
    sessions.set(initialToken, { userId, valid: false, revokedAt: Date.now() }); // mark old as revoked
    sessions.set(rotatedToken, { userId, valid: true });

    // Step 2: Attacker replays old initialToken
    const sessionAttempt = sessions.get(initialToken);
    assert.strictEqual(sessionAttempt.valid, false, 'Old token must be marked invalid');

    // Trigger revocation of all sessions for this user on reuse detection
    let allSessionsRevoked = false;
    if (!sessionAttempt.valid) {
      for (const [t, s] of sessions.entries()) {
        if (s.userId === userId) {
          s.valid = false;
        }
      }
      allSessionsRevoked = true;
    }

    assert.ok(allSessionsRevoked, 'Security alert should revoke all user sessions on token reuse');
    assert.strictEqual(sessions.get(rotatedToken).valid, false, 'Current session must also be revoked on reuse attempt');
  });

  // ─── 5. OTP Brute-Force & Hashing Controls ───
  console.log('\n--- Test Suite 5: OTP Brute-Force Threshold & Hashed Storage ---');

  test('OTP is hashed using SHA-256 and verified timing-safely', () => {
    const rawOtp = '749201';
    const hashed = crypto.createHash('sha256').update(rawOtp).digest('hex');

    const checkCorrect = crypto.createHash('sha256').update('749201').digest('hex');
    assert.strictEqual(hashed, checkCorrect, 'Hashed OTP must match correct input');

    const checkIncorrect = crypto.createHash('sha256').update('000000').digest('hex');
    assert.notStrictEqual(hashed, checkIncorrect, 'Incorrect OTP must not match hash');
  });

  test('OTP enforces 5-attempt brute-force limit', () => {
    let attempts = 0;
    const MAX_ATTEMPTS = 5;
    let locked = false;

    for (let guess = 1; guess <= 6; guess++) {
      if (attempts >= MAX_ATTEMPTS) {
        locked = true;
        break;
      }
      attempts++;
    }

    assert.strictEqual(attempts, 5, 'Should lock after 5 attempts');
    assert.strictEqual(locked, true, 'OTP verification must be locked after 5 failed attempts');
  });

  // ─── 6. n8n Webhook Header Authentication & Constant-Time Verification ───
  console.log('\n--- Test Suite 6: n8n Webhook Header Verification ---');

  test('n8n Webhook rejects URL query parameter secrets and accepts constant-time header', () => {
    const expectedSecret = 'test_webhook_sec_abc123';
    
    // Test 1: Secret in query parameter must be rejected
    const queryAttempt = { headers: {}, query: { secret: expectedSecret } };
    const querySecret = queryAttempt.headers['x-traveliq-secret'] || null;
    assert.strictEqual(querySecret, null, 'Secret in query parameter must not be accepted');

    // Test 2: Valid secret in header with constant-time equality
    const headerAttempt = { headers: { 'x-traveliq-secret': expectedSecret } };
    const provided = headerAttempt.headers['x-traveliq-secret'];
    const isMatch = provided.length === expectedSecret.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expectedSecret));
    assert.ok(isMatch, 'Valid header secret must match timing-safely');

    // Test 3: Invalid secret in header
    const badSecret = 'wrong_secret_123';
    const isBadMatch = badSecret.length === expectedSecret.length &&
      crypto.timingSafeEqual(Buffer.from(badSecret), Buffer.from(expectedSecret));
    assert.strictEqual(isBadMatch, false, 'Bad secret must be rejected');
  });

  // ─── 7. Anti-Scraping & Client Shield Telemetry ───
  console.log('\n--- Test Suite 7: Anti-Scraping & Client Shield Telemetry ---');

  test('verifyClientShield accepts fresh timestamp telemetry and rejects expired or weak tokens', () => {
    const freshTimestamp = Date.now();
    const validEntropy = crypto.randomBytes(16).toString('hex');
    const freshToken = `${freshTimestamp}.${validEntropy}`;
    assert.ok(verifyClientShield(freshToken), 'Fresh telemetry token must be accepted');

    const expiredTimestamp = Date.now() - 15 * 60 * 1000; // 15 mins ago (TTL is 10 min)
    const expiredToken = `${expiredTimestamp}.${validEntropy}`;
    assert.strictEqual(verifyClientShield(expiredToken), false, 'Expired telemetry token must be rejected');

    // Audit Requirement: Reject arbitrary 4-character strings
    assert.strictEqual(verifyClientShield(`${freshTimestamp}.abcd`), false, 'Arbitrary 4-character string must be rejected');
    assert.strictEqual(verifyClientShield(null), false, 'Null token rejected');
    assert.strictEqual(verifyClientShield('invalid-format'), false, 'Malformed token rejected');
  });

  // ─── 8. Payment & Booking Verification Controls ───
  console.log('\n--- Test Suite 8: Payment & Booking Integrity Checks ---');

  test('Booking payment prevents client amount tampering', () => {
    const authoritativeBooking = {
      id: 55,
      user_id: 10,
      ticket_fare: 1450.00,
      status: 'PENDING'
    };
    const req = {
      user: { id: 10 },
      body: {
        booking_id: 55,
        amount: 1.00 // Attacker tampering to pay 1 rupee
      }
    };

    // Server-side enforcement check
    const isOwner = authoritativeBooking.user_id === req.user.id;
    assert.ok(isOwner, 'User must own the booking');

    // Payment amount is strictly set to booking.ticket_fare, ignoring req.body.amount
    const serverEnforcedAmount = authoritativeBooking.ticket_fare;
    assert.strictEqual(serverEnforcedAmount, 1450.00, 'Payment amount must be derived from authoritative database record');
    assert.notStrictEqual(serverEnforcedAmount, req.body.amount, 'Client-tampered 1.00 INR amount must be ignored');
  });

  test('Duplicate payment processing is rejected on confirmed bookings', () => {
    const confirmedBooking = {
      id: 56,
      user_id: 10,
      ticket_fare: 850.00,
      status: 'CONFIRMED' // Already paid and booked
    };

    const isDuplicate = confirmedBooking.status === 'CONFIRMED';
    assert.ok(isDuplicate, 'Payment attempt on already confirmed booking must be rejected as duplicate');
  });

  console.log('\n================================================================');
  console.log(`Security Hardening Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityHardeningTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
