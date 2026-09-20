const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RecommendationLog = sequelize.define('RecommendationLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  recommendation_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  criteria: {
    type: DataTypes.JSON,
    allowNull: false
  },
  results: {
    type: DataTypes.JSON,
    allowNull: false
  },
  feedback_rating: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'recommendation_logs',
  timestamps: false
});

module.exports = RecommendationLog;
