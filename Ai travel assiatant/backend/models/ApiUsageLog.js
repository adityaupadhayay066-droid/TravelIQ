const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ApiUsageLog = sequelize.define('ApiUsageLog', {
  id: {
    type: DataTypes.BIGINT,
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
  api_key_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'api_keys',
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  method: {
    type: DataTypes.STRING(10),
    defaultValue: 'POST'
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  response_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tokens_used: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'api_usage_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // Immutable telemetry log
});

module.exports = ApiUsageLog;
