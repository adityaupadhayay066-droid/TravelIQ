const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserPasskey = sequelize.define('UserPasskey', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  credential_id: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  public_key: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  counter: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  transports: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  device_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  backed_up: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'user_passkeys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = UserPasskey;
