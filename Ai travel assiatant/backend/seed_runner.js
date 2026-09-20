const { sequelize } = require('./models');
const { seedTrains } = require('./seeders/trainSeeder');

sequelize.sync().then(async () => {
    console.log('Database synced. Seeding trains...');
    await seedTrains();
    console.log('Done.');
    process.exit(0);
}).catch(console.error);
