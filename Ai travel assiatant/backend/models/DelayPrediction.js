const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DelayPrediction = sequelize.define('DelayPrediction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  train_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  route: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  departure_delay_mins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  arrival_delay_mins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  delay_probability: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'delay_predictions',
  timestamps: false
});

module.exports = DelayPrediction;
