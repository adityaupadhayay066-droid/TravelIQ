const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DocumentChunk = sequelize.define('DocumentChunk', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    document_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    chunk_index: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'document_chunks',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = DocumentChunk;
