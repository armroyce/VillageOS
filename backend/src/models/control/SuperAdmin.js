const { DataTypes } = require('sequelize');
const controlDb = require('../../config/controlDb');

const SuperAdmin = controlDb.define('SuperAdmin', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  assigned_villages: { type: DataTypes.JSONB, defaultValue: [] },
  is_root: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'super_admins', timestamps: true, underscored: true });

module.exports = SuperAdmin;
