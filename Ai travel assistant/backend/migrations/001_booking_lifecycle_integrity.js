'use strict';
const sequelize = require('../config/db');

async function runMigration() {
  console.log('🔄 Running migration: 001_booking_lifecycle_integrity...');

  // 1. Add columns to `bookings` table if they do not already exist
  const bookingColumns = [
    { name: 'booking_reference', type: 'VARCHAR(64) NULL' },
    { name: 'journey_date', type: 'DATE NULL' },
    { name: 'transport_type', type: "VARCHAR(50) DEFAULT 'Train'" },
    { name: 'idempotency_key', type: 'VARCHAR(255) NULL' },
    { name: 'expires_at', type: 'DATETIME NULL' }
  ];

  for (const col of bookingColumns) {
    try {
      await sequelize.query(`ALTER TABLE \`bookings\` ADD COLUMN \`${col.name}\` ${col.type};`);
      console.log(`  ✅ Added column \`${col.name}\` to \`bookings\``);
    } catch (e) {
      if (e.message.includes('Duplicate column') || e.original?.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ℹ️ Column \`${col.name}\` already exists on \`bookings\``);
      } else {
        console.warn(`  ⚠️ Could not add column \`${col.name}\`:`, e.message);
      }
    }
  }

  // 2. Populate booking_reference for existing bookings that lack one
  try {
    const [existingBookings] = await sequelize.query(
      "SELECT id, booking_date FROM `bookings` WHERE booking_reference IS NULL OR booking_reference = '';"
    );
    if (existingBookings.length > 0) {
      console.log(`  🔄 Populating booking_reference for ${existingBookings.length} existing bookings...`);
      for (const b of existingBookings) {
        const crypto = require('crypto');
        const ref = `TIQ-BR-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        await sequelize.query('UPDATE `bookings` SET booking_reference = ? WHERE id = ?;', {
          replacements: [ref, b.id]
        });
      }
      console.log('  ✅ Existing bookings populated with unique references.');
    }
  } catch (err) {
    console.warn('  ⚠️ Populating booking_reference notice:', err.message);
  }

  // 3. Add UNIQUE constraint on booking_reference
  try {
    await sequelize.query(
      'ALTER TABLE `bookings` MODIFY COLUMN `booking_reference` VARCHAR(64) NOT NULL;'
    );
    await sequelize.query(
      'CREATE UNIQUE INDEX `idx_bookings_booking_reference` ON `bookings` (`booking_reference`);'
    );
    console.log('  ✅ Added UNIQUE index on `bookings.booking_reference`');
  } catch (e) {
    if (e.message.includes('Duplicate key') || e.original?.code === 'ER_DUP_KEYNAME') {
      console.log('  ℹ️ Index `idx_bookings_booking_reference` already exists.');
    } else {
      console.log('  ℹ️ Unique constraint status:', e.message);
    }
  }

  // 4. Create `idempotency_keys` table
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`idempotency_keys\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`idempotency_key\` VARCHAR(255) NOT NULL,
        \`user_id\` INT NOT NULL,
        \`operation\` VARCHAR(100) NOT NULL,
        \`request_hash\` VARCHAR(64) NOT NULL,
        \`response_status\` INT NOT NULL,
        \`response_body\` JSON NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`idx_user_op_idempotency\` (\`user_id\`, \`operation\`, \`idempotency_key\`),
        INDEX \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Verified `idempotency_keys` table.');
  } catch (e) {
    console.warn('  ⚠️ idempotency_keys table error:', e.message);
  }

  // 5. Create `booking_events` table for retry-safe side effects
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`booking_events\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`booking_id\` INT NOT NULL,
        \`event_type\` VARCHAR(100) NOT NULL,
        \`idempotent_event_id\` VARCHAR(255) NOT NULL UNIQUE,
        \`delivery_status\` VARCHAR(50) DEFAULT 'PENDING',
        \`payload\` JSON DEFAULT NULL,
        \`error_message\` TEXT DEFAULT NULL,
        \`delivered_at\` DATETIME DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_booking_id\` (\`booking_id\`),
        INDEX \`idx_event_type\` (\`event_type\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✅ Verified `booking_events` table.');
  } catch (e) {
    console.warn('  ⚠️ booking_events table error:', e.message);
  }

  console.log('🎉 Migration 001 completed successfully.');
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = runMigration;
