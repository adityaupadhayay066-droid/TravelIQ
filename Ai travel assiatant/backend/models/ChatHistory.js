const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatHistory = sequelize.define('ChatHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true // Allow null for anonymous sessions
    },
    user_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    bot_reply: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = ChatHistory;
