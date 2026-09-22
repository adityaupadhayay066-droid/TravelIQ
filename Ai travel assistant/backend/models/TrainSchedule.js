const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TrainSchedule = sequelize.define('TrainSchedule', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  train_number: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  station_code: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  arrival_time: {
    type: DataTypes.STRING(10), // e.g., "14:30:00"
    allowNull: true
  },
  departure_time: {
    type: DataTypes.STRING(10), // e.g., "14:35:00"
    allowNull: true
  },
  day_count: {
    type: DataTypes.INTEGER, // e.g., 1, 2, 3
    allowNull: true,
    defaultValue: 1
  },
  stop_sequence: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'train_schedules',
  timestamps: true,
  indexes: [
    {
      fields: ['station_code']
    },
    {
      fields: ['train_number']
    },
    {
      fields: ['station_code', 'train_number']
    }
  ]
});

module.exports = TrainSchedule;
