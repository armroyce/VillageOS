const { DataTypes } = require('sequelize');
const controlDb = require('../../config/controlDb');

const Subscription = controlDb.define('Subscription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  village_id: { type: DataTypes.UUID, allowNull: false },
  plan: { type: DataTypes.ENUM('free', 'standard', 'premium'), defaultValue: 'free' },
  status: { type: DataTypes.ENUM('active', 'expired', 'suspended'), defaultValue: 'active' },
  expires_at: { type: DataTypes.DATE },
}, { tableName: 'subscriptions', timestamps: true, underscored: true });

module.exports = Subscription;
