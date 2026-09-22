const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  station_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true
  },
  station_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  }
}, {
  tableName: 'stations',
  timestamps: true
});

module.exports = Station;
