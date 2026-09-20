const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CarbonEmission = sequelize.define('CarbonEmission', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trip_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  transport_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  distance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  emission_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  carbon_saved: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'carbon_emissions'
});

module.exports = CarbonEmission;
