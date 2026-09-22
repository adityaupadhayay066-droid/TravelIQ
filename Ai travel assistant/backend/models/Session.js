const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  device_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  device_type: {
    type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
    allowNull: false,
    defaultValue: 'desktop'
  },
  device_name: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown Device'
  },
  os: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown OS'
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown Browser'
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  login_location: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown'
  },
  is_trusted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_active: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Session;
