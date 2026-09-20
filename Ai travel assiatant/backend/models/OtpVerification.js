const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OtpVerification = sequelize.define('OtpVerification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  otp_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('email', 'phone'),
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('registration', 'login_2fa', 'admin_2fa', 'device_verify'),
    allowNull: false,
    defaultValue: 'registration'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = OtpVerification;
