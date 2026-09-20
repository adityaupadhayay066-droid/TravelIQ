const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trip_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_status: {
    type: DataTypes.STRING,
    defaultValue: 'Paid'
  },
  booking_status: {
    type: DataTypes.STRING,
    defaultValue: 'Confirmed'
  },
  booking_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  source_station_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destination_station_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  train_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  travel_class: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ticket_fare: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  seat_preference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  berth_preference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  adult_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  child_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  infant_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  senior_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_passengers: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  passengers: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: false
});

module.exports = Booking;
