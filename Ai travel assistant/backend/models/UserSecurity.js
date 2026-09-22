const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserSecurity = sequelize.define('UserSecurity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  passkey_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recovery_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recovery_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  backup_codes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'user_security',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserSecurity;
