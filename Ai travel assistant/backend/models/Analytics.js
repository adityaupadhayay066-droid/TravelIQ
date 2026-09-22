const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  route_accuracy: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  ai_prediction_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  total_saved_money: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total_saved_time: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
}, {
  timestamps: false
});

module.exports = Analytics;
