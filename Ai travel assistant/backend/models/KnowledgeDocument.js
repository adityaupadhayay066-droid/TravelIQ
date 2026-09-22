const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const KnowledgeDocument = sequelize.define('KnowledgeDocument', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    content: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Travel Guide'
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'processing'
    }
}, {
    tableName: 'knowledge_documents',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = KnowledgeDocument;
