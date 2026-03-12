const { DataTypes } = require('sequelize');
const controlDb = require('../../config/controlDb');

const AuditLog = controlDb.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  actor_id: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING, allowNull: false },
  target: { type: DataTypes.STRING },
  ip_address: { type: DataTypes.STRING },
}, { tableName: 'audit_logs', timestamps: true, updatedAt: false, underscored: true });

module.exports = AuditLog;
