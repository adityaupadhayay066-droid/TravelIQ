const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserActivityLog = sequelize.define('UserActivityLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    event_type: {
        type: DataTypes.STRING,
        allowNull: false
        // e.g., 'LOGIN_SUCCESS', 'LOGOUT', 'PASSWORD_CHANGE', 'SESSION_TERMINATED', 'FAILED_LOGIN'
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    device_info: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user_activity_logs',
    timestamps: false
});

module.exports = UserActivityLog;
