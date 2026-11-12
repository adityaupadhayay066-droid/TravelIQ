const { User } = require('../models');

/**
 * Seeds a default administrator account if none exists in the database.
 * Runs on every server startup — idempotent (skips if admin already exists).
 */
async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_SEED_EMAIL;
        const adminPassword = process.env.ADMIN_SEED_PASSWORD;

        if (!adminEmail || !adminPassword) {
            return;
        }

        if (adminPassword.length < 10) {
            console.warn('⚠️ [Admin Seeder] ADMIN_SEED_PASSWORD must be at least 10 characters. Skipping admin seed.');
            return;
        }

        const cleanEmail = adminEmail.toLowerCase().trim();
        const existingUser = await User.findOne({ where: { email: cleanEmail } });
        if (existingUser) {
            // Security: Never auto-promote an existing user account on boot.
            if (existingUser.role !== 'admin') {
                console.warn(`⚠️ [Admin Seeder] Account ${cleanEmail} already exists with role '${existingUser.role}'. Skipping auto-promotion.`);
            }
            return;
        }

        await User.create({
            name: 'System Administrator',
            email: cleanEmail,
            password: adminPassword,
            role: 'admin',
            admin_role: 'super_admin',
            account_status: 'active',
            email_verified: true,
            phone_verified: false,
            two_factor_enabled: false
        });
        console.log(`✅ [Admin Seeder] Created Super Admin account for: ${cleanEmail}`);
    } catch (error) {
        console.error('⚠️ Admin seeder warning:', error.message);
    }
}

module.exports = { seedAdmin };
