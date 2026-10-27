'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HotelReservation = sequelize.define('HotelReservation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  reservation_code: {
    type: DataTypes.STRING(64),
    unique: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hotel_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'Hotel'
  },
  is_hostel: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  room_type: {
    type: DataTypes.STRING(100),
    defaultValue: 'Standard'
  },
  units_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  guests_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  guest_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  guest_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  guest_phone: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  gov_id_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'Aadhaar Card'
  },
  gov_id_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  gov_id_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  gov_id_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'PENDING_KYC'
  },
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  nights: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  meal_plan: {
    type: DataTypes.STRING(50),
    defaultValue: 'Room Only'
  },
  special_requests: {
    type: DataTypes.JSON,
    allowNull: true
  },
  payment_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'Pay at Property'
  },
  payment_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'PENDING'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED'),
    defaultValue: 'CONFIRMED'
  },
  rate_per_night: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  base_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  meals_total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  promo_code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  taxes: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  grand_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  cancellation_reason: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  refund_status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  qr_checkin_code: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'hotel_reservations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = HotelReservation;
