const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TrainFare = sequelize.define('TrainFare', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  train_number: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  class_code: {
    type: DataTypes.STRING(10), // e.g., '1A', '2A', '3A', 'SL', 'UR'
    allowNull: false
  },
  fare: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  distance: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'train_fares',
  timestamps: true,
  indexes: [
    {
      fields: ['train_number']
    },
    {
      fields: ['train_number', 'class_code'],
      unique: true
    }
  ]
});

module.exports = TrainFare;
