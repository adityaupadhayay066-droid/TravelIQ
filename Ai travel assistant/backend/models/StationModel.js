const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StationModel = sequelize.define('StationModel', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    station_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    station_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    model_data: {
        type: DataTypes.JSON,
        allowNull: false
    }
}, {
    tableName: 'station_models',
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = StationModel;
