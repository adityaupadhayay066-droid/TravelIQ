const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LoginHistory = sequelize.define('LoginHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  session_id: {
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
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Unknown'
  },
  login_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  logout_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'login_histories'
});

module.exports = LoginHistory;
