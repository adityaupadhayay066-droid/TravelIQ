'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { getAttachment } = require('../controllers/supportController');
const { SupportAttachment, SupportTicket } = require('../models');

async function runPrivateAttachmentsTests() {
  console.log('================================================================');
  console.log('🔒 Priority 7: Private Files and Support Attachments Security');
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

  // Create temporary test file in uploads/attachments
  const testDir = path.join(__dirname, '..', 'uploads', 'attachments');
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  const testFile = path.join(testDir, 'test-private-attachment.pdf');
  fs.writeFileSync(testFile, '%PDF-1.4 test document content');

  function createMockRes() {
    const res = {
      statusCode: 200,
      headers: {},
      sentFile: null,
      body: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      setHeader: function(name, val) {
        this.headers[name] = val;
      },
      sendFile: function(filePath) {
        this.sentFile = filePath;
        return this;
      }
    };
    return res;
  }

  // Stub records
  const fakeTicket = { id: 10, user_id: 100 };
  const fakeAttachment = {
    id: 50,
    ticket_id: 10,
    file_name: 'test-private-attachment.pdf',
    file_url: 'test-private-attachment.pdf',
    SupportTicket: fakeTicket
  };

  const origFindByPk = SupportAttachment.findByPk;
  const origFindOne = SupportAttachment.findOne;

  SupportAttachment.findByPk = async (id) => (Number(id) === 50 ? fakeAttachment : null);
  SupportAttachment.findOne = async ({ where }) => {
    // Exact lookups only
    if (where && (where.file_name === 'test-private-attachment.pdf' || where.id === 50)) {
      return fakeAttachment;
    }
    return null;
  };

  // ─── Test 1: Authenticated owner can download attachment ───
  await test('Owner (user_id: 100) can retrieve their own attachment with safe headers', async () => {
    const req = {
      user: { id: 100, role: 'user' },
      params: { identifier: '50' }
    };
    const res = createMockRes();
    await getAttachment(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert(res.sentFile && res.sentFile.includes('test-private-attachment.pdf'));
    assert.strictEqual(res.headers['X-Content-Type-Options'], 'nosniff');
    assert.strictEqual(res.headers['Content-Security-Policy'], "default-src 'none'");
    assert(res.headers['Content-Disposition'].includes('attachment;'));
  });

  // ─── Test 2: Other authenticated user rejected with 403 ───
  await test('Other user (user_id: 200) attempting to download attachment is rejected with 403', async () => {
    const req = {
      user: { id: 200, role: 'user' },
      params: { identifier: '50' }
    };
    const res = createMockRes();
    await getAttachment(req, res);

    assert.strictEqual(res.statusCode, 403);
    assert(res.body.message.includes('Access denied: You do not own this ticket attachment'));
    assert.strictEqual(res.sentFile, null);
  });

  // ─── Test 3: Administrator authorized to view ticket attachment ───
  await test('Administrator (role: admin) is permitted to access ticket attachment for support review', async () => {
    const req = {
      user: { id: 999, role: 'admin' },
      params: { identifier: '50' }
    };
    const res = createMockRes();
    await getAttachment(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert(res.sentFile && res.sentFile.includes('test-private-attachment.pdf'));
  });

  // ─── Test 4: Invalid attachment ID returns 404 ───
  await test('Non-existent attachment ID returns 404 Not Found', async () => {
    const req = {
      user: { id: 100, role: 'user' },
      params: { identifier: '9999' }
    };
    const res = createMockRes();
    await getAttachment(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.message, 'Attachment not found.');
  });

  // ─── Test 5: Wildcard attempt fails and cannot leak files ───
  await test('Wildcard patterns (%) cannot match or download attachments', async () => {
    const req = {
      user: { id: 100, role: 'user' },
      params: { identifier: '%.pdf' }
    };
    const res = createMockRes();
    await getAttachment(req, res);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.sentFile, null);
  });

  // Cleanup
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  SupportAttachment.findByPk = origFindByPk;
  SupportAttachment.findOne = origFindOne;

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runPrivateAttachmentsTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
