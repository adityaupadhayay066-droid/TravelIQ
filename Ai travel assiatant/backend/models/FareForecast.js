const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FareForecast = sequelize.define('FareForecast', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  class_code: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  travel_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  current_fare: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  forecasted_fare_7d: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  recommendation: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  demand_level: {
    type: DataTypes.STRING(50),
    defaultValue: 'Medium'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'fare_forecasts',
  timestamps: false
});

module.exports = FareForecast;
