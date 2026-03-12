const { DataTypes } = require('sequelize');
const controlDb = require('../../config/controlDb');

const GlobalPermission = controlDb.define('GlobalPermission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.STRING },
}, { tableName: 'global_permissions', timestamps: true, underscored: true });

module.exports = GlobalPermission;
