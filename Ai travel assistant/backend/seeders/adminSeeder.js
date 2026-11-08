const { User } = require('../models');

/**
 * Seeds a default administrator account if none exists in the database.
 * Runs on every server startup — idempotent (skips if admin already exists).
 */
async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_SEED_EMAIL || 'adityaupadhayay066@gmail.com';
        const adminPassword = process.env.ADMIN_SEED_PASSWORD;

        if (adminEmail && adminPassword && adminPassword.length >= 6) {
            const cleanEmail = adminEmail.toLowerCase().trim();
            const existingUser = await User.findOne({ where: { email: cleanEmail } });
            if (existingUser) {
                if (existingUser.role !== 'admin' || existingUser.admin_role !== 'super_admin') {
                    await existingUser.update({ role: 'admin', admin_role: 'super_admin', account_status: 'active' });
                    console.log(`✅ [Admin Seeder] Verified ${cleanEmail} as Super Admin`);
                }
            } else {
                await User.create({
                    name: cleanEmail.includes('aditya') ? 'Aditya Upadhayay' : 'System Administrator',
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
            }
        }
    } catch (error) {
        console.error('⚠️ Admin seeder warning:', error.message);
    }
}
        console.error('⚠️ Admin seeder warning:', error.message);
    }
}

module.exports = { seedAdmin };
