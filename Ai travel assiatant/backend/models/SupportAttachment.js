const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const SupportTicket = require('./SupportTicket');

const SupportAttachment = sequelize.define('SupportAttachment', {
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
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = SupportAttachment;
