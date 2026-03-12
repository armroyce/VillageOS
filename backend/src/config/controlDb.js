const { Sequelize } = require('sequelize');
require('dotenv').config();

const controlDb = new Sequelize(process.env.CONTROL_DB_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false,
  },
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

module.exports = controlDb;
