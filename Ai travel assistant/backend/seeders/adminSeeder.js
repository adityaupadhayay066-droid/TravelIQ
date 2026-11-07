const { User } = require('../models');

/**
 * Seeds a default administrator account if none exists in the database.
 * Runs on every server startup — idempotent (skips if admin already exists).
 */
async function seedAdmin() {
    try {
        // Ensure Aditya Upadhayay is Super Admin
        const aditya = await User.findOne({ where: { email: 'adityaupadhayay066@gmail.com' } });
        if (aditya && (aditya.role !== 'admin' || aditya.admin_role !== 'super_admin')) {
            await aditya.update({ role: 'admin', admin_role: 'super_admin', account_status: 'active' });
            console.log('✅ [Admin Seeder] Verified Aditya Upadhayay as Super Admin');
        }

        const existingAdmin = await User.findOne({ where: { role: 'admin' } });

        if (existingAdmin) {
            return;
        }

        const adminEmail = process.env.ADMIN_SEED_EMAIL;
        const adminPassword = process.env.ADMIN_SEED_PASSWORD;

        // Never create default admin with hardcoded/weak passwords on startup
        if (!adminEmail || !adminPassword || adminPassword === 'Admin@123' || adminPassword.length < 10) {
            console.log('ℹ️ [Admin Seeder] No administrator found. To provision an initial administrator, configure strong ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD (min 10 characters) in your environment.');
            return;
        }

        const admin = await User.create({
            name: 'System Administrator',
            email: adminEmail.toLowerCase().trim(),
            password: adminPassword,
            role: 'admin',
            admin_role: 'super_admin',
            account_status: 'active',
            email_verified: true,
            phone_verified: false,
            two_factor_enabled: false
        });

        console.log(`✅ [Admin Seeder] Initial administrator account created for: ${adminEmail}`);

    } catch (error) {
        console.error('⚠️ Admin seeder warning:', error.message);
    }
}

module.exports = { seedAdmin };
