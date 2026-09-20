const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SosAlert = sequelize.define('SosAlert', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    device: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('active', 'resolved', 'false_alarm'),
        defaultValue: 'active'
    }
}, {
    tableName: 'sos_alerts',
    timestamps: true
});

module.exports = SosAlert;
