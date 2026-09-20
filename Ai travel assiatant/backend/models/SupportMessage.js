const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const SupportTicket = require('./SupportTicket');

const SupportMessage = sequelize.define('SupportMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ticket_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: SupportTicket,
      key: 'id'
    }
  },
  sender_type: {
    type: DataTypes.ENUM('User', 'Admin'),
    allowNull: false
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = SupportMessage;
