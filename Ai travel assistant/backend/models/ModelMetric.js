const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ModelMetric = sequelize.define('ModelMetric', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  model_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  model_version: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  accuracy: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  loss: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true
  },
  training_samples: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Active'
  },
  metrics_data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  last_trained_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'model_metrics',
  timestamps: false
});

module.exports = ModelMetric;
