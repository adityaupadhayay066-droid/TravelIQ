const sequelize = require('./config/db');

async function migrate() {
    try {
        console.log('Running DB migrations for new admin columns and tables...');
        
        // 1. Check existing columns on users / Users
        try {
            await sequelize.query("ALTER TABLE `users` ADD COLUMN `admin_role` ENUM('super_admin', 'admin', 'data_manager', 'support_admin') DEFAULT NULL;");
            console.log('✅ Added admin_role to `users` table');
        } catch (e) {
            console.log('users alter info:', e.message);
        }

        try {
            await sequelize.query("ALTER TABLE `Users` ADD COLUMN `admin_role` ENUM('super_admin', 'admin', 'data_manager', 'support_admin') DEFAULT NULL;");
            console.log('✅ Added admin_role to `Users` table');
        } catch (e) {
            console.log('Users alter info:', e.message);
        }

        // 2. Sync all new tables (Destination, Report, AdminNotification, etc.)
        const models = require('./models');
        await sequelize.sync({ alter: true });
        console.log('✅ Sequelize sync({ alter: true }) completed.');

        // 3. Test queries
        const user = await models.User.findOne();
        console.log('✅ User.findOne succeeded:', user ? user.email : 'No user found');

        const dest = await models.Destination.count();
        console.log('✅ Destinations table active:', dest, 'records');

        const notif = await models.AdminNotification.count();
        console.log('✅ AdminNotification table active:', notif, 'records');

        const reports = await models.Report.count();
        console.log('✅ Report table active:', reports, 'records');

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
