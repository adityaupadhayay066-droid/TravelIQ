const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CrowdPrediction = sequelize.define('CrowdPrediction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  station_code: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  prediction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hour_of_day: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  crowd_level: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  expected_crowd_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  platform_congestion_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  peak_time_alert: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'crowd_predictions',
  timestamps: false
});

module.exports = CrowdPrediction;
