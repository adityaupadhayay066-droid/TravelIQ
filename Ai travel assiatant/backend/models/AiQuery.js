const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AiQuery = sequelize.define('AiQuery', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    query: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    response: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    confidence_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    vector_db_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Active'
    }
}, {
    tableName: 'ai_queries',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = AiQuery;
