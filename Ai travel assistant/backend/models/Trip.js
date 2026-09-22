const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false
  },
  departure_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  return_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  travel_mode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  predicted_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  predicted_time: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  ai_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Trip;
