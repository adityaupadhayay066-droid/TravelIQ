const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Complaint' // Bug, Complaint, Suggestion
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Medium' // Low, Medium, High, Critical
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Open' // Open, In Progress, Closed
  },
  admin_reply: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = SupportTicket;
