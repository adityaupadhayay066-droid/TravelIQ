const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminNotification = sequelize.define('AdminNotification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('system_alert', 'data_import', 'api_failure', 'critical_report', 'security_alert', 'user_action'),
    defaultValue: 'system_alert'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'critical'),
    defaultValue: 'info'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  action_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  tableName: 'admin_notifications'
});

module.exports = AdminNotification;
