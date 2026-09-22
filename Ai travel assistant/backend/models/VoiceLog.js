const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VoiceLog = sequelize.define('VoiceLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    query_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    response_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'en'
    },
    detected_intent: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: 'voice_logs',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = VoiceLog;
