const { User } = require('../models');

/**
 * Seeds a default administrator account if none exists in the database.
 * Runs on every server startup — idempotent (skips if admin already exists).
 */
async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@traveliq.com';
        const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@123';

        const existingAdmin = await User.findOne({ where: { role: 'admin' } });

        if (existingAdmin) {
            if (existingAdmin.admin_role !== 'super_admin') {
                await existingAdmin.update({ admin_role: 'super_admin' });
            }
            console.log(`✅ Admin account already exists: ${existingAdmin.email} (Role: ${existingAdmin.admin_role || 'super_admin'})`);
            return;
        }

        const admin = await User.create({
            name: 'System Administrator',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            admin_role: 'super_admin',
            account_status: 'active',
            email_verified: true,
            phone_verified: false,
            two_factor_enabled: false
        });

        console.log('');
        console.log('══════════════════════════════════════════════════');
        console.log('🔐 DEFAULT ADMIN ACCOUNT CREATED');
        console.log('──────────────────────────────────────────────────');
        console.log(`   Email    : ${adminEmail}`);
        console.log(`   Password : ${adminPassword}`);
        console.log(`   User ID  : ${admin.id}`);
        console.log('──────────────────────────────────────────────────');
        console.log('   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!');
        console.log('══════════════════════════════════════════════════');
        console.log('');

    } catch (error) {
        console.error('⚠️ Admin seeder warning:', error.message);
    }
}

module.exports = { seedAdmin };
