'use strict';
const assert = require('assert');
const { updateUser, deleteUser, resetUserPassword, bulkUpdateUsers } = require('../controllers/adminController');
const { User, Session, RefreshToken, AdminLog } = require('../models');

async function runRoleHierarchyTests() {
  console.log('================================================================');
  console.log('👑 Priority 3: Administrator Role Hierarchy & Account Protection');
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

  // Set up mock users
  const mockUsers = {
    1: { id: 1, email: 'superadmin@traveliq.com', role: 'admin', admin_role: 'super_admin', account_status: 'active', save: async () => {}, update: async (d) => Object.assign(mockUsers[1], d), toSafeObject: () => mockUsers[1] },
    2: { id: 2, email: 'admin_bob@traveliq.com', role: 'admin', admin_role: 'admin', account_status: 'active', save: async () => {}, update: async (d) => Object.assign(mockUsers[2], d), toSafeObject: () => mockUsers[2] },
    3: { id: 3, email: 'admin_carol@traveliq.com', role: 'admin', admin_role: 'admin', account_status: 'active', save: async () => {}, update: async (d) => Object.assign(mockUsers[3], d), toSafeObject: () => mockUsers[3] },
    4: { id: 4, email: 'user_david@traveliq.com', role: 'user', account_status: 'active', save: async () => {}, update: async (d) => Object.assign(mockUsers[4], d), toSafeObject: () => mockUsers[4] }
  };

  let destroyedSessions = [];
  let destroyedTokens = [];
  let adminLogs = [];

  const origFindByPk = User.findByPk;
  const origFindAll = User.findAll;
  const origSessionDestroy = Session.destroy;
  const origTokenDestroy = RefreshToken.destroy;
  const origAdminLogCreate = AdminLog.create;

  User.findByPk = async (id) => mockUsers[id] || null;
  User.findAll = async ({ where }) => {
    if (where && where.id && where.id[Object.getOwnPropertySymbols(where.id)[0] || '$in']) {
      const ids = where.id[Object.getOwnPropertySymbols(where.id)[0]];
      return ids.map(id => mockUsers[id]).filter(Boolean);
    }
    return Object.values(mockUsers);
  };
  User.update = async (values, { where }) => {
    return [1];
  };
  Session.destroy = async ({ where }) => {
    destroyedSessions.push(where);
    return 1;
  };
  RefreshToken.destroy = async ({ where }) => {
    destroyedTokens.push(where);
    return 1;
  };
  AdminLog.create = async (data) => {
    adminLogs.push(data);
    return data;
  };

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
    // ─── Test 1: Ordinary Admin cannot reset Super Admin password ───
    await test('Ordinary Admin cannot reset Super Admin password (403 Forbidden)', async () => {
      const req = {
        user: mockUsers[2], // Ordinary admin (Bob)
        params: { id: 1 },  // Super admin (ID 1)
        body: { newPassword: 'ValidPassword123!' }
      };
      const res = createMockRes();
      await resetUserPassword(req, res);

      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.data.message.includes('Access denied'), 'Must reject modification of higher privilege account');
    });

    // ─── Test 2: Ordinary Admin cannot delete Super Admin ───
    await test('Ordinary Admin cannot delete Super Admin account (403 Forbidden)', async () => {
      const req = {
        user: mockUsers[2], // Ordinary admin
        params: { id: 1 }   // Super admin
      };
      const res = createMockRes();
      await deleteUser(req, res);

      assert.strictEqual(res.statusCode, 403);
      assert.notStrictEqual(mockUsers[1].account_status, 'deleted');
    });

    // ─── Test 3: Ordinary Admin cannot delete another Ordinary Admin ───
    await test('Ordinary Admin cannot delete another equal-privileged Admin (403 Forbidden)', async () => {
      const req = {
        user: mockUsers[2], // Admin Bob
        params: { id: 3 }   // Admin Carol
      };
      const res = createMockRes();
      await deleteUser(req, res);

      assert.strictEqual(res.statusCode, 403);
      assert.notStrictEqual(mockUsers[3].account_status, 'deleted');
    });

    // ─── Test 4: Ordinary Admin cannot disable Super Admin in bulk operation ───
    await test('Bulk operation targeting Super Admin is rejected with 403', async () => {
      const req = {
        user: mockUsers[2], // Ordinary admin
        body: {
          userIds: [4, 1],  // ordinary user + super admin
          action: 'disable'
        }
      };
      const res = createMockRes();
      await bulkUpdateUsers(req, res);

      assert.strictEqual(res.statusCode, 403);
      assert.ok(res.data.message.includes('equal or higher administrative privileges'));
    });

    // ─── Test 5: Super Admin can manage Ordinary Admin and Users ───
    await test('Super Admin can reset Ordinary Admin password with strong password & revokes sessions', async () => {
      destroyedSessions = [];
      const req = {
        user: mockUsers[1], // Super Admin
        params: { id: 2 },  // Admin Bob
        body: { newPassword: 'SuperSecureNewPassword123@!' }
      };
      const res = createMockRes();
      await resetUserPassword(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.data.success);
      assert.ok(destroyedSessions.length > 0, 'Active sessions must be destroyed upon password reset');
    });

    // ─── Test 6: Weak password in admin reset is rejected ───
    await test('Weak password (<10 chars or missing required complexity) is rejected with 400', async () => {
      const req = {
        user: mockUsers[1],
        params: { id: 4 }, // User David
        body: { newPassword: 'simple' } // Weak password
      };
      const res = createMockRes();
      await resetUserPassword(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.data.message.includes('at least 10 characters long'));
    });

    // ─── Test 7: Ordinary Admin cannot promote themselves to Super Admin ───
    await test('Ordinary Admin cannot promote themselves or modify admin_role (403 Forbidden)', async () => {
      const req = {
        user: mockUsers[2], // Ordinary admin
        params: { id: 2 },
        body: { admin_role: 'super_admin' }
      };
      const res = createMockRes();
      await updateUser(req, res);

      assert.strictEqual(res.statusCode, 403);
    });

    // ─── Test 8: Sensitive Admin audit logs do NOT expose raw passwords ───
    await test('Audit logs record sanitized operation without passwords', () => {
      const recentLog = adminLogs.find(l => l.action === 'PASSWORD_RESET');
      assert.ok(recentLog, 'Password reset must be logged in AdminLog');
      assert.strictEqual(recentLog.details.includes('SuperSecureNewPassword123@!'), false, 'Passwords must NEVER appear in logs');
    });

  } finally {
    User.findByPk = origFindByPk;
    User.findAll = origFindAll;
    Session.destroy = origSessionDestroy;
    RefreshToken.destroy = origTokenDestroy;
    AdminLog.create = origAdminLogCreate;
  }

  console.log(`\n================================================================`);
  console.log(`Role Hierarchy Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRoleHierarchyTests().catch(err => {
  console.error('Fatal test error in role hierarchy suite:', err);
  process.exit(1);
});
