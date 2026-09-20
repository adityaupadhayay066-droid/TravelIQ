const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PaymentLog = sequelize.define('PaymentLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_type: {
    type: DataTypes.STRING,
    allowNull: false // INITIATED, COMPLETED, FAILED, REFUNDED
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = PaymentLog;
