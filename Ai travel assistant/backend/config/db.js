const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // fallback to cwd if specified
const { Sequelize } = require('sequelize');

const dbUser = process.env.DB_USER || 'traveliq_app';
const dbPassword = process.env.DB_PASSWORD;
if (typeof dbPassword === 'undefined' && process.env.NODE_ENV === 'production') {
  throw new Error('[Database Configuration Error] DB_PASSWORD is required in production.');
}

const sequelize = new Sequelize(
  process.env.DB_NAME || 'traveliq',
  dbUser,
  dbPassword || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // disable logging in production
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
