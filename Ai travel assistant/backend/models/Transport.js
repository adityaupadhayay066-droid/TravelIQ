const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Transport = sequelize.define('Transport', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  transport_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transport_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  availability: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  average_speed: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  comfort_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: false
});

module.exports = Transport;
