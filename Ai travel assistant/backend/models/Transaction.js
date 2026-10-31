const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  order_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  payment_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'INR'
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  refund_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  signature: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  idempotency_key: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Transaction;
