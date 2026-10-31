const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProcessedWebhookEvent = sequelize.define('ProcessedWebhookEvent', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  event_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  event_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  provider: {
    type: DataTypes.STRING(50),
    defaultValue: 'razorpay'
  },
  payload_hash: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'processed'
  },
  order_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  payment_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  processed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'processed_webhook_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ProcessedWebhookEvent;

