const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserLoyalty = sequelize.define('UserLoyalty', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  referral_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  rewards_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 250
  },
  level: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Bronze Explorer'
  }
}, {
  tableName: 'user_loyalty',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserLoyalty;
