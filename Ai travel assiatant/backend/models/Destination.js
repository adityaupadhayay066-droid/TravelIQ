const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Destination = sequelize.define('Destination', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'India'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  popularity: {
    type: DataTypes.INTEGER,
    defaultValue: 80
  },
  best_time_to_visit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  estimated_budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  attractions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  food_recommendations: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  safety_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  local_transport: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: ['Popular', 'Historical']
  },
  status: {
    type: DataTypes.ENUM('active', 'draft', 'archived'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'destinations'
});

module.exports = Destination;
