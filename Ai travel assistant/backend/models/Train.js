const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Train = sequelize.define('Train', {
  train_number: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  train_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'trains',
  timestamps: true
});

module.exports = Train;
