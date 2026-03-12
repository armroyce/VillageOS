const { DataTypes } = require('sequelize');
const controlDb = require('../../config/controlDb');

const Village = controlDb.define('Village', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  subdomain: { type: DataTypes.STRING, allowNull: false, unique: true },
  db_connection_string: { type: DataTypes.TEXT, allowNull: false }, // AES-256 encrypted
  logo_url: { type: DataTypes.STRING },
  theme_color: { type: DataTypes.STRING, defaultValue: '#1B4D3E' },
  language_default: { type: DataTypes.STRING(5), defaultValue: 'en' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'villages', timestamps: true, underscored: true });

module.exports = Village;
