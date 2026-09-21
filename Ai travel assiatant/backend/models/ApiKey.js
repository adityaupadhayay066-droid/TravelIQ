const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  org_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'organizations',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    defaultValue: 'Default API Key'
  },
  key_prefix: {
    type: DataTypes.STRING(20),
    allowNull: false // e.g. "tiq_live_"
  },
  key_hint: {
    type: DataTypes.STRING(8),
    allowNull: false // e.g. "9a4f" (last 4 chars for visual identification)
  },
  key_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true // SHA-256 hash of the complete API key
  },
  rate_limit_per_minute: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'api_keys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ApiKey;
