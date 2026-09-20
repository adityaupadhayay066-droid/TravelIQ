const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Route = sequelize.define('Route', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trip_id: {
    type: DataTypes.INTEGER,
    allowNull: true // Assuming a route can be associated with a trip
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transport_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  route_path: {
    type: DataTypes.JSON, // Stores the path geometry or list of coordinates
    allowNull: true
  },
  estimated_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  estimated_time: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  carbon_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  delay_probability: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  }
}, {
  timestamps: false
});

module.exports = Route;
