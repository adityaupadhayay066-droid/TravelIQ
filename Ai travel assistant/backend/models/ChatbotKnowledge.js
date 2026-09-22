const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatbotKnowledge = sequelize.define('ChatbotKnowledge', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    keywords: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Comma separated list of keywords or phrases'
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'General'
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = ChatbotKnowledge;
