'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const IdempotencyKey = sequelize.define('IdempotencyKey', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  idempotency_key: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  operation: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  request_hash: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  response_status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  response_body: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'idempotency_keys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = IdempotencyKey;
