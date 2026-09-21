const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Organization = sequelize.define('Organization', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  plan_tier: {
    type: DataTypes.ENUM('free', 'starter', 'pro', 'enterprise'),
    defaultValue: 'free'
  },
  monthly_quota: {
    type: DataTypes.INTEGER,
    defaultValue: 100 // Free tier starts with 100 API calls/mo
  },
  used_quota: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  billing_cycle_start: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  stripe_customer_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stripe_subscription_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'organizations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Organization;
