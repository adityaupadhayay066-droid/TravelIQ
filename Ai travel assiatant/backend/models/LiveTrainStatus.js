const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LiveTrainStatus = sequelize.define('LiveTrainStatus', {
  train_number: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  current_station_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50), // 'Not Started', 'Running', 'Arrived', 'Departed', 'Completed'
    allowNull: false,
    defaultValue: 'Not Started'
  },
  delay_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  last_updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  current_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  current_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  last_status_message: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  next_station_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'live_train_statuses',
  timestamps: true
});

module.exports = LiveTrainStatus;
