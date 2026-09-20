const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SearchAnalytics = sequelize.define('SearchAnalytics', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('SUCCESS', 'NO_TRAINS'),
    defaultValue: 'SUCCESS'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  tableName: 'search_analytics',
  timestamps: true,
  createdAt: 'search_date',
  updatedAt: false
});

module.exports = SearchAnalytics;
