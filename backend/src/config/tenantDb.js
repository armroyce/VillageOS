const { Sequelize } = require('sequelize');

const tenantConnections = new Map();

function getTenantDb(connectionString) {
  if (tenantConnections.has(connectionString)) {
    return tenantConnections.get(connectionString);
  }
  const db = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false,
    },
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  });
  tenantConnections.set(connectionString, db);
  return db;
}

module.exports = { getTenantDb };
