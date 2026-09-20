const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FoodRecommendation = sequelize.define('FoodRecommendation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  food_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  restaurant: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 4.0
  },
  price_range: {
    type: DataTypes.ENUM('$', '$$', '$$$'),
    allowNull: false,
    defaultValue: '$$'
  },
  is_veg: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  must_try: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  tableName: 'food_recommendations'
});

module.exports = FoodRecommendation;
