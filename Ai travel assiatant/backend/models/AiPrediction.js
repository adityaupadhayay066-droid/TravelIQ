const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AiPrediction = sequelize.define('AiPrediction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  prediction_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  input_data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  output_data: {
    type: DataTypes.JSON,
    allowNull: false
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  latency_ms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ai_predictions',
  timestamps: false
});

module.exports = AiPrediction;
