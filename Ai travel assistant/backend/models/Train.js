const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Train = sequelize.define('Train', {
  train_number: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  train_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  source_station: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  destination_station: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  runs_on: {
    type: DataTypes.JSON, // e.g. ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    allowNull: true,
    defaultValue: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Regular'
  },
  frequency: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Daily'
  }
}, {
  tableName: 'trains',
  timestamps: true
});

module.exports = Train;

