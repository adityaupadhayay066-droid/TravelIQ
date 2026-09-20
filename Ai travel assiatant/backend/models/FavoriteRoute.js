const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FavoriteRoute = sequelize.define('FavoriteRoute', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  source_code: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  dest_code: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  source_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  dest_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'favorite_routes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = FavoriteRoute;
