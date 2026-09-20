const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OccupancyPrediction = sequelize.define('OccupancyPrediction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  train_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  travel_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  class_code: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  availability_probability: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  expected_waiting_list: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  seat_demand: {
    type: DataTypes.STRING(50),
    defaultValue: 'Medium'
  },
  coach_occupancy_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'occupancy_predictions',
  timestamps: false
});

module.exports = OccupancyPrediction;
