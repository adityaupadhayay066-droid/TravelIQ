const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // fallback to cwd if specified
const { Sequelize } = require('sequelize');

const dbUser = process.env.DB_USER || 'traveliq_app';
const dbPassword = process.env.DB_PASSWORD;
if (typeof dbPassword === 'undefined' && process.env.NODE_ENV === 'production') {
  throw new Error('[Database Configuration Error] DB_PASSWORD is required in production.');
}

const isRemoteHost = process.env.DB_HOST && 
  process.env.DB_HOST !== 'localhost' && 
  process.env.DB_HOST !== '127.0.0.1' && 
  process.env.DB_HOST !== 'mysql';

const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && isRemoteHost);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'traveliq',
  dbUser,
  dbPassword || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false, // disable logging in production
    dialectOptions: useSSL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
