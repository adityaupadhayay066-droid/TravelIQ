'use strict';
const assert = require('assert');
const { updateStation, updateBooking, createBooking, createCoupon, updateCoupon, createAnnouncement } = require('../controllers/adminController');
const { changePassword } = require('../controllers/profileController');
const { Station, Booking, Coupon, Announcement, User, Session, RefreshToken, UserActivityLog } = require('../models');

async function runMassAssignmentAndErrorTests() {
  console.log('================================================================');
  console.log('🛡️ Priority 8: Session Revocation, Error Masking & Mass Assignment');
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

  // ─── Test 1: updateStation mass assignment protection ───
  await test('updateStation rejects tampering with station_code or id', async () => {
    const mockStation = {
      id: 10,
      station_code: 'NDLS',
      station_name: 'New Delhi',
      city: 'Delhi',
      state: 'Delhi',
      update: async function (data) {
        Object.assign(this, data);
      }
    };

    const origFindOne = Station.findOne;
    Station.findOne = async () => mockStation;

    try {
      let resStatus = 200;
      let resBody = null;
      const res = {
        status: (s) => { resStatus = s; return res; },
        json: (b) => { resBody = b; return res; }
      };

      const req = {
        params: { stationCode: 'NDLS' },
        body: {
          station_code: 'MALICIOUS_OVERWRITE',
          id: 9999,
          station_name: 'New Delhi Updated',
          city: 'New Delhi Capital'
        }
      };

      await updateStation(req, res);
      assert.strictEqual(resStatus, 200);
      assert.strictEqual(mockStation.station_code, 'NDLS', 'station_code must not be overwritten');
      assert.strictEqual(mockStation.id, 10, 'id must not be overwritten');
      assert.strictEqual(mockStation.station_name, 'New Delhi Updated');
      assert.strictEqual(mockStation.city, 'New Delhi Capital');
    } finally {
      Station.findOne = origFindOne;
    }
  });

  // ─── Test 2: updateBooking mass assignment protection ───
  await test('updateBooking ignores client-supplied payment_status, user_id, or trip_id', async () => {
    const mockBooking = {
      id: 42,
      user_id: 1,
      trip_id: 100,
      payment_status: 'Pending',
      booking_status: 'Pending',
      seat_preference: 'Window',
      update: async function (data) {
        Object.assign(this, data);
      }
    };

    const origFindByPk = Booking.findByPk;
    Booking.findByPk = async () => mockBooking;

    try {
      let resStatus = 200;
      let resBody = null;
      const res = {
        status: (s) => { resStatus = s; return res; },
        json: (b) => { resBody = b; return res; }
      };

      const req = {
        params: { id: 42 },
        body: {
          payment_status: 'Paid',
          user_id: 9999,
          trip_id: 8888,
          booking_status: 'Confirmed',
          seat_preference: 'Aisle'
        }
      };

      await updateBooking(req, res);
      assert.strictEqual(resStatus, 200);
      assert.strictEqual(mockBooking.payment_status, 'Pending', 'payment_status must not be altered via mass assignment');
      assert.strictEqual(mockBooking.user_id, 1, 'user_id must not be altered via mass assignment');
      assert.strictEqual(mockBooking.trip_id, 100, 'trip_id must not be altered via mass assignment');
      assert.strictEqual(mockBooking.booking_status, 'Confirmed');
      assert.strictEqual(mockBooking.seat_preference, 'Aisle');
    } finally {
      Booking.findByPk = origFindByPk;
    }
  });

  // ─── Test 3: createBooking forces payment_status to Pending ───
  await test('createBooking ignores client-forged payment_status: Paid', async () => {
    let createdPayload = null;
    const origCreate = Booking.create;
    Booking.create = async (payload) => {
      createdPayload = payload;
      return { id: 101, ...payload };
    };

    try {
      let resStatus = 200;
      let resBody = null;
      const res = {
        status: (s) => { resStatus = s; return res; },
        json: (b) => { resBody = b; return res; }
      };

      const req = {
        body: {
          user_id: 5,
          trip_id: 12,
          payment_status: 'Paid', // Malicious attempt to bypass payment
          booking_status: 'Confirmed',
          train_number: '12951',
          ticket_fare: 1500
        }
      };

      await createBooking(req, res);
      assert.strictEqual(resStatus, 201);
      assert.strictEqual(createdPayload.payment_status, 'Pending', 'payment_status must always default to Pending on creation');
    } finally {
      Booking.create = origCreate;
    }
  });

  // ─── Test 4: updateCoupon mass assignment protection ───
  await test('updateCoupon rejects tampering with coupon code or id', async () => {
    const mockCoupon = {
      id: 7,
      code: 'SUMMER20',
      discount_percentage: 20,
      is_active: true,
      update: async function (data) {
        Object.assign(this, data);
      }
    };

    const origFindByPk = Coupon.findByPk;
    Coupon.findByPk = async () => mockCoupon;

    try {
      let resStatus = 200;
      let resBody = null;
      const res = {
        status: (s) => { resStatus = s; return res; },
        json: (b) => { resBody = b; return res; }
      };

      const req = {
        params: { id: 7 },
        body: {
          code: 'SUPERHACKED',
          id: 1,
          discount_percentage: 25
        }
      };

      await updateCoupon(req, res);
      assert.strictEqual(resStatus, 200);
      assert.strictEqual(mockCoupon.code, 'SUMMER20', 'code must not be overwritten');
      assert.strictEqual(mockCoupon.id, 7, 'id must not be overwritten');
      assert.strictEqual(mockCoupon.discount_percentage, 25);
    } finally {
      Coupon.findByPk = origFindByPk;
    }
  });

  // ─── Test 5: createAnnouncement binds created_by to authenticated user ───
  await test('createAnnouncement binds created_by to req.user and blocks impersonation', async () => {
    let createdPayload = null;
    const origCreate = Announcement.create;
    Announcement.create = async (payload) => {
      createdPayload = payload;
      return { id: 50, ...payload };
    };

    try {
      let resStatus = 200;
      let resBody = null;
      const res = {
        status: (s) => { resStatus = s; return res; },
        json: (b) => { resBody = b; return res; }
      };

      const req = {
        user: { id: 3, role: 'admin' },
        body: {
          title: 'System Notice',
          message: 'Maintenance tonight at 2 AM',
          type: 'warning',
          created_by: 9999 // Attacker tries to impersonate another admin/user
        }
      };

      await createAnnouncement(req, res);
      assert.strictEqual(resStatus, 201);
      assert.strictEqual(createdPayload.created_by, 3, 'created_by must be bound strictly to req.user.id');
    } finally {
      Announcement.create = origCreate;
    }
  });

  // ─── Test 6: 500 error responses mask internal stack and sql details ───
  await test('HTTP 500 error responses return generic message without stack or sql leakage', async () => {
    const origFindOne = Station.findOne;
    // Simulate internal database error leaking schema and credentials
    Station.findOne = async () => {
      const err = new Error('SQLSTATE[HY000] [2002] Connection refused at db.internal:3306 with user root:secret123');
      err.stack = 'Error: Connection refused\n    at MySQL.query (/app/db.js:42:15)';
      throw err;
    };

    try {
      let resStatus = 200;
      let resBody = null;
      const res = {
        status: (s) => { resStatus = s; return res; },
        json: (b) => { resBody = b; return res; }
      };

      const req = { params: { stationCode: 'TEST' }, body: {} };
      await updateStation(req, res);

      assert.strictEqual(resStatus, 500);
      assert.strictEqual(resBody.success, false);
      assert.strictEqual(resBody.message, 'Internal server error. Please try again later.');
      assert.strictEqual(resBody.error, undefined, 'Raw error/stack must not be returned');
      assert.ok(!JSON.stringify(resBody).includes('secret123'), 'Secrets must not be present in response');
      assert.ok(!JSON.stringify(resBody).includes('SQLSTATE'), 'SQL errors must not be present in response');
    } finally {
      Station.findOne = origFindOne;
    }
  });

  // ─── Test 7: changePassword revokes other sessions and refresh tokens ───
  await test('changePassword revokes other active sessions and refresh tokens for that user', async () => {
    const mockUser = {
      id: 5,
      password: 'OldPassword123!',
      matchPassword: async (pwd) => pwd === 'CurrentPassword123!',
      save: async () => true
    };

    let sessionDestroyQuery = null;
    let refreshTokenDestroyQuery = null;

    const origFindByPk = User.findByPk;
    const origSessionDestroy = Session.destroy;
    const origTokenDestroy = RefreshToken.destroy;
    const origLogCreate = UserActivityLog.create;

    User.findByPk = async () => mockUser;
    Session.destroy = async (query) => { sessionDestroyQuery = query; return 2; };
    RefreshToken.destroy = async (query) => { refreshTokenDestroyQuery = query; return 3; };
    UserActivityLog.create = async () => true;

    try {
      let resStatus = 200;
      let resBody = null;
      const res = {
        status: (s) => { resStatus = s; return res; },
        json: (b) => { resBody = b; return res; }
      };

      const req = {
        user: { id: 5 },
        sessionId: 'current-session-uuid-1234',
        ip: '127.0.0.1',
        body: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'BrandNewSecurePassword123!@#'
        }
      };

      await changePassword(req, res);
      assert.strictEqual(resStatus, 200);
      assert.strictEqual(resBody.message, 'Password changed successfully');
      
      // Verify other sessions were targeted for destruction
      assert.ok(sessionDestroyQuery, 'Session.destroy must be invoked');
      assert.strictEqual(sessionDestroyQuery.where.user_id, 5);
      // Check that current session ID is excluded from destruction
      assert.ok(sessionDestroyQuery.where.session_id, 'session_id filter must be applied');
      
      // Verify refresh tokens were destroyed
      assert.ok(refreshTokenDestroyQuery, 'RefreshToken.destroy must be invoked');
      assert.strictEqual(refreshTokenDestroyQuery.where.user_id, 5);
    } finally {
      User.findByPk = origFindByPk;
      Session.destroy = origSessionDestroy;
      RefreshToken.destroy = origTokenDestroy;
      UserActivityLog.create = origLogCreate;
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runMassAssignmentAndErrorTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}

module.exports = runMassAssignmentAndErrorTests;
