const { sequelize } = require('./models');

console.log('🔄 Syncing database tables...');
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Database synchronized successfully! All tables created.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database sync failed:', err);
    process.exit(1);
  });
