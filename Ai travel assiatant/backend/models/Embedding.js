const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Embedding = sequelize.define('Embedding', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chunk_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    vector: {
        type: DataTypes.JSON,
        allowNull: false
    }
}, {
    tableName: 'embeddings',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Embedding;
