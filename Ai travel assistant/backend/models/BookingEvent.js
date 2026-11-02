'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BookingEvent = sequelize.define('BookingEvent', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  idempotent_event_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  delivery_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'PENDING'
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'booking_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = BookingEvent;
